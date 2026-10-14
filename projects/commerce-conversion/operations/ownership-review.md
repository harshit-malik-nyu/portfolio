# Ownership review: demonstrate the reasoning

This is an assessment guide, not a record of an assessment already passed. AI-assisted artifacts should be judged together with the candidate's ability to explain and change them.

## Suggested 20-minute review

1. **Definition, 4 minutes:** explain why buyer rate differs from ordered funnel conversion. Identify what cannot be concluded about revenue, people, causality or missing dates.
2. **Failure, 5 minutes:** predict what happens when a valid event is followed by an event-ID conflict. Execute it and inspect event counts, report versions and audit history.
3. **Change, 6 minutes:** implement a requested variation, such as a separate configurable freshness policy, without silently changing historical metric definitions. Add a boundary case and explain the migration implications.
4. **Business judgment, 5 minutes:** explain why the late purchase changes yesterday's report without demonstrating product lift. Describe the message to the stakeholder and the evidence needed before acting.

## Runnable three-role exercise

Use a reviewer-chosen seed to change the counts. All events are synthetic. The fixture is public and the answer key is available: this is **not a secure or unseen hiring test**. Change the problem during a live discussion to assess understanding. No candidate performance or employer endorsement has been recorded.

```sh
python projects/commerce-conversion/operations/review_case.py --seed 18
# After forming a prediction, reveal and verify the reference:
python projects/commerce-conversion/operations/review_case.py --seed 18 --verify
```

The first command prints three batches and a fixed demonstration clock. It does not run a refresh or reveal a score. The second executes baseline, rejected correction, repaired correction, and replay in an in-memory database. An independent set-based oracle checks the pipeline's SQL results. Neither command makes network calls or writes a database to disk. Python standard library only.

### Data analyst prompt — 10 minutes

Predict the number of visitors, buyers, orders and event records after each step. Explain duplicate transport rows versus multiple item rows for one order. Write a SQL check for one of your predictions. Explain why a rejected batch must not partially update the report, then verify. Reviewer change: add a second order for an existing buyer; predict which metrics should change before running it.

### Business analyst prompt — 10 minutes

A stakeholder wants to circulate the refreshed number immediately; an engineer says the correction has an identity conflict. Ask the questions needed to understand urgency, audience, ownership and decision impact. Propose acceptance criteria and a safe interim communication. Write a five-sentence decision note covering recommendation, evidence, uncertainty, owner and next checkpoint. Reviewer change: the report is needed for a board meeting in 30 minutes. Negotiate scope without pretending invalid data is valid.

### Product analyst prompt — 10 minutes

The corrected daily buyer rate is higher. A PM asks whether a product change worked. Explain what the records establish and what they cannot establish. Define the assignment, exposure, outcome window and guardrails needed to assess causality. Reviewer change: treatment logging was delayed more often than control logging. Explain how the issue could bias an apparent treatment effect and what you would inspect.

### Blank reviewer scorecard

Agree beforehand whether AI, documentation and other assistance are permitted; record assistance actually used. A reviewer may choose just one role. Do not equate fixture tests with candidate performance.

| Dimension | 0: not demonstrated | 1: partial | 2: demonstrated | Score / evidence |
|---|---|---|---|---|
| Definitions | Wrong grain or denominator | Correct with prompting | Independently defines and checks | Not assessed |
| Execution | Cannot reproduce result | Runs reference only | Produces and tests a correct change | Not assessed |
| Judgment | Claims unsupported impact | Notices some caveats | Chooses action consistent with uncertainty | Not assessed |
| Communication | Unclear or misleading | Accurate but not decision-ready | Concise recommendation with owner and next step | Not assessed |
| Collaboration | Ignores constraints | Responds with prompting | Clarifies trade-offs and adapts constructively | Not assessed |

This informal rubric is not a validated selection instrument or market ranking. No total is pre-filled. Record observable behavior, not demographic information. Keep reviewer identities and hiring feedback private unless publication is explicitly authorized. A review result is not an offer, sponsorship commitment or evidence of multiple employers competing.

## Overall interpretation

- **Insufficient evidence:** recites terms or runs scripts but cannot explain the denominator, failure behavior or limitations.
- **Working proficiency:** explains the SQL and transaction, predicts failures correctly and makes a small correct change.
- **Strong ownership:** anticipates correction and concurrency risks, makes a tested change, and communicates the effect on an actual decision clearly.

No score is pre-filled. Live performance and independent review remain unmeasured.
