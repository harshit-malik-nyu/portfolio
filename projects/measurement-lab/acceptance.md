# Delivery specification and acceptance record

Status: self-directed, AI-assisted work sample. The product request, owners and change request below are simulated; no stakeholder approval is represented.

## Problem and alternatives

**Scenario request:** A product owner wants to know whether checkout failures are followed by successful completion. Counting clicks or inspecting only purchasers could mislead the decision.

**Chosen scope:** local end-to-end instrumentation, transparent events, an export contract and an independent SQL handoff. This proves observable implementation behavior without collecting visitor data remotely.

**Alternatives:**

1. Screenshots only: cheap, but cannot verify event semantics or retry behavior.
2. Local interactive demo: chosen; reproducible, no account or paid infrastructure, limited to demo sessions.
3. Production telemetry and real checkout: appropriate only with privacy, security, payment, identity, monitoring and business approvals. Not implemented or claimed here.

**Value hypothesis:** accurate failure/recovery counts could help a team prioritize instrumentation or checkout investigation. No monetary saving or conversion uplift is estimated from this demo.

## Requirements to acceptance evidence

| ID | Requirement and observable acceptance | Executable evidence |
|---|---|---|
| R1 | Start creates exactly one session-start event before any view; zero-view sessions remain in SQL denominator. | JS ML1; Python `test_independent_sql_preserves_started_denominator` and `test_no_view_yields_undefined_view_rate` |
| R2 | Invalid action produces no event or state change. | JS ML2 |
| R3 | Multiple failures can precede one completion; a second completion cannot inflate outcomes. | JS ML3; Python `test_independent_sql_preserves_started_denominator` |
| R4 | Snapshots cannot mutate internal state; unexpected fields and malformed chronology reject. | JS ML4, ML5, ML7; Python `test_contract_rejections` |
| R5 | Exact redelivery collapses; a changed session snapshot blocks the batch. | Python `test_redelivery_collapses_but_changed_snapshot_blocks` |
| R6 | Synthetic fixtures cannot be mixed with demo activity; invalid batches emit no partial metrics or identifiers. | Python `test_mixed_sources_are_not_poolable`, `test_cli_blocks_entire_batch_without_identifiers`, `test_duplicate_json_fields_reject` |
| R7 | A bounded log fails before partial append; varied populations preserve correct rates and counts. | JS ML6; Python `test_one_hundred_varied_populations_against_counts` |

Automated acceptance status: inspect the CI run and reproduce the commands in README. Test execution is technical verification, not user acceptance or stakeholder sign-off.

## Simulated change request CR-01: replace sessions with viewers

**Request:** Show completed/viewed as the main conversion rate because it looks higher.

**Impact:** In the fixture this changes 1/3 to 1/2 without adding a completion. It removes an assigned session from the denominator. It also changes the question being answered.

**Disposition:** Keep started sessions as the primary population. Offer viewed-session completion as a labeled secondary diagnostic. Do not describe the difference as lift or improved conversion. A genuine change in target population requires a new metric definition and version, a comparable baseline, and owner approval.

**Implemented consequence:** SQL exports both labeled rates. The UI reports completed/started for its one session and explicitly rejects benchmark/causal interpretation. No approval was obtained or invented.

## Proposed responsibilities and release gates

- Product owner: confirm the business question, target population and acceptable failure/recovery definitions.
- Analyst: maintain contract, reconciliation, tests and interpretation; investigate discrepancies.
- Engineer: implement production event delivery, server-confirmed order identity, retry handling, monitoring and rollback if a real deployment is commissioned.
- Privacy/security owner: determine lawful collection, retention and access controls for any real telemetry.

**Demo release:** technical tests pass, fixture rebuild matches, actual browser sequence exports and is accepted by independent SQL, and invalid input fails closed.

**Production release:** HOLD. No remote collector, payment authority, source-completeness proof, real-user experiment, production performance validation or business acceptance exists.

**Rollback:** remove the lab link and restore the previous static deployment. No remote event store needs migration because the demo does not send event logs to a backend. The user may still retain downloads.

## Interview defense

- Why not call the rate customer conversion? A session can be restarted by the same person, and the completion is a demo action rather than a verified purchase.
- Why reject a later snapshot with the same session ID? The batch contract accepts complete snapshots, not mutable incremental streams; silently selecting one would hide contradictory input. A versioned ingestion design would require a separate specification.
- What does the fixture prove? The implementation preserves stated populations and retry semantics on the supplied data. It cannot prove customer outcomes, complete telemetry, or personal mastery of every implementation detail.

## Executed browser acceptance

An agent-operated live browser started a session, viewed, added to cart, failed twice and completed once. The completion button was then disabled. Its downloaded six-event log was accepted by the independent Python/SQL path: one started, viewed, carted, completed and recovered session, with two failed attempts. Clearing removed the in-memory events and disabled export. `browser-verification.json` preserves the exact exported log, its original file hash, source hashes and SQL result. This was technical UI verification, not business-owner acceptance or real customer behavior. A clean-URL relative-asset defect was found during verification and fixed with absolute asset paths before this successful run.

## Review requirements R8–R10

| ID | Observable acceptance | Evidence |
|---|---|---|
| R8 | A valid multi-session export produces the same aggregates and population rates in the browser and Python/SQLite. | `verify_review.py`, 100 seeded valid populations including exact redelivery |
| R9 | Invalid or mixed-source batches publish no result; duplicate decoded JSON fields reject before native overwrite. | `measurement-review.test.cjs` and fourteen cross-implementation rejection cases |
| R10 | Editing or clearing invalidates prior results and disables decision-record download; stale async reads cannot overwrite a newer edit. | Browser interaction verification; epoch guards in `review-ui.js` |

The exported decision is deliberately descriptive-only. Technical contract success does not authorize a production rollout. The record exposes both started and viewed denominators instead of accepting the simulated CR-01 denominator substitution.

## Contract portability requirement R11

**Acceptance:** Equivalent integer-valued JSON numbers must agree across browser and Python; invalid numeric types and calendar dates must reject in both. Evidence: `verify_review.py` tests six valid numeric/calendar boundaries and six additional invalid boundaries, alongside the original population and rejection cases. `measurement-review.test.cjs` checks the recording clock as well as imported logs.

This requirement closes the observed contract discrepancy recorded in [contract-review.md](contract-review.md). It is technical acceptance of the demo, not stakeholder approval.
