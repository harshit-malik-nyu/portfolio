# Business requirements and release acceptance

Status: self-directed specification and executable demonstration. Stakeholder roles below are proposed responsibilities, not evidence of a client engagement.

## Decision and ownership

**Decision:** May the analyst publish this daily behavior report, and which historical numbers need review?

**Proposed business owner:** product/commerce lead approves definitions and whether a restatement affects a decision.

**Proposed data owner:** upstream event producer owns event identity, order identity and the source-completeness assertion.

**Analyst responsibility:** validate, reconcile, communicate report status, investigate anomalies and retain traceability. A data-quality pass does not authorize a product launch or claim causal improvement.

## Metric contract v1

| Item | Definition |
|---|---|
| Event grain | One immutable event_id; exact repeats collapse |
| Visitor grain | Observed visitor_id, not a verified person or account |
| Order grain | Globally unique order_id, one buyer and UTC date; multiple rows per order allowed |
| Reporting day | UTC date of occurred_at |
| Visitors | Distinct observed visitor IDs on that day |
| Buyers | Distinct visitor IDs with a transaction on that day |
| Buyer rate | Buyers / visitors for the same day; not an attributed funnel conversion |
| Orders | Distinct transaction order IDs that day; no monetary value implied |
| Complete through | Upstream assertion of completeness; can still be restated for late delivery |
| Closed day | End of the UTC day is at or before complete_through |
| Missing day | Not reported; cannot distinguish zero activity from absent coverage |
| Freshness gate | complete_through is not in the future and is at most 36 hours behind as_of |
| Report version | Increments only after a new valid batch commits |

## Acceptance criteria and traceability

| ID | Given / when / then | Executable test |
|---|---|---|
| AC1 | A successful batch is delivered again; retain the exact report and return REPLAY | test_same_batch_replay_preserves_report |
| AC2 | Events are redelivered under a new batch; count each identity once | test_duplicate_delivery_does_not_inflate_metrics |
| AC3 | A purchase arrives for a closed day; recompute and disclose the restatement | test_late_purchase_restates_closed_day |
| AC4 | One order has multiple rows; count one order | test_multirow_order_is_one_order |
| AC5 | An invalid record follows a valid record; roll back the entire incoming batch | test_order_conflict_rolls_back_every_incoming_event |
| AC6 | A successful batch ID returns with different content; reject it | test_changed_batch_identity_rejected |
| AC7 | Existing event content changes; reject rather than silently overwrite | test_changed_event_identity_rejected |
| AC8 | Event structure or required identity is invalid; do not publish | test_bad_schema_and_invalid_orders_rejected |
| AC9 | Data is future-dated or the source is stale; block publication | test_future_event_and_stale_watermark_rejected |
| AC10 | The source watermark regresses; retain the prior report | test_watermark_cannot_move_backwards |
| AC11 | The day is not complete; label it PARTIAL | test_incomplete_day_is_not_closed |
| AC12 | A rejected batch is corrected; publish and preserve the failure audit | test_recovery_after_failure |
| AC13 | New data publishes; previous report payload stays unchanged | test_historical_report_remains_immutable |

## Release recommendation

Accept this as a local operational demonstration when all tests pass and regenerated published examples match the committed outputs. Do not approve production release until source ownership, identity semantics, real workload scale, security, correction handling, alert delivery and concurrency are validated in the intended environment.

## Business readout of the fixture

Baseline: two visitors, one buyer, buyer rate 50%. A late order restates the same day to two buyers, 100%. A later third visitor changes the rate to 66.7%. These changes are recording updates to invented events, not customer growth, a treatment effect, or evidence that a business improved. Conflicting and stale batches publish nothing.
