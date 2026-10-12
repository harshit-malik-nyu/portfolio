# Experiment decision lab

A runnable review of six **synthetic** fixed-horizon experiments, connecting data validity, business economics and product guardrails. No real A/B test was conducted. Historical Retailrocket data supplies neither randomized assignments nor the invented harm outcomes.

Live: https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/experiment

## Decision contract

- Unit: independently randomized visitor, assigned once to one arm, 50:50 allocation. Purchase and harm are binary visitor outcomes within seven days of assignment; retain all assigned visitors (intention to treat).
- Inputs: aggregate assigned counts, purchasers, harmed visitors, follow-up counts, future audience and explicit financial assumptions. The design switches are assertions by the operator, not automated identity or logging validation.
- Validity gates: fixed horizon reached, independent identities/no crossover checked, instrumentation checked, all assigned visitors fully observed, SRM p >= .001, and at least 10 events and non-events for each binary outcome in each arm. The sparse-count screen is a heuristic; it does not prove coverage.
- SRM: Pearson chi-square with one degree of freedom, `(n_control - n_treatment)^2 / (n_control + n_treatment)`. The survival probability uses an erfc approximation, checked against SciPy to absolute tolerance 2e-7. It is a diagnostic, not proof of randomization. Near-threshold cases require higher-precision review.
- Uncertainty: four Wilson intervals at confidence .9875 each (alpha .05 / 4). Subtract the control upper bound from treatment lower bound and vice versa. Bonferroni is intended to cover both endpoint differences jointly at approximately 95%. Wilson coverage is approximate; no exact finite-sample coverage is asserted. Prespecify the primary metric and one harm endpoint; adding endpoints requires changing the adjustment.
- Economics: `break_even = fixed_cost / (future_visitors * order_value * contribution_margin)`. Require conversion lift's lower bound strictly above break-even. Zero margin or order value cannot clear this gate.
- Harm: require the upper bound on added harm at or below the predeclared ceiling. Failure to establish non-inferiority is a hold, not necessarily proof of harm.
- Decision precedence: invalid/not-ready, guardrail hold, economics hold, eligible for review. Eligibility is not automatic deployment approval.

## What is demonstrated

| Scenario | Required decision | Why |
|---|---|---|
| Clear economic gate | Eligible for review | Economic lower bound and harm ceiling pass |
| Positive lift, weak economics | Hold: economics | Positive observed lift does not settle investment value |
| Conversion up, harm up | Hold: guardrail | Conversion cannot compensate for failing the harm gate |
| Broken randomization ratio | Invalid / not ready | Assignment counts fail the planned allocation check |
| Incomplete follow-up | Invalid / not ready | Do not select only visitors with observed outcomes |
| Early peek | Invalid / not ready | A fixed-horizon method cannot authorize optional stopping |

`readouts.json` contains frozen inputs and computed outputs. The browser can export an edited scenario locally. `numeric-reference.json` was independently computed with SciPy's Wilson interval and chi-square implementations; this is numerical verification, not external endorsement of the project.

## Reproduce

From repository root:

```sh
node --test projects/commerce-conversion/tests/experiment.test.cjs
node projects/commerce-conversion/experiment/build.cjs
```

The 13 tests cover decision gates, invalid inputs, boundary proportions, symmetry and independent numeric references. To regenerate numeric reference values in an environment with SciPy installed:

```sh
python projects/commerce-conversion/experiment/reference.py
```

## Limits that can change the decision

Counts cannot establish exposure correctness, assignment independence, interference, bot filtering, experiment preregistration or missing-not-at-random outcomes. No sequential inference, cluster randomization, repeated user records, CUPED or multiple treatment arms are supported. Eligibility is conditional on these design assumptions. Future volume, margins and order value are planning inputs; the model assumes one incremental order per additional purchaser and does not estimate changes in basket size or repeat purchasing. Costs and audience uncertainty need sensitivity analysis before approval. No customer-level data is collected by this page.

## Method references

- Microsoft Research, [Diagnosing Sample Ratio Mismatch in A/B Testing](https://www.microsoft.com/en-us/research/articles/diagnosing-sample-ratio-mismatch-in-a-b-testing/): assignment validity before treatment interpretation.
- Statsmodels, [proportion_confint](https://www.statsmodels.org/stable/generated/statsmodels.stats.proportion.proportion_confint.html): Wilson interval method.
- SciPy, [binomtest](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.binomtest.html) and [chi2](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.chi2.html): independent numerical reference APIs.
