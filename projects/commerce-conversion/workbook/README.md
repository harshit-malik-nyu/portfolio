# Commerce operating report in Excel

[Download the workbook](https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/workbook/commerce-report.xlsx) · [Preview](https://portfolio-lac-five-10.vercel.app/projects/commerce-conversion/workbook/report-preview.png)

Two worksheets: a date-filtered operating report and the complete 139-row daily source. The report uses editable dates, SUMIFS, COUNTIFS, monthly aggregation, a native editable line chart and independent control totals. Dates and counts are numeric Excel values. No macros or external data connection is required to use the delivered file.

## What to inspect

- Change the two amber dates. The period events, orders and observed-day count recalculate.
- Select May 3, 2015 only: 13,682 events and 70 orders.
- Clear a date or reverse the window: the report marks the input invalid instead of returning a misleading zero.
- Choose dates outside coverage: measures are unavailable, not zero.
- Compare full-source totals: 2,755,641 distinct events and 17,672 orders.
- Daily visitors are intentionally not summed into period unique visitors. That measure requires underlying identities, which are absent from this aggregate export.

Monthly context and its chart deliberately retain full historical source coverage when the reporting window changes. May and September have partial coverage; the chart compares orders per observed day, not raw monthly totals. These are descriptive historical figures, not a causal result or current-business forecast.

## Provenance and verification

Input: `../reporting/output/full/daily.csv`, with hash and upstream reconciliation in `../reporting/output/full/manifest.json`. Source: Retailrocket 2015, CC BY-NC-SA 4.0. No prices, margins or revenue were invented.

`build.mjs` authors the workbook using `@oai/artifact-tool`. Run it in an environment providing that package, passing the repository root as its argument. `verification.json` records the tested calculation boundaries. Both worksheets were rendered and visually inspected. Formulas were recalculated in Artifact Tool, including single-day, missing-date, invalid-window and no-coverage cases. Microsoft Excel desktop was unavailable, so native desktop recalculation was not independently tested. The exported XLSX contains formulas, cached values and a native chart.

This demonstrates a spreadsheet reporting artifact. It does not establish Power Query, PivotTable, Power BI, Tableau or personal interview proficiency. The source and generation code are available for review; AI assistance was used.
