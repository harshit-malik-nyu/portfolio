# Metric dictionary

All timestamps use UTC. Visitor IDs are anonymous browser identifiers, not verified people. Source: Retailrocket's original events.csv; source hash in ../data/provenance.json.

| Metric | Grain and numerator | Denominator or rule |
|---|---|---|
| Distinct recorded events | Exact distinct timestamp, visitor, event, item, transaction ID | All source rows; collapsed records counted separately |
| Session | Events for a visitor until inactivity exceeds the selected gap | Default 30 minutes; 15/60-minute sensitivity |
| View stage | Session with at least one view | All observed sessions |
| Ordered cart | Session with a cart strictly after its first view | View sessions for transition rate |
| Ordered purchase | Session with purchase strictly after its earliest qualifying cart | Ordered cart sessions for transition rate |
| Any purchase-session rate | Session with any purchase event | All observed sessions, including sessions without views |
| Orders | Distinct visitor + nonmissing transaction ID | Multi-item transaction events count as one order |
| Seven-day cart conversion | Visitor with an order strictly after first observed cart and within seven days | First-cart visitors whose complete seven-day window falls within the source observation period |
| Seven-/30-day activity return | Visitor with an event more than 24 hours and within seven/30 days of first observed event | Visitors with complete respective follow-up; aggregated by first-observed calendar week |
| 30-day repeat purchase | Buyer with another order more than 24 hours and within 30 days of first observed purchase | Buyers with complete 30-day follow-up |
| Modeled additional orders | Assumed absolute purchase lift times eligible historical visitors | Assumes one incremental order per additional converting visitor |
| Modeled net contribution | Additional orders × assumed order value × assumed contribution margin minus fixed project cost | One future audience of the same size as the historical eligible group |

## Interpretive constraints

The ordered funnel is session-level and allows different items across stages. It does not prove an item-level path or contain a checkout/payment stage. Equal-timestamp stages are not assigned an invented sequence. Twelve visitor/timestamp groups contain different event types; they are retained but ties cannot satisfy strictly ordered transitions.

No missing transaction IDs or shared transaction IDs across visitors were observed. This does not verify payment settlement, refunds, identity or revenue. Exact-duplicate collapse is an analytical choice; identical records could conceivably be legitimate repeated logging. Raw counts and the number removed remain visible.

A seven-day cart outcome can occur in another session. Thus it must not be equated with within-session ordered purchase. Repeated sessions are dependent, so the dashboard does not attach naive independent-session significance tests to segment differences.

Wilson intervals for repeat purchase assume independent visitor identifiers and a stable underlying binomial process. Cross-device identity and temporal dependence can violate that assumption. These intervals quantify conditional sampling uncertainty, not transportability to a present-day business.

Immature cohorts remain in raw visitor counts but do not enter mature-window rates. A cohort with no mature members has a null rate, not zero. Visitors first observed on different days within a week can have different maturity at the source cutoff. The first and last calendar weeks are partial.

No population-level retention target is assumed. A low repeat-purchase rate can reflect the site's products, anonymous identity resets, incomplete history or purchase cadence. It is not proof of dissatisfaction.
