# Source-to-event reconciliation

An independent AI-assisted work sample for Data, Business and Product Analyst review. The bundled snapshots are **synthetic**. They demonstrate a working reconciliation contract, not actual revenue, operational adoption or stakeholder sign-off.

## Decision

May the supplied transaction export support further analysis of completed orders in this window? The event audit diagnoses within-file problems; this project adds a declared source ledger so that missing transactions can be detected too. It does not establish the authenticity or completeness of that source itself.

## Metric and input contract

Input is one UTF-8 JSON snapshot, schemaVersion 1, at most 5 MiB, with `evidence` (`synthetic` or `approved_local`), `start`, `end`, `asOf`, integer `graceHours` 0–168, `orders` and `events`. Both arrays contain at most 10,000 supplied records before deduplication. Unexpected keys and duplicate JSON property names reject. CLI never uploads or changes input. Do not supply personal data; the schema permits no personal fields.

- All timestamps use real Gregorian dates, UTC whole seconds, `YYYY-MM-DDTHH:mm:ssZ`. Window is **[start,end)** with `start < end <= asOf`.
- Source rows: `order_id`, `completed_at`, `status` (completed/cancelled), `amount_cents`, `currency`. One final declared status per order; conflicting versions reject. For a cancelled order, completed_at is the original transaction timestamp; it is not an expectation that the order remains completed.
- Event rows: `event_id`, `order_id`, `occurred_at`, `received_at`, `amount_cents`, `currency`. Received time cannot precede occurrence. Events received after asOf cannot repair a historical snapshot.
- Amounts are nonnegative **integer cents**, maximum 1,000,000,000 per row. Booleans/floats reject. Supported currencies USD, EUR, GBP remain separate; this is not an FX or accounting model.
- IDs use 1–80 ASCII letters, digits, underscore or hyphen. Exact redeliveries collapse and are reported. A conflicting ID rejects the entire batch; there is no partial output.
- Expected population: completed orders in the window with completed_at **<= asOf minus graceHours**. More recent completed orders are pending, not missing.
- Observed population: events occurring in the window and received **<= asOf**. Events outside the window are outside this reconciliation. A shifted event time can therefore leave its expected order missing rather than appear as a matched transaction.
- Exactly one observed event must match the order ID, occurrence time, amount and currency. Distinct event IDs for one eligible order are duplicate transactions, not acceptable retries.
- Observed events for neither an eligible nor pending order are unexpected (including cancelled or absent source orders). Pending-order values are not evaluated until mature.
- `matched + missing + duplicate-affected + mismatched = eligible` orders. Per currency, expected source cents equal matched + missing + exception source cents. Exception money is the affected **source amount**, not a loss estimate or observed-event total. No positive/negative netting hides discrepancies.

The asOf watermark, ledger authority and grace period are declared assumptions. The program does not authenticate them. Historical replay requires an actual historical source snapshot; a current ledger cannot reconstruct prior knowledge if statuses changed.

## Reproduce

```sh
python projects/source-reconciliation/test_reconcile.py
python projects/source-reconciliation/build.py
python projects/source-reconciliation/reconcile.py projects/source-reconciliation/fixtures/01-clean-supplied-snapshot.json
```

Python standard library only. No packages, accounts, paid APIs or credentials. Exit 0 means RECONCILED for this supplied scope; exit 2 means MISMATCH, PENDING or NO_ELIGIBLE_ORDERS; exit 3 means rejected input and no stdout report. Do not suppress nonzero exit codes in a quality gate. The CLI prints aggregate reports without source/event identifiers. Input taxonomy/currencies and timestamps remain present and should be reviewed before sharing.

## Business process, alternatives and traceability

**Assumed current process:** check that the transaction export parses and its row total looks plausible. This is a scenario assumption, not an observed employer process.

**Proposed process:** owner declares the source/window/watermark → analyst validates immutable records → SQL reconciles per order → analyst investigates exceptions → source owner corrects or accepts the discrepancy → rerun the same contract. A later cutoff is a new snapshot, not retroactive evidence that the earlier snapshot was complete.

| Alternative | Trade-off | Disposition |
|---|---|---|
| Compare row totals | Simple; duplicate transactions can offset missing ones | Rejected as a completeness gate |
| Reconcile IDs only | Detects missing keys; ignores wrong value, currency and time | Insufficient for stated contract |
| Reconcile immutable source records with a mature window | Detects declared differences; needs a trusted source and appropriate grace | Implemented within supplied snapshots |
| Production finance reconciliation | Requires refunds, partial captures, changing statuses, controls and ownership | Outside this sample; do not imply delivered |

| Requirement | Acceptance evidence | Proposed owner |
|---|---|---|
| SR1 Preserve missing orders | Equal-count fixture reports one missing and one duplicate-affected order despite equal input totals | Data analyst |
| SR2 Avoid look-ahead | After-cutoff transaction is missing in earlier snapshot and reconciles in later snapshot | Analytics engineer |
| SR3 Respect maturity and boundaries | Exact maturity and start included; end excluded; immature population is pending | Product analyst |
| SR4 Preserve monetary meaning | One-cent and currency errors flagged; source cents split without FX or offsetting | Finance/data owner |
| SR5 Reject contradictory identities | Conflicting snapshots and bool/int lookalike duplicates reject | Source engineer |
| SR6 Handle cancelled/absent source orders | Their emitted events block; empty expected population never earns success | Business owner |
| SR7 Fail closed | Invalid JSON/schema/types yield exit 3 and no report | Engineering |
| SR8 Reproduce and communicate | Deterministic fixtures/results; source hashes; selectable scenario and download | Analyst |

**Proposed change request:** "Extend the grace period until the missing-order number becomes zero." Reject as a cosmetic change. More grace reduces the eligible population and may delay decisions without repairing events. Choose latency tolerance from measured delivery behavior and business needs before evaluating the result. Show pending orders separately and version the decision contract.

**Proposed remediation:** missing → source/event delivery owner; duplicate → emitter idempotency owner; amount/currency/time mismatch → mapping owner; cancelled/orphan → source-scope owner. Analyst supplies the exception category, declared cutoff and reproducible case. Production diagnosis would need governed row-level access; this aggregate viewer intentionally exposes no IDs.

**Release acceptance:** tests and deterministic rebuild pass, selected browser scenarios match reports, export preserves the visible choice, no unsupported business impact claims. Production decision stays with the appropriate owner; technical success is not sign-off.

## Verification and limitations

Ten tests include 125 independently constructed combinations of missing/matched/duplicate/amount/currency states for three known orders. Expected counts come from the construction categories rather than another SQL join. Boundary and hand-calculated money cases cover separate risks. This is meaningful finite coverage, not exhaustive correctness, third-party certification, performance certification or personal unaided mastery.

All bundled amounts are invented, and the UI changes among generated snapshots rather than querying a real business system. No refunds, partial captures, currencies beyond those listed, multiple payments, identity stitching, timezone inference, mutation history or accounting recognition. Matching a supplied ledger does not establish that the ledger itself is complete or authoritative.
