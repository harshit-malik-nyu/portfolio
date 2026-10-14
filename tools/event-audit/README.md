# Event contract audit

A small reusable diagnostic for product measurement. [Open the tool](https://portfolio-lac-five-10.vercel.app/tools/event-audit/).

## Business question

Can this event export support further analysis without obvious identity, taxonomy or timestamp failures? The tool makes a limited, inspectable check before someone trusts a funnel. It does not calculate conversion or approve a launch.

## Use

Try the invented broken/corrected examples, or select an approved de-identified CSV (5 MiB, 20,000 non-empty records maximum). Declare the case-sensitive allowed event names. Required columns: `event_id,user_id,event,timestamp`. Timestamps must be UTC ISO strings, with whole seconds or exactly three fractional digits. Additional columns participate in payload comparison but are not otherwise validated. CSV quoted commas, escaped quotes, embedded newlines, BOM and CRLF are supported.

Every ID must identify one immutable event. Identical retries require review and are excluded after their first occurrence. Conflicting payloads block the audit; **all rows sharing that ID are excluded from provisional counts**. Missing required values, unknown event names and malformed timestamps also block it. Findings can overlap. Record numbers refer to non-empty CSV records, not physical lines. Never sum issue counts as a rejected-row total.

A `CHECKS_PASSED` result means only these declared checks passed. Source completeness, identity stitching, consent, freshness, assignment, revenue reconciliation and missing-event detection remain untested. Do not treat the report as a cleaned dataset.

## Privacy and implementation

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
