# Offline validation

`product.py events.synthetic.jsonl` validates explicitly synthetic events. `business_case.py` rebuilds an illustrative scenario; it is not observed ROI. See the decision brief for denominators and acceptance criteria.

## Decision laboratory

`python analysis/decision_lab.py` builds a project-specific activity-based cost comparison, 27 sensitivity scenarios, break-even volumes, and a synthetic product-analysis fixture. `python analysis/test_decision_lab.py` checks safety/capacity vetoes, denominator integrity, retention censoring and boundary uncertainty.

Read `decision_spec.json` for the units, incident definition, randomization unit and every assumption. The original domain evidence remains in `output/manifest.json`; decision-lab outputs have a separate manifest. No generated behavioral row is a real user.

See `output/decision_lab/executive-summary.md`, `economics.json`, `funnel.csv`, `cohorts.csv`, `segments.csv` and `experiment.json`. The deliberately adverse treatment segment checks that improved completion cannot automatically justify a launch.
