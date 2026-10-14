# Employer requirements → inspectable evidence

Research reviewed October 13–14, 2026. This is a purposive sample of official employer descriptions and a public role framework, not a representative vacancy survey. Requirements show what employers request; they do not prove demand for this candidate or explain individual hiring decisions. No employer endorsement, affiliation, client relationship or guaranteed eligibility is implied.

## Source register

| Employer / source | Observed requirement, paraphrased | Level / interpretation |
|---|---|---|
| [Finch Product Analyst](https://jobs.lever.co/finch/c94f2732-3307-4fe0-b021-8fc0fe6d341a) | SQL across datasets, trusted dashboards, Python automation, operational monitoring | 2–4 years in relevant analytical/operations roles; domain experience matters |
| [YipitData Senior Data Product Analyst](https://job-boards.greenhouse.io/yipitdata/jobs/8002296) | Ownership of definitions, documentation and data-quality processes, plus cross-functional coordination | 3–6 years; this particular posting excludes present/future sponsorship needs |
| [The Weather Company Senior Product Analyst](https://job-boards.greenhouse.io/theweathercompany/jobs/5182352007) | Behavioral analytics, experiments, SQL, nuanced communication and consumer-product experience | 5+ years; platform proficiency is an explicit requirement |
| [Capital One Senior Business Analyst, Deal Economics & Analytics](https://www.capitalonecareers.com/en/job/new-york/senior-business-analyst-deal-economics-and-analytics/1732/101574345792) | Commercial analysis, pricing/deal decisions, cross-functional communication | At least 2 years professional analysis; sponsorship considered, not guaranteed |
| [McKinsey Business Analyst](https://www.mckinsey.com/careers/search-jobs/jobs/businessanalyst-15136) | Structured problem solving, workstream ownership, client collaboration and implementation | Consulting BA; not interchangeable with a systems BA role |
| [GitLab Product Analyst role framework](https://handbook.gitlab.com/job-description-library/product/product-analyst/) | Conversion, retention, experiments, SQL, product-team support and written explanation | Public role framework, not a verified open requisition or sponsorship commitment |

## What to build, and what remains unproven

| Employer need | Inspectable response in this repository | Remaining boundary |
|---|---|---|
| Dependable recurring reporting | `projects/commerce-conversion/operations`: immutable reports, failed-refresh retention, recovery and audit history | Local synthetic demonstration; no employer adoption |
| Data volume and reconciliation | `projects/commerce-conversion/reporting`: full historical source, daily export, batch replay and source-hash reconciliation | Historical file backfill; no claim of live freshness or real delivery timestamps |
| Business judgment | Commerce decision brief, alternatives, conditional cost recovery and enrollment constraints | No realized ROI; prices and margins are absent from source |
| Experiment interpretation | Experiment lab with validity, economics, harm and incomplete-follow-up checks | Invented trials; no actual treatment effect |
| Definitions and handoff | Metric contract, acceptance criteria mapped to tests, recovery runbook | No stakeholder sign-off claimed |
| Clear communication | A short decision readout before the technical details | Client-facing performance needs separate observation |
| Personal ownership | Twenty-minute review guide with a live modification exercise | No pre-filled passing score; interview performance is not inferred from code |

## Portfolio decision

Lead with one coherent commerce decision system: diagnosis → investment question → experiment → reliable reporting. Keep the ten specialist studies available as supporting depth, instead of making a recruiter read all eleven studies before reaching experience and contact information. This is an editorial judgment based on role relevance, not a measured conversion result.

## What would count as employer demand

A job description is evidence of a requested capability. A recruiter screen, hiring-manager discussion of the work, technical-stage progression, final round or offer is evidence of a response to the candidate. Track those stages separately. Do not treat site visits, test counts, GitHub commits, synthetic users or an AI-generated rating as hiring demand.

No numerical interview probability is estimated from this source sample. Eligibility, experience level, geography and authorization must be checked for each actual requisition.

## October 14: a reusable measurement diagnostic

An additional [Weather Company Product Analyst, Subscriptions description](https://job-boards.greenhouse.io/theweathercompany/jobs/5223871007) explicitly requests tracking audits, event taxonomy and measurement plans. This vacancy is in Atlanta with hybrid attendance and requests 3+ years plus behavioral analytics platform experience. It is a requirements source, not a claimed NYC match or confirmed sponsorship opportunity. Finch's NYC/SF description continues to emphasize operational metrics, root-cause investigation and trusted reporting.

The selected niche is **product measurement and reporting reliability**. The new `tools/event-audit` turns part of that skill set into a reusable, local CSV diagnostic. A reviewer can bring a small approved export, inspect specific failures, and download aggregate findings. It complements the historical commerce analysis rather than claiming employer impact from it.

### From a useful tool to evidence of demand

The portfolio now offers a concrete invitation to discuss a measurement problem. This is an inbound email link, not a fabricated testimonial, automated outreach or an offer of guaranteed services. No employer has been contacted by this change.

Evidence should progress through separately recorded stages: tool feedback → a specific business problem shared → technical discussion → qualified interview → advancing process → offer. Tool use alone does not establish hiring intent. Count unique organizations, record dates and source evidence privately, and separate employer-initiated interest from solicited feedback. Do not publish personal contact details, confidential exports or unapproved endorsements. There is no invented baseline, conversion target, claim of users or automatic 10/10 score.

If reviewers engage but identify a missing capability, prioritize that capability. If qualified employers view the work without advancing, investigate role level, authorization compatibility, personal demonstration and relevance before adding another project. If no qualified reviewers see it, the portfolio has not yet been market-tested. More code cannot resolve that measurement gap.
