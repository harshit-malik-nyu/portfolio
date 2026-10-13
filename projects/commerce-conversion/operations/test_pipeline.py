import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('commerce_operations_pipeline', Path(__file__).with_name('pipeline.py'))
p = importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)


def event(identity='e1', kind='view', visitor='v1', order=None, time='2026-01-01T10:00:00Z'):
    return dict(event_id=identity, occurred_at=time, visitor_id=visitor, event=kind, order_id=order)


def batch(identity='b1', events=None, watermark='2026-01-02T00:00:00Z'):
    return dict(batch_id=identity, complete_through=watermark, events=events if events is not None else [event()])


class RefreshTests(unittest.TestCase):
    def setUp(self):
        self.db = p.connect(':memory:')
        self.now = '2026-01-02T01:00:00Z'

    def tearDown(self):
        self.db.close()

    def run_batch(self, b):
        return p.refresh(self.db, b, self.now)

    def test_same_batch_replay_preserves_report(self):
        self.run_batch(batch())
        before = p.latest(self.db)
        self.assertEqual(self.run_batch(batch())['status'], 'REPLAY')
        self.assertEqual(before, p.latest(self.db))

    def test_duplicate_delivery_does_not_inflate_metrics(self):
        self.run_batch(batch())
        result = self.run_batch(batch('b2', [event(), event()]))
        self.assertEqual(result['duplicates'], 2)
        self.assertEqual(p.latest(self.db)['daily'][0]['events'], 1)

    def test_late_purchase_restates_closed_day(self):
        self.run_batch(batch())
        result = self.run_batch(batch('b2', [event('e2', 'transaction', order='o1')]))
        self.assertEqual(result['late_events'], 1)
        self.assertEqual(result['restated_days'], ['2026-01-01'])
        self.assertEqual(p.latest(self.db)['daily'][0]['buyer_rate'], 1)

    def test_multirow_order_is_one_order(self):
        self.run_batch(batch(events=[event('a', 'transaction', order='o1'), event('b', 'transaction', order='o1')]))
        self.assertEqual(p.latest(self.db)['daily'][0]['orders'], 1)

    def test_order_conflict_rolls_back_every_incoming_event(self):
        self.run_batch(batch(events=[event('a', 'transaction', order='o1')]))
        result = self.run_batch(batch('bad', [event('valid'), event('b', 'transaction', visitor='v2', order='o1')]))
        self.assertEqual(result['status'], 'REJECTED')
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM events').fetchone()[0], 1)
        self.assertEqual(p.latest(self.db)['version'], 1)

    def test_changed_batch_identity_rejected(self):
        self.run_batch(batch())
        self.assertEqual(self.run_batch(batch(events=[event('changed')]))['status'], 'REJECTED')

    def test_changed_event_identity_rejected(self):
        self.run_batch(batch())
        self.assertEqual(self.run_batch(batch('b2', [event(visitor='v2')]))['status'], 'REJECTED')

    def test_bad_schema_and_invalid_orders_rejected(self):
        bad = event(); bad['extra'] = 1
        for row in [bad, event(kind='unknown'), event(kind='transaction'), event(order='o1'), event(visitor='')]:
            with self.subTest(row=row):
                self.assertEqual(self.run_batch(batch(events=[row]))['status'], 'REJECTED')
        self.assertIsNone(p.latest(self.db))

    def test_future_event_and_stale_watermark_rejected(self):
        self.assertEqual(self.run_batch(batch(events=[event(time='2026-01-03T00:00:00Z')]))['status'], 'REJECTED')
        self.assertEqual(self.run_batch(batch(watermark='2025-12-30T00:00:00Z'))['status'], 'REJECTED')

    def test_watermark_cannot_move_backwards(self):
        self.run_batch(batch())
        self.assertEqual(self.run_batch(batch('b2', watermark='2026-01-01T23:00:00Z'))['status'], 'REJECTED')

    def test_incomplete_day_is_not_closed(self):
        self.run_batch(batch(watermark='2026-01-01T23:00:00Z'))
        self.assertEqual(p.latest(self.db)['daily'][0]['status'], 'PARTIAL')

    def test_recovery_after_failure(self):
        self.run_batch(batch())
        bad = batch('b2', [event('e2', 'transaction')])
        self.run_batch(bad)
        bad['events'][0]['order_id'] = 'o1'
        self.assertEqual(self.run_batch(bad)['status'], 'PUBLISHED')
        self.assertEqual(p.latest(self.db)['version'], 2)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM audit').fetchone()[0], 3)

    def test_historical_report_remains_immutable(self):
        self.run_batch(batch())
        before = self.db.execute('SELECT payload FROM reports WHERE version=1').fetchone()[0]
        self.run_batch(batch('b2', [event('new')]))
        self.assertEqual(before, self.db.execute('SELECT payload FROM reports WHERE version=1').fetchone()[0])


if __name__ == '__main__':
    unittest.main()
