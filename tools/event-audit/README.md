# Event contract audit

A small reusable diagnostic for product measurement. [Open the tool](https://portfolio-lac-five-10.vercel.app/tools/event-audit/).

## Business question

Can this event export support further analysis without obvious identity, taxonomy or timestamp failures? The tool makes a limited, inspectable check before someone trusts a funnel. It does not calculate conversion or approve a launch.

## Use

Try the invented broken/corrected examples, or select an approved de-identified CSV (5 MiB, 20,000 non-empty records maximum). Declare the case-sensitive allowed event names. Required columns: `event_id,user_id,event,timestamp`. Timestamps must be UTC ISO strings, with whole seconds or exactly three fractional digits. Additional columns participate in payload comparison but are not otherwise validated. CSV quoted commas, escaped quotes, embedded newlines, BOM and CRLF are supported.

Every ID must identify one immutable event. Identical retries require review and are excluded after their first occurrence. Conflicting payloads block the audit; **all rows sharing that ID are excluded from provisional counts**. Missing required values, unknown event names and malformed timestamps also block it. Findings can overlap. Record numbers refer to non-empty CSV records, not physical lines. Never sum issue counts as a rejected-row total.

A `CHECKS_PASSED` result means only these declared checks passed. Source completeness, identity stitching, consent, freshness, assignment, revenue reconciliation and missing-event detection remain untested. Do not treat the report as a cleaned dataset.

## Repeatable local workflow

The same engine can run without a browser using Node.js 22 (the CI-tested version). No packages or credentials are required:

```sh
node tools/event-audit/cli.cjs tools/event-audit/sample-broken.csv --events view,addtocart,transaction
node --test tests/event-audit*.test.cjs
```

The example deliberately returns **exit code 2**, not success. For an approved local export, replace the file path and declare its event taxonomy. The CLI prints the aggregate JSON report to stdout; it does not change or upload the input. It reads at most 5 MiB plus one byte, rejects invalid UTF-8, and does not print raw rows or identifiers. Event names remain in reports and should be reviewed before sharing. Run only with data your organization permits you to process locally.

| Exit code | Meaning | Workflow response |
|---|---|---|
| 0 | Declared checks passed | Continue only if separate completeness, governance and business checks also pass |
| 1 | Review required, including identical retries | Investigate; do not automatically treat as passed |
| 2 | Blocking contract findings | Resolve upstream issues before relying on the metrics |
| 3 | Usage, file, encoding or input-format error | No report exists; correct the input and rerun |

Do not add `|| true` to a quality gate: it would hide review, blocked and input-error states. The CLI is a diagnostic interface, not a scheduler, hosted service, cleaned-data exporter, production certification or proof of adoption. The browser and CLI share the analytical engine; CLI regression tests verify report parity and exit-code semantics.

## Privacy and implementation details

CSV contents are processed in memory in the browser. There is no upload endpoint, persistence, analytics or third-party script. A restrictive CSP blocks network connections from the tool. Page delivery still involves normal hosting requests and logs. JSON exports contain aggregate counts, event taxonomy and finding record numbers, without raw records or user/event IDs. Follow your organization's data policies even for local processing. Review the report before sharing it.

## Reproduce

From repository root:

```sh
node --test tests/event-audit.test.cjs
python -m http.server 8000
# Open http://localhost:8000/tools/event-audit/
```

The browser and tests use the same `audit.js` engine. Tests cover failure modes, quoted CSV, malformed input, UTC rollovers, duplicate semantics, conflicts in optional properties, limits and report privacy. Synthetic fixtures are not customers, employer validation or adoption.

## Review it as a work sample

1. Run broken tracking. Explain why an identity collision differs from a retry.
2. Run corrected tracking. Explain why a clean result still cannot prove completeness.
3. Add a real requirement, such as per-event required properties, and demonstrate both a passing and failing case.
4. Assign remediation and define source-system reconciliation before recommending a launch.

This is an independent AI-assisted portfolio tool. Personal mastery must be observed; the repository does not establish interview performance.
