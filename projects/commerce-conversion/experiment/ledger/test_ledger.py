import copy
import importlib.util
import json
from pathlib import Path
import random
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("experiment_ledger_audit", ROOT / "analyze.py")
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


def fixture():
    return {"evidence": "synthetic", "as_of": "2026-01-09T00:00:00Z",
            "assignments": [{"visitor_id": v, "arm": arm, "assigned_at": "2026-01-01T00:00:00Z"} for v, arm in [("c", "control"), ("t", "treatment")]],
            "events": [{"event_id": "p", "visitor_id": "t", "kind": "purchase", "arm": "treatment", "occurred_at": "2026-01-02T00:00:00Z"}]}


class LedgerTests(unittest.TestCase):
    def test_population_retained_when_both_arms_have_events(self):
        x = fixture()
        x['assignments'].append({**x['assignments'][0], 'visitor_id': 'no-events'})
        x['events'].append({'event_id': 'control-view', 'visitor_id': 'c', 'kind': 'exposure', 'arm': 'control', 'occurred_at': '2026-01-02T00:00:00Z'})
        r = audit.analyze(x)
        self.assertEqual(r['arms']['control']['assigned'], 2)
        self.assertEqual(r['arms']['treatment']['assigned'], 1)

    def test_left_join_keeps_unexposed_and_zero_event_people(self):
        result = audit.analyze(fixture())
        self.assertEqual(result["arms"]["control"]["assigned"], 1)
        self.assertEqual(result["arms"]["treatment"]["buyers"], 1)
        self.assertIsNone(result["exposed_only_lift"])
        self.assertEqual(result["diagnostics"]["outcome_events_without_prior_exposure"], 1)
        self.assertEqual(result["causal_readiness"], "UNCONFIRMED")

    def test_retries_and_multiple_purchases_do_not_inflate(self):
        x = fixture()
        x["assignments"].append(dict(x["assignments"][0]))
        x["events"].append(dict(x["events"][0]))
        x["events"].append({**x["events"][0], "event_id": "p2"})
        r = audit.analyze(x)
        self.assertEqual(r["arms"]["treatment"]["buyers"], 1)
        self.assertEqual(r["diagnostics"]["duplicate_assignments"], 1)
        self.assertEqual(r["diagnostics"]["duplicate_events"], 1)

    def test_window_end_excluded_and_maturity_inclusive(self):
        x = fixture()
        x["as_of"] = x["events"][0]["occurred_at"] = "2026-01-08T00:00:00Z"
        r = audit.analyze(x)
        self.assertEqual(r["arms"]["treatment"]["buyers"], 0)
        self.assertEqual(r["arms"]["treatment"]["mature"], 1)
        self.assertEqual(r["diagnostics"]["events_outside_outcome_window"], 1)

    def test_immature_people_retained(self):
        x = fixture(); x["as_of"] = "2026-01-03T00:00:00Z"
        r = audit.analyze(x)
        self.assertEqual(r["gate_counts"]["treatmentN"], 1)
        self.assertEqual(r["gate_counts"]["treatmentMature"], 0)

    def test_conflicting_assignment_rejected(self):
        x = fixture(); x["assignments"].append({**x["assignments"][0], "arm": "treatment"})
        with self.assertRaises(audit.ContractError): audit.analyze(x)

    def test_conflicting_event_rejected(self):
        x = fixture(); x["events"].append({**x["events"][0], "kind": "harm"})
        with self.assertRaises(audit.ContractError): audit.analyze(x)

    def test_unknown_visitor_and_cross_arm_rejected(self):
        for key, value in [("visitor_id", "unknown"), ("arm", "control")]:
            with self.subTest(key=key):
                x = fixture(); x["events"][0][key] = value
                with self.assertRaises(audit.ContractError): audit.analyze(x)

    def test_early_future_malformed_and_non_utc_time_rejected(self):
        for when in ["2025-12-31T00:00:00Z", "2026-01-10T00:00:00Z", "2026-02-30T00:00:00Z", "2026-01-02T00:00:00+00:00", None]:
            with self.subTest(when=when):
                x = fixture(); x["events"][0]["occurred_at"] = when
                with self.assertRaises(audit.ContractError): audit.analyze(x)

    def test_schema_and_evidence_type_rejected(self):
        for change in [lambda x: x.update(evidence="real"), lambda x: x.update(extra="value"),
                       lambda x: x["events"][0].update(kind="click"), lambda x: x.update(assignments=[]),
                       lambda x: x["assignments"][0].update(assigned_at="2026-01-10T00:00:00Z")]:
            x = fixture(); change(x)
            with self.assertRaises(audit.ContractError): audit.analyze(x)

    def test_input_not_mutated_and_output_contains_no_identifiers(self):
        x = fixture(); before = copy.deepcopy(x)
        r = audit.analyze(x)
        self.assertEqual(x, before)
        self.assertNotIn("visitor_id", json.dumps(r))
        self.assertNotIn("event_id", json.dumps(r))

    def test_fifty_variants_against_set_based_oracle(self):
        for seed in range(50):
            rng = random.Random(seed)
            x = fixture(); x["assignments"] = []; x["events"] = []
            expected = {}
            for arm in ("control", "treatment"):
                people = {f"{arm}-{i}" for i in range(rng.randrange(1, 30))}
                sets = {k: set() for k in ("purchase", "exposure", "harm")}
                for v in sorted(people):
                    x["assignments"].append({"visitor_id": v, "arm": arm, "assigned_at": "2026-01-01T00:00:00Z"})
                    for kind in sets:
                        if rng.random() < .4:
                            sets[kind].add(v)
                            event = {"event_id": f"{kind}-{v}", "visitor_id": v, "arm": arm, "kind": kind, "occurred_at": "2026-01-02T00:00:00Z"}
                            x["events"].extend([event, dict(event)])
                expected[arm] = {"assigned": len(people), "buyers": len(sets["purchase"]), "exposed": len(sets["exposure"]), "harmed": len(sets["harm"]), "exposed_buyers": len(sets["purchase"] & sets["exposure"])}
            r = audit.analyze(x)
            with self.subTest(seed=seed):
                for arm in expected:
                    for key, value in expected[arm].items(): self.assertEqual(r["arms"][arm][key], value)

    def test_cli_failure_does_not_emit_partial_metrics_or_raw_identifiers(self):
        x = fixture(); x["events"][0]["visitor_id"] = "private-example-id"
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "input.json"; path.write_text(json.dumps(x))
            r = subprocess.run([sys.executable, str(ROOT / "analyze.py"), str(path)], capture_output=True, text=True)
        self.assertEqual(r.returncode, 2); self.assertEqual(r.stdout, "")
        self.assertNotIn("private-example-id", r.stderr)

    def test_loader_rejects_duplicate_json_keys_and_invalid_utf8(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "input.json"
            path.write_text('{"evidence":"synthetic","evidence":"real"}')
            with self.assertRaises(audit.ContractError): audit.load(path)
            path.write_bytes(b'\xff')
            with self.assertRaises(UnicodeError): audit.load(path)


if __name__ == "__main__": unittest.main()
