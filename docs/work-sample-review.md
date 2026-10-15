# Work-sample quality review

Scope: the connected commerce work sample, including historical reporting, Excel output, operational recovery, experiment decision lab and the new assignment ledger. This is an artifact review, not a candidate assessment or hiring-demand score. An assistant-authored rubric is not independent validation.

## Scoring anchors

Each domain has five dimensions scored 0–2: **0** absent or materially incorrect; **1** inspectable but incomplete; **2** reproducible, clearly communicated and supported by meaningful edge-case or decision evidence. Ten is the ceiling for the stated artifact scope, not a claim of universal role fit. Do not award points merely for file volume, test count, visual polish or tool names. A false provenance, fabricated impact or material correctness defect blocks a top rating regardless of the sum.

## Data analyst review

| Dimension | Evidence to inspect | Question that could lower the rating |
|---|---|---|
| Source and metric definitions | Historical source manifest; ledger data dictionary and window contract | Are source type, grain and denominator explicit? |
| SQL and transformation correctness | Historical independent SQL path; ledger left join and per-person reduction | Do retries, multiple purchases or missing events change counts incorrectly? |
| Quality and failure behavior | Transactional operations demo; strict ledger rejections | Can contradictory input produce a publishable partial report? |
| Reporting and handoff | Editable Excel report, documented BI handoff, aggregate ledger output | Can another analyst use the output without guessing metric semantics? |
| Verification and reproducibility | Source/output hashes, separate set-based oracle, CI rebuild | Are checks independent enough to catch plausible errors, and can the outputs be reproduced? |

Native Power BI/Tableau delivery and warehouse-scale operation remain outside the demonstrated scope. For a role requiring those capabilities, this portable sample cannot receive full role-specific credit for them.

## Business analyst review

| Dimension | Evidence to inspect | Question that could lower the rating |
|---|---|---|
| Decision framing and alternatives | Commerce readout; ledger decision record | Is the decision explicit, with credible alternatives and reversal conditions? |
| Economics and uncertainty | Conditional break-even model; denominator-change illustration | Are hypothetical inputs separated from measured results and realized ROI? |
| Requirements and traceability | Operational acceptance criteria; ledger L1–L10 | Can a reviewer trace a requirement to an observable acceptance check? |
| Change, risk and ownership | Denominator change assessment; proposed responsibilities; actual defect record | Are dependencies and unresolved approval responsibilities clear? |
| Executive communication | Short browser readout with recommendation, evidence and next decision | Can a nontechnical owner explain why rollout is held without reading the code? |

Stakeholder elicitation and negotiation cannot be inferred from a solo case. Proposed roles and scenario requests are explicitly labeled. No business acceptance or deployed financial result is claimed.

## Product analyst review

| Dimension | Evidence to inspect | Question that could lower the rating |
|---|---|---|
| Metric and population design | All-assigned ledger, historical cohort definitions | Are eligibility, analysis unit, exposure and denominator distinguished? |
| Instrumentation investigation | Identity checks, event timing, exposure diagnostics | Can consistent supplied logs still omit important evidence? |
| Experiment validity | SRM, maturity, stopping and identity gates | Does the work incorrectly treat elapsed time or equal counts as proof of validity? |
| Decision quality | Economic lower bound, harm ceiling, explicit blocked handoff | Can a positive point estimate override unresolved validity or harm? |
| Reproducibility and communication | Row-level fixture to SQL to gate to browser readout | Can a reviewer trace the recommendation and challenge a boundary case? |

Actual behavioral-platform implementation, preregistered experimentation and shipped treatment effects are not demonstrated. Treat these as role-specific gaps where required, not as accomplishments implied by the simulation.

## Release evidence for this revision

The ledger adds row-level inspection beneath previously aggregate-only experiment inputs. Its tests challenge selection, duplicate delivery, binary outcomes, invalid identities, timestamp boundaries and immature follow-up. Fifty varied cases compare SQL aggregation against a set-based reference. Reproducible builds connect the fixture to the decision engine and browser readout. The public artifact deliberately refuses to convert passing log checks into launch authorization.

This review exposes the basis for a score instead of manufacturing a perfect rating. A reviewer should assign scores after running or inspecting the evidence and state whether the target role requires capabilities outside this sample's scope.
