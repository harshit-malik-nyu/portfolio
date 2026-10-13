# Ownership review: demonstrate the reasoning

This is an assessment guide, not a record of an assessment already passed. AI-assisted artifacts should be judged together with the candidate's ability to explain and change them.

## Suggested 20-minute review

1. **Definition, 4 minutes:** explain why buyer rate differs from ordered funnel conversion. Identify what cannot be concluded about revenue, people, causality or missing dates.
2. **Failure, 5 minutes:** predict what happens when a valid event is followed by an event-ID conflict. Execute it and inspect event counts, report versions and audit history.
3. **Change, 6 minutes:** implement a requested variation, such as a separate configurable freshness policy, without silently changing historical metric definitions. Add a boundary case and explain the migration implications.
4. **Business judgment, 5 minutes:** explain why the late purchase changes yesterday's report without demonstrating product lift. Describe the message to the stakeholder and the evidence needed before acting.

## Assessment rubric

- **Insufficient evidence:** recites terms or runs scripts but cannot explain the denominator, failure behavior or limitations.
- **Working proficiency:** explains the SQL and transaction, predicts failures correctly and makes a small correct change.
- **Strong ownership:** anticipates correction and concurrency risks, makes a tested change, and communicates the effect on an actual decision clearly.

No score is pre-filled. Live performance and independent review remain unmeasured.
