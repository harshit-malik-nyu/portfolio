# Decision memo: subscription revenue and retention

**To:** Finance, Product and Revenue Operations reviewers  
**From:** Harshit Malik  
**Scope:** Synthetic company, September 2026 snapshot. All figures USD. No real-world impact claimed.

## Recommendation

Resolve billing exceptions before describing the cash gap as churn. If a retention pilot is funded, activation is the numerical candidate under the default assumptions, but its $2.40 advantage over renewal is immaterial. Choose between those pilots based on credible effect evidence, operational readiness and measurement feasibility—not this tiny modeled difference.

## What the controls show

September contracted MRR is $24,600, invoices $24,280 and collected cash $23,080. The $1,520 difference comprises a $320 net billing gap and $1,200 collection gap. The billing net includes $50 underbilling, $300 missing billing and $30 overbilling. One exact duplicate invoice is removed; one split payment is counted exactly once. A $900 October payment is correctly outside the snapshot. Thus the September collection gap is a timing/collection issue, not proof of permanent loss.

Finance should review the three billing exceptions, correct the source and regenerate the ledger. Revenue Operations should review the unpaid and late-payment accounts before treating the entire $1,200 as incrementally recoverable. The recovery rate represents cash accelerated or recovered relative to what would have happened anyway.

## Capital allocation, explicitly conditional

| Pilot | Eligible pool | Assumed incremental effect | Cost / hours | Modeled net 90-day cash |
|---|---:|---:|---:|---:|
| Payment recovery | $1,200 overdue cash | 35% | $300 / 6 | $120.00 |
| Activation | $6,100 unactivated active MRR | 12% | $700 / 16 | $1,056.80 |
| Renewal | $10,700 activated low-usage MRR | 8% | $1,000 / 20 | $1,054.40 |

Retention assumes three months of immediate incremental retention, full payment and 80% contribution margin. Recovery is one-time cash with prior service costs sunk. All pilot spend includes staff time. The comparison optimizes short-term cash, not profit, recognized revenue or lifetime value. Never add overlapping pilot benefits.

Activation needs about 4.78% incremental retention to break even; renewal 3.89%; recovery 25% incremental collections. These are decision thresholds, not measured effects. With only $300 available, recovery is the only feasible positive base case. With no incremental benefit, hold all three.

## Measurement and operational handoff

1. Finance signs off invoice identity, cutoff and exception dispositions.
2. Product confirms activation and active-day definitions against real instrumentation.
3. RevOps defines eligible accounts and freezes assignment before contact.
4. Randomize one pilot against usual process; stratify by segment and prevent overlapping assignments.
5. Prespecify 90-day collected contribution per assigned account, costs, uncertainty method and complaint/churn guardrails. Estimate sample size from real variance and a worthwhile effect before launch.
6. Review the fixed follow-up window and uncertainty before making a scale decision. Do not interpret these synthetic cohorts as effectiveness evidence.

**Evidence:** `analysis.sql`, five source CSVs, `data/results.json`, regression tests, interactive workspace and formula-based Excel model. The analysis is reproducible without external services. This case demonstrates financial controls, product measurement and business judgment; it does not demonstrate employer demand or realized client value.
