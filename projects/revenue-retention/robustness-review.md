# Revenue and retention: decision robustness review

**Evidence type:** synthetic acceptance fixtures, separate from the dashboard company. No client impact or observed causal effect.

## Decision

Hold rollout. The deliberately extreme twelve-account experiment is useful for checking exact randomization arithmetic. It does not justify a confident business-effect claim: a conservative 95% interval using prespecified outcome support of $0–$300 per account includes negative effects. The support must bound both potential outcomes for every eligible account, not just observed values. If that assumption cannot be defended, the interval is not valid for the real experiment.

The earlier exact-test `REVIEW` status means review a statistical signal, not launch. The robustness report adds a more conservative economic interpretation. These are two different tests with different questions; a small sharp-null p-value and a wide average-effect interval are not a contradiction.

## Financial controls

A $100 invoice collected in full, followed by a $20 credit, creates a $20 customer credit pending refund. Paying the $20 refund leaves $80 net billing and $80 net cash. The credit reduces the receivable; the refund reduces cash. Subtracting both from revenue would double count the same adjustment. These controls do not alter contracted MRR and do not claim GAAP recognition.

The isolated calculator rejects negative/non-integer cents, duplicate adjustment IDs, credits exceeding the invoice, refunds exceeding collected cash and invalid dates. Future adjustments are outside cutoff. Inputs represent one invoice; callers supply already cutoff-filtered paid cash. Credit reversals, tax, FX, partial-period pricing and multi-invoice allocation remain outside scope.

## Sensitivity

Twenty-seven joint scenarios vary effect multiplier (0.5/1/1.5), contribution margin (60/80/90%) and cost multiplier (1/1.25/1.5). Budget stays at $1,000 and capacity at 20 hours. All three fixed pilot workloads fit that capacity; increased costs can remove pilots from consideration. Recovery uses sunk prior service costs and is unaffected by future delivery margin. Retention uses three months of immediate effect with full collection. A candidate must be affordable and have positive modeled incremental cash; otherwise hold.

These ranges are illustrative assumptions, not empirical distributions. The fraction of scenarios selecting an action is not its probability of success. The comparison remains a 90-day cash objective, not lifetime profit. Independent drivers, longer-term effects, allocation overlap and uncertain collection timing require further analysis before a real budget decision.

## Uncertainty method

For outcome range width R, treatment size nT, control size nC, and error rate alpha, the radius is:

`R × [sqrt(log(4/alpha)/(2*nT)) + sqrt(log(4/alpha)/(2*nC))]`.

Center this radius on the treatment-control difference and clip to the logical effect range [-R, R]. Each arm uses a conservative Hoeffding bound; a union bound gives joint coverage of at least 1-alpha under the declared design. Complete random assignment with fixed group sizes samples potential outcomes without replacement. Assumptions include no interference, complete follow-up and valid prespecified support. The bound is intentionally conservative; it does not estimate normality or infer uncertainty from the artificially constant fixture outcomes.

No sequential peeking, post-hoc subgroup search, interference or missing-outcome adjustment is implemented. Do not choose the support after seeing outcomes to obtain a favorable interval. This is a fixed-analysis demonstration, not a power calculation or real experimental result.

## Reviewer acceptance checks

- Credit then refund reconciles to zero balance; credit alone appears as customer credit.
- An adjustment after cutoff has no effect on the snapshot.
- Duplicate IDs and excessive adjustments are rejected.
- Missing or out-of-support experiment outcomes stop interval calculation.
- An independent closed-form test checks the interval radius.
- More observations narrow the conservative interval on a fixed fixture.
- Every selected sensitivity candidate satisfies budget and positive modeled cash.

Forty Python and seven JavaScript tests pass locally. Hosted workflows separately rerun the tests and require generated evidence to match committed outputs. Passing these selected checks is not exhaustive validation or independent certification.
