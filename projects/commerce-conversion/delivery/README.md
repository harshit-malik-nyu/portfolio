# Commerce reporting: product delivery work sample

Self-directed simulation derived from the executable reporting pipeline. No client incidents, interviews, Jira usage, production deployment or stakeholder approvals are claimed.

## Problem and discovery
A product lead sees a buyer-rate change and needs to distinguish customer behavior from late arrivals or a broken refresh. The evidence source is the six generated pipeline scenarios, not user interviews. Proposed discovery questions: Which decisions depend on this report? What delay is tolerable? Who owns source completeness? Which restatements require renewed approval? Confirm these with actual stakeholders before production use.

## Delivery backlog

| ID / priority | User story | Acceptance criteria | Evidence / status |
|---|---|---|---|
| P01 / critical | As a report consumer, I need a rejected refresh to retain the last trusted report so I do not act on partial data. | Given a valid row followed by conflicting identity, reject the entire batch; preserve report version; record failure. | Implemented demo: `test_order_conflict_rolls_back_every_incoming_event` and `test_changed_event_identity_rejected` |
| P02 / high | As an analyst, I need late purchases to restate closed days transparently. | Given a late valid purchase, recompute the affected day; disclose restated date; preserve earlier report. | Implemented demo: `test_late_purchase_restates_closed_day` |
| P03 / high | As a product lead, I need stale data clearly blocked. | Given completeness older than 36 hours, reject publication. Keep the original as-of time visible. | Implemented demo: `test_future_event_and_stale_watermark_rejected` |
| P04 / medium | As a data consumer, I need consistent event, visitor and daily grains. | Unique event key, visitor referential integrity, and mart totals reconcile after every delivery. | Implemented local semantic model: `operations/warehouse.py` |
| P05 / production prerequisite | As a privacy owner, I need access, retention and deletion requirements approved before live data ingestion. | Record classification, approved retention, deletion propagation and access review; test in intended environment. | Design requirement; NOT implemented production control |

Prioritization: prevent incorrect publication first, preserve trustworthy measurement second, then improve consumption. These are reasoned priorities, not invented RICE scores or customer-research findings.

## Incident drill: conflicting event identity

**Detection:** pipeline returns REJECTED with reason `Existing event identity conflicts with incoming content`. **Observed impact:** the synthetic report remains version 2; neither incoming row is committed. Availability of the prior report is not freshness of new data.

**Triage:** classify as reporting integrity, identify the incoming batch and conflicting event ID, compare source payloads, assign the proposed data-producer owner. Do not overwrite identity to silence the alert.

**Containment:** hold the refresh, show the retained report's original as-of timestamp, and prevent decisions that require fresh data. Proposed escalation: notify product/analytics owner; escalate immediately if incorrect metrics have already informed a decision. No actual notification was sent.

**Recovery:** correct upstream content, use the documented recovery delivery, inspect inserted/late/restated counts, reconcile the mart, and confirm report version 3. Preserve audit history and communicate affected dates.

**Example status update:** “The refresh is blocked by conflicting event identity. The last trusted report remains available at its original timestamp. No partial rows were published. The source owner must resolve the identity conflict before a corrected refresh and reconciliation.” This is a sample communication, not an actual incident message.

## Release and UAT checklist

- Product/analytics reviewer confirms metric definition and intended decision.
- QA executes replay, late-arrival, identity-conflict, stale-source and recovery scenarios.
- Data reviewer reconciles mart totals with each retained report.
- Release notes disclose any restated date and metric-definition change.
- Security/privacy reviewer approves production prerequisites separately; a local test pass cannot replace approval.
- Rollback for this demonstration means retaining the prior immutable report and rejecting the new refresh; software rollback and live source retractions are separate unsolved deployment concerns.
- Post-release check: verify version, as-of time, source hash and daily counts. The website is a read-only demonstration, not a live monitoring console.

## Release notes: local semantic model

Added documented event, visitor, observed-day and daily-metric views, two lookup indexes and six scenario reconciliations. No metric definition change. Query plans demonstrate index selection on the fixture, not a performance gain or distributed-scale claim.

## Proposed responsibilities and dependencies

Product owns decision criteria and priority; data producer owns identities/completeness; engineering owns ingestion and recovery; QA owns scenario execution; privacy/security owns access and retention approval. All are proposed roles. Dependencies include source contracts, representative workload benchmarks, a real alert channel, concurrency design, authentication, correction/deletion policy and a deployment environment.
