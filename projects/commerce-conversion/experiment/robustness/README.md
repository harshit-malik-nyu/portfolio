# Decision robustness: economics and incomplete outcomes

Self-directed, AI-assisted work sample. All experiment outcomes and financial assumptions are synthetic/illustrative. No business-owner acceptance, measured revenue, real trial or personal independent performance is claimed.

## Decision and alternatives

The chosen clear-gate experiment passes at $8,000 cost, 36,141 future visitors, $75 order value and 40% contribution margin. Does the funding recommendation survive plausible alternative assumptions? The grid is an illustrative stress range, not an elicited forecast or probabilistic distribution.

1. **Fund from the baseline alone:** rejected; the assumed margin and audience could be optimistic.
2. **Request bounded assumption review:** chosen. Explicitly expose the four failing combinations before funding review.
3. **Discard every positive result:** also unsupported; 23 combinations remain eligible under the stated gates. An assumption-sensitive result asks for better inputs, not an automatic permanent rejection.

Keep costs ($4k/$8k/$16k), future audience (18k/36,141/72k), and margin (20%/40%/60%) separate. Fixed $75 order value and one incremental order per incremental purchaser are assumptions. Actual rollout requires separately validated audience comparability, cost coverage, design and operating conditions. A source check cannot certify those assertions.

## Calculation

`lower net contribution = lift lower bound × future audience × order value × contribution margin − fixed cost`.

The lift bound comes from the existing four-interval Bonferroni-adjusted Wilson method. This review does not change that approximate statistical method or validate its coverage. It carries forward every validity and harm gate; an inexpensive scenario cannot authorize an invalid experiment. The joint 27-case economic grid is an assumption sweep, not 27 new hypothesis tests. No probabilities are assigned to the cells.

For missing binary outcomes, successes and unknowns are disjoint within the all-assigned population. Known negatives are the remainder. The lowest possible contrast assigns all control unknowns success and all treatment unknowns failure; the highest reverses that assignment. These are identification bounds conditional on recorded counts, not confidence intervals. Any unknown outcomes hold the review. They are independent of the economic selector and do not replace experiment gates.

## Acceptance and implementation trace

| ID | Acceptance | Evidence |
|---|---|---|
| RB1 | All 27 unique combinations are present for each of six experiments | `verify.py` exact Cartesian-grid comparison |
| RB2 | Financial arithmetic agrees independently to specified tolerances | `verify.py` Python Decimal reconciliation of 162 cells |
| RB3 | Changing cost cannot rescue invalid assignment, incomplete follow-up or early peeking; harm holds remain | `verify.py` decision checks across the entire grid |
| RB4 | Missing-outcome bounds match every possible binary completion in small cases | `verify.py` exhaustive oracle, 354 populations |
| RB5 | Impossible, overlapping or noninteger counts reject | `test.cjs` |
| RB6 | Baseline eligibility does not imply grid-wide robustness | `test.cjs`: 23/27 and four failures |
| RB7 | UI selections and exported records contain explicit assumptions and limitations | Live browser verification at release; `ui.js` |

## Business handoff

Finance/delivery should supply total cost coverage, product/growth should supply current traffic and contribution assumptions, and data/engineering should reconcile missingness by arm. These are proposed roles, not actual elicitation. The business owner retains approval responsibility. Ask whether failed combinations are credible before spending: do not hide the downside with an average of unweighted scenarios.

## Reproduce

From repository root, with Python and Node standard libraries only:

```
node projects/commerce-conversion/experiment/robustness/build.cjs
node --test projects/commerce-conversion/experiment/robustness/test.cjs
python projects/commerce-conversion/experiment/robustness/verify.py
```

The published JSON includes source hashes. CI rebuilds it and rejects output drift. No dependency installation, account, model, paid API or external data download is required for this extension. This cannot establish real-world adoption, production scale, undocumented missingness mechanisms, or candidate mastery.
