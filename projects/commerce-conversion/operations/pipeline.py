"""Transactional commerce reporting demonstration. Python standard library only."""
import argparse
import hashlib
import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path

FIELDS = {'event_id', 'occurred_at', 'visitor_id', 'event', 'order_id'}
EVENTS = {'view', 'addtocart', 'transaction'}
SCHEMA = '''
CREATE TABLE IF NOT EXISTS events (
 event_id TEXT PRIMARY KEY, occurred_at TEXT NOT NULL, visitor_id TEXT NOT NULL,
 event TEXT NOT NULL, order_id TEXT);
CREATE TABLE IF NOT EXISTS batches (batch_id TEXT PRIMARY KEY, digest TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reports (version INTEGER PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit (sequence INTEGER PRIMARY KEY, payload TEXT NOT NULL);
'''
DAILY_SQL = '''
SELECT substr(occurred_at,1,10) AS day,
 COUNT(*) AS events, COUNT(DISTINCT visitor_id) AS visitors,
 COUNT(DISTINCT CASE WHEN event='transaction' THEN visitor_id END) AS buyers,
 COUNT(DISTINCT CASE WHEN event='transaction' THEN order_id END) AS orders
FROM events GROUP BY day ORDER BY day
'''


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False)


def stamp(value):
    if not isinstance(value, str):
        raise ValueError('Timestamp must be a UTC string')
    dt = datetime.strptime(value, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
    if dt.strftime('%Y-%m-%dT%H:%M:%SZ') != value:
        raise ValueError('Timestamp must use YYYY-MM-DDTHH:MM:SSZ')
    return dt


def connect(path):
    db = sqlite3.connect(path)
    db.executescript(SCHEMA)
    return db


def latest(db):
    row = db.execute('SELECT payload FROM reports ORDER BY version DESC LIMIT 1').fetchone()
    return json.loads(row[0]) if row else None


def audit(db, record):
    db.execute('INSERT INTO audit(payload) VALUES (?)', (canonical(record),))
    db.commit()


def refresh(db, batch, as_of):
    """Atomically ingest a batch and publish one report; failures only append audit."""
    prior = latest(db)
    version = prior['version'] if prior else 0
    batch_id = batch.get('batch_id') if isinstance(batch, dict) else None
    try:
        now = stamp(as_of)
        if not isinstance(batch, dict) or set(batch) != {'batch_id', 'complete_through', 'events'}:
            raise ValueError('Batch schema mismatch')
        if not isinstance(batch_id, str) or not batch_id.strip():
            raise ValueError('Missing batch identity')
        watermark = stamp(batch['complete_through'])
        if watermark > now or now - watermark > timedelta(hours=36):
            raise ValueError('Source completeness watermark is future-dated or stale (>36h)')
        if prior and (as_of < prior['as_of'] or batch['complete_through'] < prior['complete_through']):
            raise ValueError('Clock or source completeness watermark moved backwards')
        if not isinstance(batch['events'], list):
            raise ValueError('Events must be a list')
        normalized = []
        seen = {}
        duplicates = 0
        for event in batch['events']:
            if not isinstance(event, dict) or set(event) != FIELDS:
                raise ValueError('Event schema mismatch')
            for field in ('event_id', 'visitor_id'):
                if not isinstance(event[field], str) or not event[field].strip():
                    raise ValueError('Missing event or visitor identity')
            if not isinstance(event['event'], str) or event['event'] not in EVENTS:
                raise ValueError('Unknown event type')
            if stamp(event['occurred_at']) > watermark:
                raise ValueError('Event occurs after source completeness watermark')
            order = event['order_id']
            if event['event'] == 'transaction':
                if not isinstance(order, str) or not order.strip():
                    raise ValueError('Transaction missing order identity')
            elif order is not None:
                raise ValueError('Non-transaction has an order identity')
            encoded = canonical(event)
            if event['event_id'] in seen:
                if seen[event['event_id']] != encoded:
                    raise ValueError('Conflicting duplicate event identity')
                duplicates += 1
                continue
            seen[event['event_id']] = encoded
            normalized.append(event)
        digest = hashlib.sha256(canonical(batch).encode()).hexdigest()
        known = db.execute('SELECT digest FROM batches WHERE batch_id=?', (batch_id,)).fetchone()
        if known:
            if known[0] != digest:
                raise ValueError('Batch identity reused with changed content')
            record = {'status': 'REPLAY', 'batch_id': batch_id, 'retained_version': version}
            audit(db, record)
            return record
        inserted = late = 0
        db.execute('BEGIN IMMEDIATE')
        for event in normalized:
            old = db.execute('SELECT event_id,occurred_at,visitor_id,event,order_id FROM events WHERE event_id=?',
                             (event['event_id'],)).fetchone()
            values = tuple(event[k] for k in ('event_id', 'occurred_at', 'visitor_id', 'event', 'order_id'))
            if old:
                if tuple(old) != values:
                    raise ValueError('Existing event identity conflicts with incoming content')
                duplicates += 1
                continue
            db.execute('INSERT INTO events VALUES (?,?,?,?,?)', values)
            inserted += 1
            late += int(bool(prior and event['occurred_at'] <= prior['complete_through']))
        # Order IDs are globally unique in this demonstration contract. Multi-row orders
        # must agree on buyer and UTC date; this avoids cross-day double counting.
        conflict = db.execute('''SELECT order_id FROM events WHERE event='transaction'
          GROUP BY order_id HAVING COUNT(DISTINCT visitor_id)>1
          OR COUNT(DISTINCT substr(occurred_at,1,10))>1 LIMIT 1''').fetchone()
        if conflict:
            raise ValueError('Order identity spans multiple buyers or UTC dates')
        daily = []
        for day, count, visitors, buyers, orders in db.execute(DAILY_SQL):
            end = stamp(day + 'T00:00:00Z') + timedelta(days=1)
            daily.append({'day': day, 'events': count, 'visitors': visitors, 'buyers': buyers,
                          'orders': orders, 'buyer_rate': buyers / visitors,
                          'status': 'CLOSED' if end <= watermark else 'PARTIAL'})
        previous = {r['day']: r for r in prior['daily']} if prior else {}
        restated = [r['day'] for r in daily if r['day'] in previous and
                    any(r[k] != previous[r['day']][k] for k in ('events','visitors','buyers','orders'))]
        report = {'version': version + 1, 'as_of': as_of, 'complete_through': batch['complete_through'],
                  'evidence_type': 'SYNTHETIC_OPERATIONAL_DEMONSTRATION',
                  'metric': 'same-day observed buyers / observed visitors; not attributed conversion',
                  'daily': daily, 'restated_days': restated}
        db.execute('INSERT INTO batches VALUES (?,?)', (batch_id, digest))
        db.execute('INSERT INTO reports VALUES (?,?)', (version + 1, canonical(report)))
        record = {'status': 'PUBLISHED', 'batch_id': batch_id, 'version': version + 1,
                  'inserted': inserted, 'duplicates': duplicates, 'late_events': late,
                  'restated_days': restated, 'source_sha256': digest}
        db.execute('INSERT INTO audit(payload) VALUES (?)', (canonical(record),))
        db.commit()
        return record
    except (ValueError, TypeError) as exc:
        db.rollback()
        record = {'status': 'REJECTED', 'batch_id': batch_id, 'reason': str(exc),
                  'retained_version': version}
        audit(db, record)
        return record
    except Exception:
        db.rollback()
        raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', required=True)
    parser.add_argument('--batch', required=True)
    parser.add_argument('--as-of', required=True)
    args = parser.parse_args()
    with connect(args.db) as db:
        result = refresh(db, json.loads(Path(args.batch).read_text()), args.as_of)
        print(json.dumps({'refresh': result, 'last_trusted_report': latest(db)}, indent=2))
    raise SystemExit(2 if result['status'] == 'REJECTED' else 0)
