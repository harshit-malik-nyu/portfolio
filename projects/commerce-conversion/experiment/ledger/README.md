# Assignment-to-decision evidence

A synthetic work sample connecting **data** engineering and SQL validation, **business** change control and investment judgment, and **product** measurement design. It extends the aggregate experiment lab with inspectable row-level evidence. No employer, customer or real experiment is represented.

## Reproduce

Python 3.12 and Node 22; no package installation or network calls required:

```sh
python projects/commerce-conversion/experiment/ledger/test_ledger.py
python projects/commerce-conversion/experiment/ledger/build.py
python projects/commerce-conversion/experiment/ledger/analyze.py projects/commerce-conversion/experiment/ledger/output/fixture.synthetic.json
```

The builder creates the source fixture, SQL audit, decision-engine handoff, browser readout and SHA-256 manifest. CI rebuilds and checks them against the committed version. The analyzer prints only aggregate JSON; malformed fixtures exit 2 without emitting partial metrics or identifiers. Exit 0 means the input contract passed, **not** approval to launch.

## Source and data dictionary

The deterministic generator constructs 1,000 assignments in each arm. It is not a randomization algorithm and has no known real causal effect. Exposures are deliberately unequal; purchases are deliberately selected to illustrate denominator bias. No historical Retailrocket rows are used here.

| Field | Contract |
|---|---|
| evidence | Must be `synthetic`; this workflow is practice material |
| as_of | UTC cutoff; whole-second `YYYY-MM-DDTHH:MM:SSZ` |
| assignments.visitor_id | Immutable synthetic visitor identity, one arm and assignment timestamp |
| assignments.arm | `control` or `treatment`; planned comparison is 50:50 |
| assignments.assigned_at | Start of the visitor's seven-day observation window |
| events.event_id | Immutable event identity; exact retries collapse, conflicts block |
| events.visitor_id | Must exist in the assignment table |
| events.kind | `exposure`, `purchase` or `harm` |
| events.arm | Must equal assignment arm, including records outside the outcome window |
| events.occurred_at | Must be within assignment-to-cutoff range; outcomes at day seven are excluded |

Only listed fields are allowed. Input bounds are 8 MiB and 50,000 combined rows. This is an in-memory local workflow, not a production ingestion service.

## Analytical contract

- Primary population: **all assignments**, including visitors with no exposure, no events or incomplete follow-up. Join events onto assignments, never start from purchasers or exposures.
- Binary outcomes: at most one buyer and one harmed visitor per assignment. Multiple purchases do not inflate either the buyer count or denominator.
- Window: `[assigned_at, assigned_at + 7 days)`. Events at exactly the end are excluded. Window maturity is true when the cutoff reaches its end; elapsed time alone does not prove telemetry completeness.
- Exposure-only rates are descriptive diagnostics. They must not replace the primary population or be interpreted as causal effects.
- Outcomes before or without recorded exposure remain in the all-assigned count and are reported as diagnostics. Such cases could indicate logging issues or legitimate unexposed outcomes; silently discarding them introduces selection.
- Identity, time and cross-arm conflicts reject the entire fixture. No partial result is published.
- The SQL groups by assignment and reduces binary outcomes with `MAX` before arm aggregation. An index supports the visitor/time join. No latency or production-scale benchmark is claimed.

## Decision handoff

`output/decision.json` uses SQL-derived counts in the existing Wilson/SRM/economic/harm engine. The three design assertions stay **false**: consistent supplied records do not prove independent assignment, complete instrumentation or a preregistered horizon. The resulting `INVALID / NOT READY` is intentional. Inspect the [business decision record](decision-record.md) for the decision owner, alternatives, release criteria and unresolved approvals.

The example's observed difference is 6 percentage points all-assigned versus 21.11 points exposed-only. Both are synthetic descriptive contrasts. Equal assignment counts do not establish randomized assignment, and an SRM pass cannot diagnose every form of bias.

## Verification and limits

Thirteen regression tests include 50 generated variants compared with a separately implemented set-based oracle, boundary times, retries, repeated purchases, no-event visitors, immature follow-up, conflicting records, strict input decoding and fail-closed CLI output. The oracle checks aggregation, not causal identification. Source hashes identify inputs; they are not an external review.

No real deployment, observed stakeholder acceptance, platform certification, source completeness, experiment preregistration or candidate performance is asserted. The all-assigned difference cannot support a real launch in this fixture.

Method context: [Microsoft Research on diagnosing sample ratio mismatch](https://www.microsoft.com/en-us/research/articles/diagnosing-sample-ratio-mismatch-in-a-b-testing/) explains why selected populations and logging failures require investigation before effect interpretation. This implementation is an independent educational example, not a Microsoft implementation or endorsement.
