# Analyst requirements and portfolio decisions

Reviewed October 14, 2026. Purpose: distinguish broad skills demand from a few selected job descriptions, and choose inspectable work samples. This is not an estimate of interview odds, a candidate ranking, or evidence of employer interest in this candidate.

## October 14 extension: broader employer evidence and its implications

[NACE's April 20 skills article](https://www.naceweb.org/talent-acquisition/candidate-selection/the-key-skills-employers-seek-on-college-students-resumes) identifies teamwork, problem solving and communication as leading priorities. More than half of respondents cited more than ten skills. Its spring survey had 185 organizations, including 142 members (19.9% of eligible member respondents) and 43 nonmembers. This supports a majority **among responding college recruiters**, not a majority of all employers. Examples and interview explanations matter; a longer skills list does not establish proficiency.

The [GMAC 2026 Corporate Recruiters Survey](https://www.gmac.com/-/media/files/gmac/research/employment-outlook/2026-corporate-recruiters-survey/report.pdf?rev=393c8c8d983f401cb3e97638717b7ed3), surveyed January–May, adds a different population: 621 recruiters across 39 countries recruiting MBA/business master's graduates. Global results are GDP-weighted. Its narrative ranks communication and problem solving highest, adaptability third and data interpretation fourth. AI-tool skills rank fourteenth, despite growth. It also reports reduced US openness to international hiring. These findings are not analyst-only, OPT-specific or a hiring probability for this candidate. The practical inference is to show judgment about outputs and adaptation, rather than treating AI-generated artifact volume as employability.

[GitLab's Product Analyst framework](https://handbook.gitlab.com/job-description-library/product/product-analyst/) adds task-level specificity: KPI ownership, adoption/retention/monetization analysis, experiment evaluation, caveat communication and discoverable documentation. It is a role framework, not a verified vacancy. Attentive 4118958009 redirected to the general board when checked and is excluded from current-vacancy evidence.

**Implementation decision:** add a short problem-first route to the role evidence page and a linked [hiring evidence brief](hiring-evidence-brief.md). Give reviewers a concrete reconciled result, direct paths to three responsibilities, and a live ownership review. This changes how evidence is presented, not the underlying analytical results. No reduction in review time or improvement in hiring conversion has been measured.

**Remaining gaps cannot be closed by relabeling:** a custom dashboard is not native BI-platform experience; a synthetic experiment is not a shipped experiment; documented acceptance criteria are not stakeholder acceptance; an assistant-authored answer is not observed candidate execution. A stronger artifact can reduce evaluation effort, but it cannot independently produce an employer's decision. Additional autonomous development should target a verified missing capability, not an arbitrary requirement to make a self-assigned score equal ten.

## Population evidence: software mentioned in US postings

O*NET publishes Lightcast-derived percentages of unique US postings mapped to an occupational category. The current tables cover **January–December 2025**, not October 2026 vacancies. Percentages measure explicit mentions, not proficiency levels or the percentage of all employers requiring a skill. A posting can mention several tools. Do not add percentages to infer a union.

| Occupation (imperfect proxy for job titles) | Explicit software mention rates |
|---|---|
| [Business Intelligence Analysts, 15-2051.01](https://www.onetonline.org/link/demand/15-2051.01) | SQL 35%; Power BI 20%; Python 20%; Tableau 19%; Excel 17% |
| [Management Analysts, 13-1111.00](https://www.onetonline.org/link/demand/13-1111.00) | Excel 21%; SQL 20%; PowerPoint 14%; Power BI 11%; Jira 10%; Tableau 9%; Visio 8% |
| [Computer Systems Analysts, 15-1211.00](https://www.onetonline.org/link/demand/15-1211.00) | SQL 16%; Excel 15%; SAP 13%; PowerPoint 10%; Jira 6%; Python 6%; Power BI 5% |

None of these numbers supports “most employers require this specific tool.” The practical inference is to demonstrate familiar reporting and communication tools alongside programming. A custom browser dashboard does not prove native BI-tool proficiency. Product Analyst has no clean one-to-one occupation proxy in these tables; do not assign it invented market percentages.

## Role differences

[O*NET Management Analysts](https://www.onetonline.org/link/summary/13-1111.00) emphasizes investigating work problems, evaluating alternatives, documenting recommendations and helping implement procedures. [Computer Systems Analysts](https://www.onetonline.org/link/summary/15-1211.00) provides a separate systems-analysis context. “Business Analyst” spans commercial analytics, consulting and systems delivery. A single checklist is misleading.

| Role family | Work to demonstrate | Current evidence | Material remaining gap |
|---|---|---|---|
| Data / BI analyst | Query at the right grain, validate data, maintain useful reports, explain changes | SQL daily mart, reconciliation, Excel report, historical dashboard | Native BI platform delivery, production usage, independent personal execution |
| Commercial business analyst | Define decision, compare alternatives, quantify economics, communicate recommendation | Commerce readout and explicit economic assumptions | Real stakeholder adoption, industry depth, realized result |
| Systems business analyst | Requirements, process dependencies, acceptance criteria, defect handling and handoff | Event-audit delivery record and reporting requirements | Real elicitation, stakeholder negotiation, signed acceptance, platform-specific workflows |
| Product analyst | Instrumentation, metric definitions, cohorts, experiment validity and decision implications | Event audit, observed cohorts, synthetic experiment lab | Real tracking implementation in a behavioral platform, shipped experiments, observed ownership |

## Employer examples, with applicability boundaries

Purposive descriptions chosen for role contrast, not a random sample. No frequency estimate is calculated from them. Public availability is not confirmation that a requisition is accepting applications.

| Employer / source | Requirements relevant to this portfolio | Applicability |
|---|---|---|
| [Finch Product Analyst](https://jobs.lever.co/finch/c94f2732-3307-4fe0-b021-8fc0fe6d341a) | SQL, Python, operational reporting, issue investigation, ongoing process ownership | NYC/SF hybrid; 2–4 years; sponsorship not established |
| [Facilisgroup Data Analyst](https://jobs.smartrecruiters.com/FacilisgroupLLC/743999900113973-data-analyst) | Data validation, dashboards, SQL Server, Power BI, Excel, cross-team communication | St. Louis local candidates; 1–3 years; publication date not established |
| [Capital One Senior BA, Deal Economics](https://www.capitalonecareers.com/en/job/new-york/senior-business-analyst-deal-economics-and-analytics/1732/101574345792) | Commercial judgment, pricing/deal work, analysis and clear communication | NYC among locations; 2+ professional years; considers sponsorship |
| [McKinsey Business Analyst](https://www.mckinsey.com/careers/search-jobs/jobs/businessanalyst-15136) | Workstream problem solving, client collaboration and implementation | Consulting role, distinct from systems BA; individual eligibility not established |
| [YipitData Senior Data Product Analyst](https://job-boards.greenhouse.io/yipitdata/jobs/8002296) | SQL pipelines, definitions, quality and cross-functional ownership | 3–6 years; explicit restriction on current/future sponsorship |
| [Weather Company Product Analyst, Subscriptions](https://job-boards.greenhouse.io/theweathercompany/jobs/5223871007) | Tracking audits, taxonomy, measurement plans, SQL, experimentation, behavioral analytics platform | Atlanta hybrid; 3+ years; no sponsorship commitment established |
| [Bath & Body Works Product Analyst, Customer Data Orchestration](https://careers.bathandbodyworks.com/product-analyst-customer-data-orchestration/job/057P3) | User stories, acceptance criteria, UAT, dependencies, validation and experimentation | Columbus hybrid; 2+ role years plus 3+ relevant domain years; SQL preferred |
| [Wrike Product Analyst](https://job-boards.greenhouse.io/wrike/jobs/4249802005) | SQL, BI, experimentation, independent analysis and communication | **Prague**, 2+ years; cross-market comparison only, excluded from US hiring inference |
| [GitLab Product Analyst framework](https://handbook.gitlab.com/job-description-library/product/product-analyst/) | SQL, conversion/retention, experiments and product-team work | Role framework, not a verified vacancy |

Excluded from current-vacancy evidence: NYC ACS Data Analyst jid-35015 (expired, civil-service restriction); NYC Finance BA jid-45950 (expired, civil-service restriction); Cohere Health Product Analyst 8004622003 (redirects to board); Assurant R-114884 (404); Amazon tax BA 10502167 (404). Search snippets alone were not treated as live vacancies. Maersk's page yielded no readable body; it was not used to establish requirements.

## Decisions implemented

1. Add a real editable Excel report over the existing independently reconciled historical daily source. Avoid a second unrelated dataset and unsupported revenue claims.
2. Show systems-BA work through an actual portfolio delivery record: requirements, acceptance evidence, a real deployment defect and its correction, and unresolved stakeholder approval. Do not invent meetings or sign-offs.
3. Present separate data, business and product reading paths with concrete questions a reviewer can test. Make remaining limits explicit rather than claiming every tool on a job description.

## Demand is a different measurement

Requirements describe market demand for capabilities. Employer use, discussion, interview progression and offers describe responses to a candidate. A useful artifact can create a reason to engage, but it cannot establish those responses in advance. Maintain role eligibility, reviewer exposure, substantive response and hiring progression as separate observations. No score or conversion rate is fabricated here.

## Deeper evidence: what can legitimately be called a majority?

The [NACE Job Outlook 2026 Spring Update](https://www.naceweb.org/docs/default-source/default-document-library/2026/publication/research-report/2026-job-outlook-report-spring-update.pdf) surveyed 185 organizations February 12–March 17, 2026; question-level samples differ. On the skills-presentation question (161 responses), 59% preferred specific skills accompanied by examples. The report identifies communication, teamwork and critical thinking as leading career-readiness priorities. These findings describe participating college recruiters, **not a census or representative majority of all US employers, analyst hiring managers, NYC employers or OPT-compatible openings**. They support inspectable examples, not a claim of universal hiring fit.

[NACE's January 12, 2026 summary](https://www.naceweb.org/job-market/trends-and-predictions/employer-use-of-skills-based-hiring-practices-grows) reports that 70% of its Job Outlook survey participants use skills-based hiring. That is a majority within the survey population. It does not mean 70% will inspect a GitHub repository or waive experience requirements.

The [2026 internship survey](https://www.naceweb.org/talent-acquisition/internships/intern-conversion-rate-hits-highest-mark-in-five-years) reports 63.1% conversion for 2024–25 interns, with 284 participating organizations. This is evidence about an observed-work hiring pathway, not the probability that a particular OPT candidate will get hired. Selection into internships and participating employers limits generalization.

### Additional employer check

[Amazon Business Analyst I, Verification Services, 10554911](https://amazon.jobs/en/jobs/10554911/business-analyst-i-verification-services) was readable on October 14, 2026, with Seattle as location. It calls for SQL/ETL, requirements definition, stakeholder work, automated reporting and root-cause analysis. Its basic qualifications include 1+ year of relevant analytical experience **and 2+ years writing complex Excel VBA macros**. The existing formula workbook does not meet that VBA requirement. Sponsorship for this requisition has not been established. This is a requirements example, not a verified candidate match.

Further exclusions: CLEAR Senior Product Analyst 7580028 redirects to the job board and is not treated as a live vacancy. Headout Product Analyst 4621320006 is in Bengaluru, so it is excluded from US role-demand inference. These checks illustrate why search-result counts are not reliable job-market sample counts.

### Requirements translated into observable behavior

| Domain | Artifact evidence | What a live review must still establish |
|---|---|---|
| Data | SQL reconciliation, workbook, rollback/replay tests | Independently choose grain, diagnose a changed input, write and test a correction |
| Business | Conditional economics, requirements and actual defect records | Clarify conflicting needs, negotiate scope, communicate recommendation and owner |
| Product | Cohorts, event contract, experiment gates | Separate logging effects from product effects; specify credible assignment, exposure and outcome checks |
| Shared | Runnable, documented three-role review kit | Clear communication, adaptation and collaboration under an unfamiliar change |

Implementation: extend the existing ownership review with a seed-varied synthetic case, independent set-based expected results, role-specific prompts and a blank behavior-anchored rubric. This lowers review effort. It does **not** manufacture a completed interview, reference, stakeholder adoption or employer demand.

### Narrow problem hypothesis: trustworthy reporting and measurement

An additional primary-source check, [YipitData Data Product Analyst, Corporate, 7998077](https://job-boards.greenhouse.io/yipitdata/jobs/7998077), explicitly describes end-to-end data quality, investigation, workflow automation and communicating methodology limits. It requires 4–6 years of experience and excludes current/future sponsorship needs. Therefore it supports the **problem hypothesis**, not candidate eligibility or an application recommendation. The Amazon IDC Analytics 10518507 result returned 404 and Fiserv R-10401129 yielded no readable body; neither was counted as a verified opening.

The controllable product improvement is to make the existing event-contract diagnostic usable in repeatable local workflows, not only a browser demonstration. Its Node CLI uses the same engine, bounds file reads, rejects malformed UTF-8 and returns separate statuses for passed checks, review, blocked data and input errors. Tests check browser-engine parity and that raw IDs do not appear in the report. This addresses a specific workflow requirement without claiming a production deployment, adoption, commercial licensing permission, or a representative majority of employer demand.

### Measuring demand separately

Keep a private, consent-aware record of the role, eligibility confirmation, evidence actually reviewed, substantive response and subsequent interview progression. Distinguish a generic recruiter message from explicit interest in a work sample. One employer's positive feedback is not broad demand; views, clicks, automated acknowledgments and self-generated scores are not substitutes. Public claims should be permissioned and supported by actual correspondence or outcomes. There is no statistically calibrated 10/10 threshold here.
