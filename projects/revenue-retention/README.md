# Revenue & Retention Decision System

A synthetic subscription-to-renewal work sample by Harshit Malik. No employer data, client outcomes or causal uplift claims. Free, static browser workspace; Python standard-library SQLite pipeline; pure JavaScript decision engine.

## Reproduce

From this directory, Python 3.10+ and Node 18+:

```sh
python build.py
python -m unittest -v test_revenue_analysis.py
node --test test_engine.js
```

`build.py` regenerates the CSV fixtures and `data/results.json` deterministically. Serve the repository root using `python -m http.server 8000` and visit `/projects/revenue-retention/`. No package install or secrets required for the analysis or dashboard.

## Metric contracts

| Metric | Grain / definition | Important boundary |
|---|---|---|
| Contracted MRR | Account-month subscription run rate, integer USD cents | Not recognized revenue; no proration, tax, credits, FX or expansion in v1 |
| Billed | Exact-deduplicated invoices summed per account-month | Conflicting invoice IDs stop analysis |
| Collected | Payments against those invoices paid by 2026-09-30 | A vintage measure, not payment-month cash flow; October excluded |
| Billing gap | MRR minus billed | Negative is overbilling, not additional recurring value |
| Collection gap | Billed minus collected | Missing invoices are a billing issue, not overdue cash |
| Logo retention | Active subscriptions / original cohort accounts | Cohort age is months since start; future ages remain null |
| Activation | Fixture flag for setup within 14 days | Association only; not a treatment effect |
| Usage | Active days per account-month | Simulated measurement, not independently validated behavior |

60 accounts begin in April (30), June (15), August (15). 270 account-month records include churned subscriptions with zero MRR. Joins aggregate invoices and payments separately before joining; split payments cannot inflate billing. Exact duplicate invoice removal is logged. `test_revenue_analysis.py` challenges every seeded exception, cutoff, bridge, cohort maturity and invalid identity handling.

## Decision contract

All-company September pools: overdue cash $1,200; unactivated active MRR $6,100; activated low-usage MRR $10,700. The last two are disjoint; collection may overlap either. Choose ONE pilot, not a portfolio of additive benefits.

Optimize 90-day incremental cash after variable costs and pilot spend, subject to budget and staff capacity. Retention inputs: 3 months, 80% contribution margin, all retained invoices collected, immediate benefit, no further churn. Recovery inputs: one-time incremental collections, prior service costs sunk. Thus this is a short-term cash objective, not an accounting-profit or lifetime-value comparison. Costs include staff time; capacity is not charged twice.

Base assumptions are illustrative: recovery 35%, activation 12%, renewal 8%; adjustable multiplier 0–2. They are not fitted effects or probabilities estimated from this dataset. Compare break-even with a realistic prospective estimate before funding. With $1,000/20 hours activation has $1,056.80 modeled net cash, renewal $1,054.40, and recovery $120. The $2.40 difference between activation and renewal is not meaningful evidence of superiority; it is entirely assumption-driven.

## Pilot measurement plan

Assign before treatment, stratify by segment, keep an account in one experiment, and analyze intention-to-treat. Primary outcome: 90-day incremental collected contribution net of delivery and contact cost per assigned account. Report a confidence interval and complaints/churn guardrails. Estimate sample size using real baseline variance and a prespecified minimum worthwhile effect before launch. With only synthetic data there is no defensible real-world sample-size or power assertion. Do not launch based on the displayed scenario alone.

## Acceptance criteria

- Each account-month appears exactly once; source defect fixtures produce expected exceptions.
- Cash excludes payments beyond the cutoff and includes split payments exactly once.
- Reconciliation identities hold at account and aggregate levels.
- Incomplete cohort follow-up is unavailable, never treated as churn.
- Invalid inputs, zero eligible pools, insufficient budget and insufficient capacity do not produce an actionable pilot.
- Workbook uses formulas for editable assumptions; browser and workbook share the same pools and equations.

## Limits and handoff

This is a designed test fixture, not a generic production ingestion service. It requires complete contract and usage snapshots and rejects incomplete coverage and does not implement accounting recognition, dunning execution, CRM ingestion, authentication, or causal estimation. Real deployment requires source contracts, data freshness checks, credit/refund handling and ownership with Finance/Product/RevOps. Workbook formulas and cached results are programmatically checked; native Excel compatibility is not independently certified.

Workbook authoring: `build-workbook.mjs` requires `@oai/artifact-tool` in an authoring environment. The analysis, tests, dashboard and downloadable XLSX do not require that package. It checks base, zero-benefit and constrained-budget scenarios before export.

## Data contract hardening — November 4, 2026

Before SQL executes, the pipeline validates table names, column order, required values, nonnegative integer cents, canonical payment dates, supported months, account classifications and calendar-day usage bounds. Every account must have exactly one subscription and usage snapshot from cohort start through September, including zero-MRR rows after churn. Missing usage cannot silently remove revenue; missing subscriptions cannot silently appear as churn. Unknown invoice account-month keys and duplicate payment IDs stop processing. Missing invoices remain valid exceptions for investigation.

Twenty Python tests and seven JavaScript tests cover the financial controls and decision boundaries. A separate dictionary-based Python calculation checks invoice and cash totals against SQL, and reversed source ordering must yield identical results. These tests are authored within this project, not external certification.

Remaining scope: the synthetic fixture has three plans and six months; credits, refunds, proration, expansion/contraction, production warehouse execution and measured causal effects remain outside this version. Passing these controls is not a claim of universal 10/10 work-sample quality.
