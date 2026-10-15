"""Strict offline assignment/event audit; aggregate output, no raw identifiers.

A passing log contract does not establish causal validity or completeness.
Standard-library only. Input is an explicit synthetic practice fixture.
"""
import argparse
import hashlib
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WINDOW = 7 * 24 * 60 * 60
MAX_BYTES = 8 * 1024 * 1024


class ContractError(ValueError):
    pass


def timestamp(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", value):
        raise ContractError("Timestamps must be whole-second UTC ISO strings.")
    try:
        return int(datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc).timestamp())
    except ValueError:
        raise ContractError("Invalid calendar timestamp.") from None


def fields(row, expected):
    if not isinstance(row, dict) or set(row) != set(expected):
        raise ContractError("Unexpected or missing fields.")


def identity(value):
    if not isinstance(value, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", value):
        raise ContractError("Invalid identifier.")
    return value


def analyze(payload):
    fields(payload, ["evidence", "as_of", "assignments", "events"])
    if payload["evidence"] != "synthetic":
        raise ContractError("This practice workflow accepts explicitly synthetic fixtures only.")
    as_of = timestamp(payload["as_of"])
    if not isinstance(payload["assignments"], list) or not isinstance(payload["events"], list):
        raise ContractError("Assignments and events must be arrays.")
    if len(payload["assignments"]) + len(payload["events"]) > 50000:
        raise ContractError("Fixture exceeds 50,000 input rows.")
    assignments, events = {}, {}
    duplicate_assignments = duplicate_events = outside_window = pre_exposure = 0
    for row in payload["assignments"]:
        fields(row, ["visitor_id", "arm", "assigned_at"])
        visitor = identity(row["visitor_id"])
        if row["arm"] not in ("control", "treatment"):
            raise ContractError("Unsupported assignment arm.")
        when = timestamp(row["assigned_at"])
        if when > as_of:
            raise ContractError("Assignment is later than analysis cutoff.")
        value = (row["arm"], when)
        if visitor in assignments:
            if assignments[visitor] != value:
                raise ContractError("Conflicting assignment identity; no metrics published.")
            duplicate_assignments += 1
        assignments[visitor] = value
    if {a[0] for a in assignments.values()} != {"control", "treatment"}:
        raise ContractError("Both arms need at least one assignment.")
    for row in payload["events"]:
        fields(row, ["event_id", "visitor_id", "kind", "arm", "occurred_at"])
        event_id, visitor = identity(row["event_id"]), identity(row["visitor_id"])
        if visitor not in assignments:
            raise ContractError("Event has no assignment; no metrics published.")
        arm, assigned_at = assignments[visitor]
        if row["kind"] not in ("exposure", "purchase", "harm"):
            raise ContractError("Unsupported event kind.")
        if row["arm"] != arm:
            raise ContractError("Cross-arm event detected; no metrics published.")
        when = timestamp(row["occurred_at"])
        if when < assigned_at or when > as_of:
            raise ContractError("Event is outside assignment-to-cutoff time range.")
        value = (visitor, row["kind"], arm, when)
        if event_id in events:
            if events[event_id] != value:
                raise ContractError("Conflicting event identity; no metrics published.")
            duplicate_events += 1
            continue
        events[event_id] = value
        outside_window += when >= assigned_at + WINDOW
    exposures = {}
    for visitor, kind, arm, when in events.values():
        if kind == "exposure" and when < assignments[visitor][1] + WINDOW:
            exposures[visitor] = min(when, exposures.get(visitor, when))
    for visitor, kind, arm, when in events.values():
        if kind in ("purchase", "harm") and when < assignments[visitor][1] + WINDOW:
            # Diagnostic only. ITT outcomes are not discarded for absent/later exposure.
            pre_exposure += visitor not in exposures or when < exposures[visitor]
    with sqlite3.connect(":memory:") as db:
        db.row_factory = sqlite3.Row
        db.executescript("""
            CREATE TABLE assignments(visitor_id TEXT PRIMARY KEY, arm TEXT NOT NULL, assigned_at INTEGER NOT NULL);
            CREATE TABLE events(event_id TEXT PRIMARY KEY, visitor_id TEXT NOT NULL, kind TEXT NOT NULL, arm TEXT NOT NULL, occurred_at INTEGER NOT NULL);
            CREATE INDEX event_visitor_time ON events(visitor_id, occurred_at);
        """)
        db.executemany("INSERT INTO assignments VALUES (?,?,?)", [(v, *a) for v, a in assignments.items()])
        db.executemany("INSERT INTO events VALUES (?,?,?,?,?)", [(e, *v) for e, v in events.items()])
        rows = [dict(r) for r in db.execute((ROOT / "metrics.sql").read_text(), {"as_of": as_of})]
    arms = {r.pop("arm"): r for r in rows}
    for r in arms.values():
        r["itt_purchase_rate"] = r["buyers"] / r["assigned"]
        r["exposed_only_rate"] = r["exposed_buyers"] / r["exposed"] if r["exposed"] else None
    c, t = arms["control"], arms["treatment"]
    return {
        "schema_version": 1, "evidence": "synthetic", "as_of": payload["as_of"],
        "contract_status": "PASSED", "causal_readiness": "UNCONFIRMED",
        "arms": arms,
        "itt_lift": t["itt_purchase_rate"] - c["itt_purchase_rate"],
        "exposed_only_lift": None if any(r["exposed_only_rate"] is None for r in arms.values()) else t["exposed_only_rate"] - c["exposed_only_rate"],
        "diagnostics": {"duplicate_assignments": duplicate_assignments, "duplicate_events": duplicate_events,
                        "events_outside_outcome_window": outside_window, "outcome_events_without_prior_exposure": pre_exposure},
        "gate_counts": {"controlN": c["assigned"], "treatmentN": t["assigned"],
                        "controlBuy": c["buyers"], "treatmentBuy": t["buyers"],
                        "controlHarm": c["harmed"], "treatmentHarm": t["harmed"],
                        "controlMature": c["mature"], "treatmentMature": t["mature"]},
        "unverified": ["Independent randomized assignment and stable real-person identity", "Source completeness and outcome capture", "Preregistered horizon and absence of optional stopping", "No interference or contamination beyond the supplied logs", "Business-owner approval of economic assumptions and harm ceiling"],
    }


def load(path):
    with Path(path).open("rb") as source:
        raw = source.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ContractError("Fixture exceeds 8 MiB.")
    def unique_keys(pairs):
        value = {}
        for key, item in pairs:
            if key in value:
                raise ContractError("Duplicate JSON object key.")
            value[key] = item
        return value
    return json.loads(raw.decode("utf-8"), object_pairs_hook=unique_keys)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("fixture")
    args = parser.parse_args()
    try:
        result = analyze(load(args.fixture))
    except (ContractError, OSError, UnicodeError, json.JSONDecodeError):
        parser.exit(2, "BLOCKED: fixture could not satisfy the input contract; no metrics emitted.\n")
    print(json.dumps(result, indent=2, sort_keys=True, allow_nan=False))
