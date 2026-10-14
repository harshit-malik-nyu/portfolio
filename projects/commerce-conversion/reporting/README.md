# Historical reporting mart and reconciliation

This extends the commerce study with a second, separately implemented SQL reporting path over the actual public Retailrocket file. It is a historical backfill, not the synthetic operational fixture, and not a production deployment.

## Reproduce

Python standard library only. Small committed sample:

```sh
python projects/commerce-conversion/reporting/test_reporting.py
python projects/commerce-conversion/reporting/build.py
```

Full source, after obtaining `events.csv` through the existing [source instructions](../README.md):

```sh
python projects/commerce-conversion/reporting/build.py --input /path/to/events.csv --out projects/commerce-conversion/reporting/output/full --reference projects/commerce-conversion/output/full/metrics.json
```

The committed full report was executed against the raw source, not extrapolated from the sample. `manifest.json` records the raw hash, builder hash, reference hash, output hash, source totals and individual reconciliation outcomes. CI rebuilds the sample and checks the full report's hashes and accounting identities without downloading raw data.

## Reporting contract

- Natural event grain: timestamp, visitor, event, item and transaction ID. Empty transaction IDs map to -1 for a stable SQL uniqueness constraint; exact duplicates collapse.
- Inputs are loaded in at most 50,000-row transactions. The first batch is deliberately replayed. It must insert zero additional rows.
- `ON CONFLICT` targets duplicate identity only. Invalid event types must raise an error and roll back the whole batch, rather than being silently ignored.
- Daily visitors and buyers are distinct within each UTC day. **Do not sum daily visitors to estimate global unique visitors.** The global total is computed separately from the full event table.
- Order identity is the visitor/transaction pair, matching the historical study. Orders spanning dates are attributed once, to their earliest observed date. This differs deliberately from the synthetic operational fixture's global order-ID contract.
- No price data exists. The export contains counts, not revenue, margin or monetary opportunity estimates.
- Source observation boundaries may create partial days. Observed timestamps do not prove producer completeness or freshness.

## Checks

The build requires twelve reconciliations to pass: replay inserts zero, daily events and orders sum to global counts, buyer counts do not exceed visitors, event-type components sum correctly, transaction identity fields follow the contract, source hash matches the reference, and five baseline fields match the separately implemented original analysis.

Four focused regression tests cover replay, transaction rollback, cross-day order attribution and nonadditive visitor counts.

## BI handoff

Import `output/full/daily.csv` into a BI tool as a daily aggregate table. Preserve `day` as a UTC date and all counts as integers. Sum events, views, cart-event rows, transaction rows and attributed orders over dates. A sum of daily visitors is visitor-days, not unique visitors. To calculate period-distinct visitors or period-distinct buyers, query event-level data instead of this aggregate.

A daily buyer-rate measure is buyers / visitors on one date. Across multiple dates, a ratio of summed daily counts is a visitor-day weighted measure, not unique-person conversion. Do not rename it conversion rate without defining the denominator. These files are tool-neutral exports; they are not claimed as tested Power BI or Tableau workbooks.

## Licensing and limits

Source: [Retailrocket dataset](https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset), CC BY-NC-SA 4.0. The aggregate export is an adaptation of the source; retain attribution and the applicable noncommercial/share-alike conditions. Raw visitor-level data is not republished by this addition.

This establishes reproducible processing and reconciliation on one historical source. It does not establish cloud-warehouse performance, production uptime, independent review, causality, employer use or realized financial impact.
