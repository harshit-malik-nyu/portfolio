# Commerce conversion and investment decisions

A self-directed analytics study by Harshit Malik: which customer-journey problem should a commerce team investigate first, and what improvement would justify funding it?

[Open the live dashboard](https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/) · [Decision brief](docs/decision-brief.md) · [Metric dictionary](docs/metrics.md) · [Source provenance](data/provenance.json)

## Recommendation

Investigate the cart experience and instrument its failure modes before funding a rollout. The historical event log supports a targeted experiment baseline, not proof that checkout is broken or that a particular design will improve sales.

The analysis processes the **full original Retailrocket event file**, not synthetic journeys: 2,756,101 rows from May 3 through September 18, 2015 (UTC). It collapses 460 identical records, preserves 1,407,580 visitor identifiers, and distinguishes 22,457 purchase-item event records from 17,672 distinct visitor/transaction orders.

At a 30-minute session timeout, 36,675 sessions contain a view followed by a cart; 10,721 contain a later purchase. Ordered cart-to-purchase conversion is 29.23%, and stays between 28.99% and 29.02% under the alternative 60- and 15-minute definitions. These are recorded within-session sequences, not checkout completion or payment acceptance rates.

For a visitor-randomized experiment, the relevant historical baseline is different: **9,927 of 36,141 mature first-cart visitors purchase within seven days, or 27.47%.** Only 346 of 9,445 mature first-observed buyers place a distinct order after 24 hours and within 30 days (3.66%). The observation window and anonymous IDs limit both measures.

## What makes the decision conditional

- No device, acquisition-channel, checkout-error, price, margin or refund fields exist. The financial model explicitly assumes order value, contribution margin, cost and lift.
- The dataset is historical and observational. It does not identify a causal intervention or current conversion benchmark.
- Later observed sessions convert more frequently, but this is a selected population, not evidence that causing another session will cause a purchase.
- Session-timeout sensitivity changes session counts and purchase rates. Visitor-level seven-day outcomes do not depend on that timeout.
- A price-free source cannot establish observed revenue. The dashboard reports actual behavior separately from modeled revenue and contribution.

## Reproduce

Python 3.10+ and Node 18+; standard libraries only. No paid service or model API is required.

```sh
cd projects/commerce-conversion
python tests/test_analysis.py
node --test tests/calculator.test.cjs
python analyze.py
python build_site.py
```

The default analysis uses `data/sample.csv`: all events for visitor IDs divisible by 1,000 (2,575 rows, 1,408 visitors). This is a small deterministic reproduction fixture, not the population used for dashboard findings. Tests use explicitly synthetic counterexamples and are never mixed into either dataset.

To reproduce the full observed analysis, download the original public source (approximately 305 MB archive; 94 MB events CSV) and verify its SHA-256:

```sh
python fetch_data.py
python analyze.py --input data/raw/events.csv --out output/full --label "Full Retailrocket public events file; historical observational data"
python analyze.py --input data/raw/events.csv --gap 15 --out output/gap15 --label "Full Retailrocket public events file; session-gap sensitivity"
python analyze.py --input data/raw/events.csv --gap 60 --out output/gap60 --label "Full Retailrocket public events file; session-gap sensitivity"
python build_site.py
```

The full source is excluded from Git. CI runs the counterexamples, calculator checks, sample reproduction, and reconciliation of the committed full aggregates. CI does not silently substitute the sample for full-data validation. Original-source download availability is an external dependency only for a full rebuild; the published dashboard and offline sample work without it.

## Repository map

- `sql/model.sql`: SQLite window functions, session reconstruction, ordered sequence logic and distinct orders.
- `analyze.py`: ingestion, reconciliation, cohort queries, seven-day trial baseline and manifests.
- `output/full`, `output/gap15`, `output/gap60`: computed full-source aggregates and provenance hashes.
- `dashboard.js`: interactive filters and a tested conditional contribution calculator.
- `docs/decision-brief.md`: alternatives, funding boundaries, proposed experiment, acceptance criteria and handoff.
- `docs/metrics.md`: grains, denominators, censoring and source limitations.

## Data choice and attribution

The initial design considered Google's GA4 sample. Direct access required a Google Cloud project unavailable in this session. Retailrocket's original public event file was accessible without credentials, so the analysis uses its actual recorded stages and available fields. No GA4 data or copied third-party analysis is represented as this project's source.

Source: [Retailrocket recommender system dataset](https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset), published by Retailrocket, retrieved October 12, 2026. Source data, redistributed subset, and derived data/report adaptations are attributed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Changes are documented above. This is a noncommercial educational portfolio case study, not a client engagement. Original project code is MIT licensed; see LICENSE.
