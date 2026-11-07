# User research and decision protocol

**Status: study ready; not conducted.** No participants, quotations, observed behavior or customer findings are fabricated. This document demonstrates research design, not completed research experience.

## Decision to inform
Can a reporting consumer distinguish a rejected refresh from a trustworthy but older report, identify affected dates, and choose a safe next action without an analyst explaining the screen?

## Participants and recruitment plan
Proposed sample: five reporting consumers and three analysts or support engineers, with experience interpreting operational reports. Use voluntary participation and explicit consent. Do not collect employer secrets, customer data or account credentials. This is a qualitative usability sample, not a statistical estimate of adoption or a population-representative survey. No outreach is performed by this project.

## Session guide: 25 minutes
1. Obtain consent for notes and, separately, any recording; permit withdrawal. Record role category only, not sensitive identifiers.
2. Ask: “Tell me about the last time a report changed unexpectedly. What did you do next?” Avoid suggesting an answer.
3. Show the baseline reporting scenario. Ask the participant to explain what is known and what remains uncertain.
4. Show the conflict scenario. Ask: “What would you tell a teammate who wants to use this number?” Do not point out retained version or freshness.
5. Show late arrival and recovery. Ask which dates and decisions should be reviewed, and why.
6. Ask what information is missing, which action they would take, and how confident they are. Request a concrete example rather than agreement with the design.

## Observation rubric

| Task | Success evidence | Failure signal | Design implication to investigate |
|---|---|---|---|
| Identify report age | States original as-of time and that refresh failed | Treats available report as current | Improve freshness label and blocked-refresh notice |
| Explain rejected batch | Identifies rejected input and retained report | Assumes partial rows were published | Make atomic rejection explicit |
| Explain restatement | Identifies affected day and late-arrival cause | Calls the increase causal product uplift | Separate recording changes from behavior |
| Choose escalation | Identifies source owner and missing prerequisite | Overwrites identities or forces approval | Clarify runbook and responsibility |

Capture task outcome, observed action, verbatim note only when actually said, interpretation, severity and contradictory evidence separately. A facilitator hypothesis is not a user quote.

## Synthesis and backlog decision
Cluster observed failures by task, label evidence by participant code, include counterexamples, and distinguish task failure from preference. Critical misunderstanding of freshness blocks release; wording preferences alone do not. Promote an issue to backlog only with supporting observations or an independently verified defect. Compare proposed changes with existing acceptance tests, then run another study round before claiming usability improved.

## Findings register template
`participant_code | task | observed_behavior | exact_quote_if_consented | interpretation | severity | alternative_explanation | candidate_story | retest_result`

The register is deliberately empty until research is conducted. No adoption lift, satisfaction score or interview count is claimed.
