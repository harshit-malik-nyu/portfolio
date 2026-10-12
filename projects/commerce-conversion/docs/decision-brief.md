# Decision: investigate the cart experience before funding a rollout

**Proposed decision owner:** commerce product lead, with analytics, engineering and finance. These are proposed responsibilities, not stakeholders who commissioned or approved this study.

## Executive recommendation

Start with a bounded cart-experience investigation. Establish reliable error and outcome instrumentation, inspect the journey, and then test a specific remedy. Do not approve a checkout redesign solely because the recorded funnel contains drop-off.

This is an independent analysis of Retailrocket's historical single-site event log. It is not analysis of Etsy, Macy's or another prospective employer's private operations.

## Evidence supporting investigation

- 2,756,101 original event rows reconcile to 2,755,641 distinct event records after 460 identical rows are collapsed.
- Purchase-item rows (22,457) reconcile to 17,672 distinct visitor/transaction orders. Treating each item row as an order overcounts purchases.
- Under 30-minute sessions, 36,675 sessions contain view then cart; 10,721 contain a later purchase. The remaining 25,954 are a within-session investigation pool, not necessarily permanently lost purchases.
- Ordered cart-to-purchase conversion is 29.23% at 30 minutes, 29.02% at 15 minutes and 28.99% at 60 minutes. The descriptive direction survives these definitions, though individual session counts differ.
- The experiment-relevant visitor baseline is 9,927 purchases among 36,141 first-cart visitors with complete seven-day follow-up: 27.47%. It allows purchases in later sessions.
- Mature 30-day repeat buyers total 346 of 9,445 (3.66%). This does not by itself prove poor customer experience or warrant a retention program.

## Alternatives and assumptions

The following inputs are explicit planning assumptions, not fitted treatment effects. All use an assumed USD 75 order value and 40% contribution margin, or USD 30 contribution per additional order. Populations overlap. Do not sum their modeled benefits.

| Candidate | Historical audience proxy | Assumed absolute purchase lift | Assumed fixed cost | Modeled contribution after cost |
|---|---:|---:|---:|---:|
| Product discovery investigation/change | 1,407,580 observed visitors | 0.03 percentage points | $20,000 | -$7,332 |
| Cart-experience investigation/change | 36,141 mature first-cart visitors | 2.00 percentage points | $8,000 | $13,685 |
| Repeat-purchase experience | 9,445 mature first-observed buyers | 2.00 percentage points | $6,000 | -$333 |

Rounding affects the displayed dollar. Cost includes an assumed fixed implementation/evaluation budget. Additional variable operating costs, cannibalization and any change in average order value would need to be incorporated in a real case. No marketing spend, CAC or lifetime value is estimated from missing fields.

These choices do not share an experimentally established effect estimate. Cart is prioritized for investigability and a concrete visitor outcome, not because the table proves it is the optimal investment. Discovery could win with a larger attainable lift or lower cost. The required break-even absolute lifts are approximately 0.047 pp for discovery, 0.738 pp for cart, and 2.118 pp for repeat purchase.

For cart, zero lift loses the full $8,000 fixed budget. A one-pp lift yields about $2,842 net contribution, and a two-pp lift about $13,685, provided the assumed volume, margin and order value hold. At zero contribution margin there is no payback. The interactive dashboard exposes these assumptions and rejects impossible probability increases.

## Proposed experiment

**Hypothesis:** after diagnostic evidence identifies a specific cart friction, removing it increases seven-day completed-order probability enough to cover its cost without worsening error, margin or cancellation guardrails.

1. Eligibility: first eligible cart exposure in a prospectively fixed window; explicitly exclude test/bot traffic by rules defined before assignment. Historical exclusions must not be invented to improve the result.
2. Randomization: visitor/account, persistent assignment, one analysis record per unit. Define handling of cross-device identities and logged-out sessions before launch.
3. Primary outcome: at least one completed order within seven days after assignment, divided by every assigned eligible visitor. Analyze intention-to-treat. Wait seven days after the final assignment; do not drop non-starters or failures.
4. Proposed economic hurdle: the default scenario needs an absolute lift above 0.738 pp. This hurdle depends on cost and margin assumptions and must be confirmed before the test.
5. Sample planning: the historical 27.47% baseline with a two-pp alternative and the economic hurdle needs approximately **20,064 independent visitors per arm** for approximate 80% power using a two-sided 95% interval criterion. This is primary-only normal-approximation planning, not guaranteed power or a completed experiment. Total required enrollment (40,128) exceeds the historical mature cart audience (36,141). A contemporary trial would need an adequate traffic window plus follow-up, or a revised intervention and economics. Do not reduce the sample post hoc to force significance.
6. Guardrails: instrument failed requests, page latency, cancellations/refunds and contribution per assigned visitor. Their baselines and acceptable degradation margins are currently unknown. Required guardrails must be estimable and pass prespecified thresholds before launch; their power may require more observations.
7. Decision: launch only if the predeclared primary interval clears the economic margin, guardrails pass, allocation and logging reconcile, and actual implementation economics remain favorable. Otherwise hold, iterate, or reject. No interim peeking without a prespecified sequential design.

## Delivery and acceptance requirements

| Owner role | Proposed work | Acceptance evidence |
|---|---|---|
| Analyst | Reconcile event, order, assignment and outcome tables | Stable grains, no unexplained join inflation, explicit unknown outcomes |
| Engineer | Implement persistent assignment and the specific cart remedy | Assignment tests, no duplicate exposure IDs, rollback capability |
| Product lead | Define the friction and acceptable customer experience | A concrete problem supported by diagnostics, not a funnel correlation alone |
| Finance partner | Validate order value, contribution and full implementation cost | Costs include ongoing operations and avoid equating gross sales with profit |

The current delivery includes the descriptive analytics, tested data model, dashboard, planning calculator, and experiment specification. It does not include a real treatment rollout, stakeholder approval, measured causal uplift or realized revenue.

## Reversal conditions

Change the recommendation if apparent friction is a tracking defect, current traffic does not support enrollment, a different audience offers stronger value, margin/cost moves the hurdle beyond a plausible lift, or guardrails cannot be measured. Retain the finding that the intervention is not yet justified when evidence is insufficient.

## Interview defense

**Why can you not say checkout caused abandonment?** The log only records views, carts and purchases. It has no checkout errors or randomized design. The analysis locates an investigation opportunity; diagnosis and causal validation are separate work.

**Why are 29.23% and 27.47% both correct?** The former is a strictly ordered session transition. The latter follows first-cart visitors across sessions for seven days and excludes immature windows. Their populations and horizons differ.

**What can a business leader do now?** Fund a bounded diagnostic and instrumentation task, validate economics, and plan an adequately powered experiment. The evidence does not justify promising recovered sales.

Data attribution and adaptation license: Retailrocket, CC BY-NC-SA 4.0. See ../README.md and ../data/provenance.json.
