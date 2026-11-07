# Service and release ownership evidence

## What is operating now
The portfolio is a published static website with versioned source and automated GitHub checks. The reporting pipeline is an executable local demonstration, not a live client data service. Website deployment is real; enterprise reporting ownership is not claimed.

## Explicit service objectives

| Objective | Demonstration target | Enforcement / evidence | Boundary |
|---|---|---|---|
| Source freshness | Completeness no more than 36 hours behind review time | Pipeline rejects stale watermarks | Assumed source assertion; no independent production feed |
| Integrity | No partial report from a rejected batch | Transaction rollback and retained report checks | Local SQLite, single writer |
| Replay safety | Exact batch replay creates no version | Replay test at 100,000 events | Not exactly-once delivery across distributed services |
| Load latency | Each 10,000-event batch within 10 seconds | Measured local load report | One host/run; no uptime or production SLA claim |
| Crash recovery | Uncommitted writer rows do not survive process exit | Child writer exits before commit; parent checks row absence and retained report | Tests process crash, not power loss or replicated failover |
| Release correctness | Tests and reproducible evidence pass | Role-specific delivery workflow | No external business sign-off implied |

## Release gates
1. Confirm source contracts and no change to metric semantics without a versioned decision.
2. Run pipeline tests, six mart reconciliations and the 100,000-event load/fault experiment.
3. Run JavaScript syntax and static path/fragment checks. Verify changed live interactions in a browser.
4. Keep the last trusted report during a failed refresh. Retain source history to support a code revert.
5. Publish release notes with scope, evidence, changed behavior and open risks. A reviewer checklist is not a signed approval.

## Actual engineering decision record

**Problem observed:** a CI run disagreed with local saved output only because SQLite described a lookup as `USING INDEX` versus `USING COVERING INDEX`.

**Decision implemented:** normalize that optional query-plan adjective in the demonstration artifact and explicitly disclose the normalization. Retain the named index and all data reconciliation assertions. Do not assert covering-index behavior or a speedup across environments.

**Verification:** the corrected role-delivery workflow passed. This is demonstrated defect triage and release correction, not a claimed customer incident.

## Handover exercise
A reviewer can run the commands below without credentials or paid services. Check the six booleans in `fault_checks`, inspect raw batch timings and compare report versions. Changing a metric or input contract should require updated acceptance evidence, not only a text change.

```sh
python projects/commerce-conversion/operations/test_pipeline.py
python projects/commerce-conversion/operations/warehouse.py
python projects/commerce-conversion/operations/reliability.py --output /tmp/reliability-review.json
```

## Distributed deployment design: not implemented
Partition ingestion by a stable key only after defining cross-partition identity and ordering guarantees. Use durable queue offsets, idempotency keys, explicit late-arrival windows and reconciliation against a full reference computation. A coordinator must publish a dataset version only after all required partitions reach the agreed completeness watermark. Define retry/backoff, dead-letter handling, source retractions, privacy deletions, access controls and failover tests. Validate skew and hot partitions with a representative workload before selecting a partition strategy. None of these statements imply that this single-process demonstration is already a distributed system.
