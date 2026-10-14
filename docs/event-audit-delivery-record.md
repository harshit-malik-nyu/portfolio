# Event audit: requirements, acceptance and release record

Independent portfolio delivery, October 14, 2026. This records work actually implemented and checked in the repository. Product/engineering/analytics owners below are proposed responsibilities for a future team, not people who participated or approved the work.

## Decision and scope

Before interpreting an event export, identify a limited set of contract failures and return actionable findings. Input: an approved, de-identified CSV up to 5 MiB / 20,000 records plus an allowed-event list. Output: findings with record references and an aggregate JSON report. No upload, persistence, conversion calculation or automatic release approval.

## Process and dependencies

1. Analyst agrees the event grain, immutable identity and allowed names with the metric owner.
2. Engineer supplies an approved export; analyst checks the privacy and schema expectations.
3. Local audit identifies violations. Blocked means investigate before using the affected data for a decision; review means resolve duplicate semantics.
4. Engineer corrects emission or extraction; analyst repeats checks and reconciles with an independent source system.
5. Metric owner reviews completeness and business meaning before approving downstream use.

Steps 1, 2, 4 and 5 describe a proposed team workflow. The repository demonstrates the local audit, synthetic failure handling and deployment only. No external source-system reconciliation or stakeholder approval is claimed.

## Requirements to evidence

| ID | Requirement / acceptance criterion | Implemented evidence | Verification |
|---|---|---|---|
| R1 | Required fields cannot be empty; event names must match the declared contract | `tools/event-audit/audit.js` | Automated missing-field and taxonomy cases |
| R2 | Identical retries are distinguished from conflicting identities | Same engine | Automated duplicate and optional-property conflict cases |
| R3 | Every record sharing a conflicting identity is excluded from provisional counts | Payload pre-scan | Automated both-sides conflict test |
| R4 | Invalid UTC timestamps, rollovers and malformed CSV fail closed | Strict UTC and CSV parsing | Automated leap-day, quoting, CRLF and malformed-row cases |
| R5 | The report does not export user/event IDs or raw payloads | Aggregate JSON schema | Automated privacy check; live report download |
| R6 | A clean report must not imply complete tracking or release readiness | Result language and limitations | Live corrected example |
| R7 | Changing the contract invalidates an earlier displayed result | UI input handler | Live contract-change check |
| R8 | The tool works at the deployed clean URL | Root-relative assets | Live broken and corrected examples after path correction |
| R9 | Selected CSV is processed locally and reports the expected failures | File input and File.text() | Live synthetic file selection and audit |
| R10 | Oversized input is rejected before analysis | Byte/row limits | Automated 5 MiB and 20,000-record boundaries |

Repository tests: `node --test tests/event-audit.test.cjs`. Automated checks are developer verification, not user acceptance or an independent audit.

## Actual defect and correction

**D1: asset resolution on the deployed URL.** The hosting configuration removes trailing slashes. Relative script/style/download paths therefore resolved at the parent directory. Corrected to deployment-safe paths and rechecked the live examples and download. Relevant source commit: `117237359cd1d24a40a895fc70e7a65425f09a7c`.

**D2: conflicting ID treatment during implementation.** An initial implementation could retain the first valid-looking row in provisional counts before encountering a collision. Added a payload pre-scan to exclude every row sharing a conflicting ID. A regression test requires zero provisional rows when the only ID has two conflicting payloads. This was corrected before the first published tool release.

## Acceptance boundary and proposed handoff

Developer verification: complete for the listed cases. Business-owner acceptance: **not performed**. Production approval: **not claimed**. Microsoft/browser/platform-specific behavior outside tested paths is not inferred.

For team adoption, identify an actual metric owner, confirm retention/privacy requirements, agree expected event properties and completeness controls, validate accessibility and browser support, and record approval against a versioned release. Deploying this diagnostic alone is not sufficient for production acceptance.

A reviewer can assess personal ownership by asking for a new event-specific required-property rule, its acceptance criterion, a failing example and a regression test. No passing interview score is pre-filled.
