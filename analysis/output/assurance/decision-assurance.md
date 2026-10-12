# Decision assurance: portfolio

Prioritize role-specific navigation and short decision summaries. Judge the site by evidence discoverability and correctness, not invented interview conversions or visitor counts.

**Evidence:** Eleven self-directed case studies are linked with interactive tools and validated calculations. Local optional events are in-memory only; there is no production visitor-retention dataset.

**Uncertainty:** Synthetic repeat visits cannot measure recruiter interest. The site creates presentation value; avoided reviewer minutes are not cash revenue.

## Robustness of the assumed business case

| Alternative | Feasible grid cases / 27 | Worst regret when feasible | Maximum volume at fixed review capacity |
|---|---:|---:|---:|
| Static case-study index | 18 | $0.00 | 24000 |
| Guided role navigation with concise evidence | 9 | $910.90 | 40000 |
| Complex personalized tracking stack | 0 | No feasible case | 12000 |

**Robust minimax choice:** None. No option is feasible across the entire stress grid.

Finite assumed grid, not a probability distribution or protection outside the grid. Conditional regret never overrides feasibility. Null robust option means no unconditional recommendation. Cost regret is relative to the cheapest feasible option in that same scenario. Failure counts can overlap.

## Missing-outcome sensitivity

| Outcomes masked per arm | Primary effect bounds | Incident effect bounds | Every completion clears margins? |
|---|---:|---:|---|
| 0% | [7.0%, 7.0%] | [1.5%, 1.5%] | False |
| 5% | [1.8%, 11.8%] | [-3.6%, 6.4%] | False |
| 10% | [-4.1%, 15.9%] | [-8.7%, 11.3%] | False |
| 20% | [-14.6%, 25.4%] | [-18.9%, 21.1%] | False |

These are identification bounds on deliberately masked synthetic outcomes, not confidence intervals or measured missingness. Failures and non-starters remain in the assigned denominator. Passing this sensitivity check would still require statistical and domain-quality gates.

## Domain measurement contract

**Decision:** Help a reviewer find and understand the most relevant evidence with minimal friction.

**Primary outcome:** Successful completion of a predefined evidence-finding task and correct interpretation of its main limitation.

**Denominator:** All consenting assigned review tasks, including noncompletion; page views and return visits are separate proxies.

**Independent unit:** Reviewer; repeated tasks from one reviewer are dependent.

**Quality guardrail:** Broken links, misleading outcome claims, accessibility barriers and privacy.

**Minimum required data:** Consented anonymous task assignment, completion/timeout, comprehension response, timing and page/version; no resume or contact data in analytics.

**Missingness and failure handling:** Keep timeouts and noncompletion. Missing comprehension answers remain unknown; optional local events do not measure production engagement.

**Release rule:** Local checks can establish link/calculation correctness. Claim improved reviewer comprehension only after a valid task comparison; synthetic returns cannot support recruiter-interest claims.

**Reversal trigger:** Role navigation increases confusion, hides evidence limitations, or requires unnecessary tracking.

## Interview defense

**Is the website itself proof of analytical impact?**

It demonstrates communication and implementation. The substantive evidence is in the linked projects, and the site has no measured hiring conversion effect.

**Why not add extensive tracking?**

Tracking adds privacy and implementation costs. First define a decision that needs the data and use consented minimal task measurements.

## Implementation handoff

1. Freeze the eligible population, denominator, outcome horizon and proposed decision owner before comparison.
2. Reconcile assignment and outcome records at the independence unit; classify missingness without deleting cases.
3. Estimate the domain outcome and its uncertainty separately from activation. Apply risk and capacity vetoes before comparing costs.
4. Record approve, hold, or reverse with the evidence version and violated gate. An unmeasured required domain gate means HOLD.

The supplied cluster-budget grid is a planning sensitivity check with assumed ICC. It is not an estimate from real clusters and does not guarantee joint power. No stakeholder approval or real experiment is asserted.
