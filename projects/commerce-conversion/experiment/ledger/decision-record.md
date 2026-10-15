# Decision record: reject exposure filtering as the primary analysis

**Status:** self-directed, synthetic business-analysis exercise. Proposed stakeholders and the change request below are scenario roles, not real interviews or signed approvals.

**Recommendation:** hold rollout, retain the all-assigned denominator, investigate differential exposure and require design evidence before interpreting a treatment effect. The executable log audit passes; the downstream decision gate remains `INVALID / NOT READY`.

## Decision and alternatives

The scenario product owner asks whether the apparent purchase improvement supports rollout. A proposed change would restrict the report to visitors with a logged exposure, on the grounds that only those visitors could have experienced the feature.

| Option | Consequence | Recommendation |
|---|---|---|
| Ship using exposed-only rates | Shows a 21.11-point difference after unequal exclusions; alters the target population after assignment | Reject as primary causal evidence |
| Ship using all-assigned rates immediately | Preserves population and shows a 6-point descriptive difference, but design and completeness remain unverified | Hold |
| Retain all assignments, diagnose exposure, establish design evidence | Preserves the estimand and makes uncertainty visible; requires investigation before rollout | Selected next step |
| Abandon the feature | Avoids further testing cost but gives no evidence that the feature is harmful or unprofitable | Not justified by this fixture alone |

The selected step is a measurement decision, not a finding that the feature works or fails. Do not drop low-exposure visitors to make results look cleaner.

## Conditional investment illustration

Planning assumptions: 10,000 future eligible visitors × $80 incremental order value × 35% contribution margin, minus $1,000 fixed implementation cost. One additional buyer is assumed to mean one incremental order. The same future population is assumed comparable to the experiment population.

- At the all-assigned descriptive difference of 0.06: modeled net contribution is $15,800.
- At the exposure-selected difference of 0.211111…: modeled net contribution is $58,111.11.
- Difference: $42,311.11 of model output caused by changing the population used for the estimate.

Neither is a forecast or realized ROI. The population transfer, causal interpretation, order value, margin and cost are unverified. The example shows why business owners need metric definitions before approving an investment. The existing decision engine also checks uncertainty and customer harm; a positive point estimate cannot bypass those gates.

## Requirements and acceptance evidence

| ID | Business requirement | Executable evidence | Acceptance status |
|---|---|---|---|
| L1 | Preserve every assignment in the denominator | `test_left_join_keeps_unexposed_and_zero_event_people` | Developer-tested |
| L2 | Count buyers rather than transaction rows | `test_retries_and_multiple_purchases_do_not_inflate` | Developer-tested |
| L3 | Apply a consistent seven-day definition | `test_window_end_excluded_and_maturity_inclusive` | Developer-tested |
| L4 | Never hide incomplete follow-up by dropping people | `test_immature_people_retained` | Developer-tested |
| L5 | Block contradictory assignment or outcome identity | `test_conflicting_assignment_rejected`, `test_conflicting_event_rejected` | Developer-tested |
| L6 | Reject cross-arm or unassigned events | `test_unknown_visitor_and_cross_arm_rejected` | Developer-tested |
| L7 | Reject impossible event order and unsupported schema | Timestamp and schema tests | Developer-tested |
| L8 | Reconcile aggregates independently | `test_fifty_variants_against_set_based_oracle` | Developer-tested, not external validation |
| L9 | Avoid leaking raw identity in CLI failures | `test_cli_failure_does_not_emit_partial_metrics_or_raw_identifiers` | Developer-tested |
| L10 | Do not equate log consistency with causal readiness | `causal_readiness=UNCONFIRMED`; design assertions false in reproducible handoff | Fixture verified; real approvals absent |

## Proposed responsibilities and open questions

| Role | Required contribution before a real release |
|---|---|
| Product owner | Define target population, decision horizon, meaningful effect and acceptable harm; approve or reject launch |
| Analyst | Reconcile counts, preserve assignment population, diagnose exposure imbalance and communicate uncertainty |
| Instrumentation engineer | Validate event semantics, capture completeness and assignment/exposure joins against the actual source |
| Experiment owner | Supply pre-analysis plan, allocation mechanism, independence assumptions and stopping policy |
| Finance/commercial owner | Validate cost, order value, margin, future audience and sensitivity assumptions |

Questions still requiring answers: Was exposure captured equivalently? Was exposure itself affected by treatment? Can IDs change or cross devices? Are outcomes lost differently by arm? Were exclusions predeclared? Does delayed telemetry make elapsed maturity misleading? Who owns remediation and accepts residual risk?

## Change control and handoff

Changing the primary denominator is a material measurement change. Record its rationale, affected metrics, selection mechanism and impact on historical comparability. Keep exposed-only rates as a labeled diagnostic. A future triggered analysis requires a defensible, symmetric eligibility definition and appropriate logging; it is not approved here.

For invalid inputs, quarantine the incoming fixture and retain the previous reviewed output. Correct the source, rerun the analyzer and compare counts and hashes. This build is a local reproducibility workflow; do not describe its output writes as an atomic production deployment.

Release acceptance for this **work sample** is reproducible artifacts, passing regression tests, intact source links and clear synthetic labels. Real business acceptance remains unperformed. Reverse the hold only when design, logging, economic and harm evidence supports the relevant gates and the accountable owner approves the change.
