# Reliable commerce reporting: operational evidence

**Independent demonstration, synthetic source events, local SQLite.** This is executable evidence of failure handling and reporting controls. It is not a deployed client system, business impact measurement, or an attestation of personal interview performance.

[Open the walkthrough](https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/operations/) · [Metric contract and acceptance criteria](requirements.md) · [Ownership review](ownership-review.md)

## The business problem

A reporting stakeholder needs to know whether a daily change reflects customer behavior, late data, or a broken refresh. A failed load must not overwrite the last trusted report. A late purchase must not disappear just because yesterday's reporting period was closed.

This workflow stores event records, batch identities, immutable report versions, and an audit trail in SQLite. Input validation rejects missing identity, unknown fields/types, invalid times, conflicting identity, stale completeness and inconsistent orders. All event insertions and report publication share one transaction. Rejected refreshes retain the preceding report and append a failure record. Exact replays do not create new report versions.

## Run locally

No third-party packages, credentials, or network calls are needed. Python 3.12 is used in CI.

```sh
python projects/commerce-conversion/operations/test_pipeline.py
python projects/commerce-conversion/operations/build_demo.py
python projects/commerce-conversion/operations/pipeline.py --db /tmp/commerce-report.sqlite --batch projects/commerce-conversion/operations/baseline.json --as-of 2026-01-02T01:00:00Z
```

The last command uses a fixed historical demonstration clock. Real runs must pass the actual review time. Exit 2 means rejected data; exit 0 means publication or harmless replay. The CLI returns the refresh result **and** the last trusted report, including its as-of time. An old report must never be presented as current just because it remains available.

`build_demo.py` uses a temporary database to execute six sequential scenarios and writes the JSON and JavaScript displayed by the website. Rebuilding must produce byte-identical output. CI checks this. The website is a read-only walkthrough of these generated results, not a browser-hosted database service.

## Incident and recovery runbook

1. Inspect the failure reason, incoming batch and retained report version. Notify the metric owner that the latest refresh failed; display the report's original as-of time.
2. Check the producer's source-completeness watermark. It is an explicit source assertion, not inferred from the newest event. Investigate source lag before requesting an updated watermark; do not change it merely to pass validation.
3. For changed event identity, resolve the upstream issue. This demo rejects in-place corrections; a production correction/retraction protocol remains to be designed.
4. Re-run a corrected rejected batch. It was not recorded as successfully ingested. A previously successful batch cannot reuse its identity with changed content.
5. Review inserted, duplicate and late-event counts. Compare restated daily metrics with the prior report before using them in a decision.
6. Verify the new version and source hash in the audit record. Earlier reports remain available for comparison.

## Explicit trade-offs and production limits

- Full recomputation makes restatements straightforward but is not a performance claim at warehouse scale. A production implementation would require partitioning, benchmarks and reconciliation against full recomputation.
- Event and order IDs are global identifiers in this fixture contract. Actual Retailrocket data has a different contract. This pipeline is not claimed to have ingested the 2.76M-event source.
- Closed means the UTC reporting period is covered by the source watermark. It does not mean permanently immutable. Late events can restate it.
- A 36-hour freshness ceiling is an assumed demonstration service target, not an observed operational SLA.
- No-event days are absent, not asserted to be zero. A production calendar spine plus an independently verified completeness feed would be needed to assert zero activity.
- There is no customer PII, authentication, cloud scheduler, paging integration, deployment monitoring or privacy certification here.
- Tests exercise transactional rollback and deterministic recovery. They do not establish multi-writer correctness or abrupt power-loss durability in a hosted system. Use a single writer for this demonstration.
- SQL counts observed buyers and visitors per UTC day. This is not a session funnel, attributed conversion, causal lift or revenue metric.

## Role relevance

**Data analyst:** metric definitions, SQL aggregation, data quality, reconciliation and versioned reporting.

**Business analyst:** requirements, acceptance criteria, exception handling, ownership and release conditions.

**Product analyst:** trustworthy behavioral measurement and separation of recording failures from a product effect. Pair this with the existing experiment decision lab for launch interpretation.
