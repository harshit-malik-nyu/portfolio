# Contract portability: reproduced defect and decision

Date: October 28, 2026. Scope: AI-assisted portfolio demo; no customer incident or stakeholder sign-off claimed.

## Decision for a business owner

Retain one portable input contract across the browser and independent SQL handoff. Accept equivalent integer-valued JSON number spellings. Reject timestamps outside Gregorian years 0001–9999. Do not change the completion definition, source separation, or started-session denominator.

A reviewer should be able to move a valid file between the two paths without an unexplained change in acceptance. Calendar disagreement must block a file before metrics are published.

## Observed defects

A one-event started-session fixture reproduced two disagreements before the correction:

| Input change | Browser before | Python before | Agreed behavior after |
|---|---|---|---|
| Schema and sequence represented as `1.0` | Accept | Reject | Accept, same integer value |
| Timestamp `0000-01-01T00:00:00.000Z` | Accept | Reject | Reject |

The Python validator used a strict runtime integer type; JavaScript does not distinguish integer and floating-point JSON tokens. JavaScript dates support year zero, while the Python calendar validator does not. Neither inconsistency is evidence of altered historical customer data: this is a deliberately bounded demonstration.

## Alternatives and trade-offs

1. Require literal integer tokens everywhere. This would need lexical-number rules in the browser parser and would unnecessarily reject semantically equivalent exports.
2. Accept equivalent integer values and use a shared calendar range. **Chosen:** smallest compatible correction for canonical exports; meaningful types and chronology remain strict.
3. Expand Python to support astronomical year zero. Extra calendar machinery has no demonstrated value for this demo and expands the validation surface.

## Role-specific evidence

- **Data:** independently implemented validation and SQLite aggregation; six valid boundary cases plus fourteen invalid inputs; source hashes bind the verification report to code.
- **Business:** explicit alternatives, impact assessment and requirement R11 linked to executable acceptance; no invented owner approval or financial benefit.
- **Product:** preserves the metric population and outcome semantics; no claim that contract acceptance establishes telemetry completeness, real purchases or a causal effect.

## Release and reversal conditions

Run the browser and Python tests, rebuild the reports, and require the checked-in outputs to match. `verify_review.py` compares 106 valid cases (100 seeded populations plus six boundaries) and requires both implementations to reject fourteen invalid inputs. These finite cases do not prove universal equivalence.

Canonical fixture counts remain 3 started, 2 viewed, 1 completed and 2 failed attempts. No metric restatement is required for that fixture. Previously accepted year-zero browser inputs are now rejected; an analyst must correct the input at its source rather than reinterpret its date silently. Revert the code and its generated reports together if the release creates a regression; do not restore inconsistent acceptance as a permanent fix.

## Reproducibility incident

The preceding homepage Experience edit changed `index.html` without refreshing `analysis/output/manifest.json`. GitHub's reproducibility gate correctly failed on the stale source hash. The correction regenerates the manifest using `python analysis/build.py`; the hash comparison stays enabled. This was a release-maintenance error, not a failure of the analytical calculations.
