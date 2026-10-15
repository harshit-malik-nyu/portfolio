## Product and commercial analytics

[Start with the two-minute decision readout](https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/readout) · [Full-source reporting and BI handoff](projects/commerce-conversion/reporting/README.md) · [Employer requirement mapping](docs/employer-evidence-map.md)

I focus on conversion, retention and decision quality. These independent studies expose methods, assumptions and limitations for review.

- [Reliable reporting walkthrough](https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/operations/): executable replay, late-data, rejection and recovery scenarios.
- [Operational source and runbook](projects/commerce-conversion/operations/README.md).
- [Business requirements and acceptance tests](projects/commerce-conversion/operations/requirements.md).
- [Ownership review guide](projects/commerce-conversion/operations/ownership-review.md): a practical assessment, with no unearned claim of having passed.

## Inspect the decision-making evidence

- [Evidence map](https://portfolio-lac-five-10.vercel.app/evidence): role-specific paths from question to source, decision and limits.
- [Experiment decision lab](https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/experiment): six synthetic scenarios with validity, economic and harm gates; 13 regression tests and independent numerical references.
- [Evidence index](analysis/output/evidence-index.json): checked aggregate claims and source hashes. CI verifies these committed outputs and the offline fixture; it does not rebuild the full historical dataset.

# harshit-malik-nyu.github.io — portfolio

**Decision study:** [Executive recommendation](analysis/output/decision_lab/executive-summary.md) · [Cost, cohort and experiment methods](analysis/README.md#decision-laboratory). Behavioral results are synthetic QA; economics are explicit planning assumptions.

> **Validation update (2026-10-10):** Unicode name comparison preserves non-Latin letters; self-directed work is labeled and the missing abstain case study is added. See the [current decision brief](docs/decision-brief.md) and [reproducible analysis](analysis/README.md). Historical evidence and figures retain their original run context; this update supersedes conflicting claims below.


Static-first portfolio. No frontend build step or framework. An optional Vercel Node function implements a bounded AI evidence assistant; it is disabled until model access, spending controls and live evaluations are complete. See [activation and verification requirements](docs/ai-assistant-release.md).

## Deploying

**Vercel** — import this repository at
[vercel.com/new](https://vercel.com/new). Framework preset: **Other**. Leave
the build command empty and the output directory as the repository root.
`vercel.json` handles the rest.

**GitHub Pages** — served from the `gh-pages` branch.

## Why it is plain HTML

The three tools on the page run the real algorithms from the linked
repositories, ported to JavaScript and verified against the Python to within
0.04 points. A framework would add a build step and a dependency tree without
changing anything a reader sees.

```
index.html    structure and content
styles.css    one stylesheet
app.js        the three tools
```

## Decision robustness and domain measurement

The [decision-assurance review](analysis/output/assurance/decision-assurance.md) reports feasibility across stressed assumptions, conditional cost regret, missing-outcome identification bounds, cluster-budget sensitivity, and a project-specific domain measurement contract. Domain quality is separate from synthetic activation. An unmeasured required quality gate means HOLD.

## Featured commerce study

[Commerce conversion and investment decisions](projects/commerce-conversion/README.md) analyzes the full Retailrocket event file with an interactive dashboard, ordered funnels, mature cohorts, and a conditional funding/experiment specification. [Live dashboard](https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/).
