# From interaction to acceptance

A working browser instrumentation and analytical handoff demonstration. The visitor explicitly starts a session, views a demo product, adds it to a cart, simulates failures, and completes a demo order. No purchase, payment, backend collector or causal experiment exists. Events are real interactions with this demonstration; the committed fixture is synthetic. They must never be pooled.

## Decision and tracking plan

**Question:** Does our measurement distinguish abandonment, failed attempts, and recovered completion without inflating the denominator or outcome?

**Unit:** an explicitly started in-memory demo session, not a person. Reloading or clearing and starting again creates another unit. There is no cross-tab identity, persistence or attribution. No events are recorded by this code before Start; the hosting platform still receives ordinary requests.

| Event | Trigger | Required prior state | Result |
|---|---|---|---|
| session_started | Explicit Start | No active session | assigned |
| product_viewed | View product | assigned | viewed |
| cart_added | Add to cart | viewed | carted |
| checkout_failed | Simulate checkout failure | carted | carted; retry remains possible |
| order_completed | Complete demo order | carted | completed; terminal |

The names describe demo actions, not a payment provider's confirmations. Every row has exactly `event_id`, `session_id`, `sequence`, `event`, `occurred_at`. Session IDs are random, ephemeral UUIDs prefixed `s-`; event IDs combine session and sequence. Times use canonical UTC milliseconds. Sequence starts at one, is contiguous, and timestamps cannot regress. Unknown fields, including added personal fields, are rejected. No localStorage, cookies, network dispatch or model calls are used by the event code. Clearing discards memory but cannot remove previously downloaded files.

## Metric contract

- Started denominator: count every validated started session, including sessions with no product view.
- Viewed denominator: count sessions with a view; descriptive secondary population only.
- Completion: at most one terminal completion per session, not purchase attempts, revenue or verified orders.
- Failure attempts: count each explicit failed attempt. A session can fail multiple times and still complete.
- Recovery: count sessions that have at least one failure and later complete.
- Absence of events: does not establish abandonment in a real store. Here it means no further action in the supplied snapshot. There is no retention window or maturity gate, so this demo cannot estimate production abandonment.
- Redelivery: an exactly equal session snapshot collapses. Different snapshots for one session reject the batch rather than silently picking a winner. Versioned incremental ingestion is outside this handoff contract.
- Mixing `local_demo` with `synthetic_fixture` is rejected. All figures remain descriptive.

## Independent handoff

JavaScript owns instrumentation. Python validates exports independently, loads an in-memory SQLite database, and uses a left join plus per-session reduction before computing aggregates. It outputs no identifiers. Validation finishes before SQL aggregation. The CLI exits 2 with no stdout metrics on invalid input.

```sh
node --test tests/measurement-lab.test.cjs
node projects/measurement-lab/build.cjs
python projects/measurement-lab/test_handoff.py
python projects/measurement-lab/build.py
python projects/measurement-lab/analyze.py projects/measurement-lab/fixture.json
# Substitute a downloaded browser log to test the same handoff on demo activity.
```

Fixture expectations: 3 started, 2 viewed, 1 carted, 1 completed, 2 failed attempts, 1 recovered; 1/3 completion per started versus 1/2 per viewed. The fixture demonstrates a population difference; it does not estimate an effect. Python tests additionally vary population size from 1 to 100 against independently constructed expected counts. Bounds: 8 MiB input, 1–1000 logs, 1–100 events per log. Not a production scale claim.

## Ownership and limitations

This is an AI-assisted, self-directed portfolio implementation. Reproducible artifacts demonstrate system behavior, not independent candidate performance. No observed stakeholder elicitation, business sign-off, real revenue, production SLA, or employer validation is implied. See [acceptance.md](acceptance.md) for a proposed delivery process and explicit approval boundaries.

## Browser review and exported decision record

The page accepts a local file or pasted JSON. `review.js` independently aggregates validated sessions in JavaScript; it does not run SQL in the browser. `verify_review.py` compares 100 seeded populations against Python/SQLite and adds six valid numeric/calendar boundaries and confirms that both reject fourteen invalid cases. `review-verification.json` binds the results to source hashes. Native JSON duplicate-key overwrite is prevented by a bounded parser that checks decoded property names. Its maximum nesting depth is 12.

A reviewer can load the synthetic fixture, alter it and rerun. Editing the input clears the previous result and disables its download. Async file and fixture reads use an epoch so an older result cannot replace a newer edit. Clear removes the review input and result. Uploaded content stays in the page; only loading the public fixture makes a network request. Exported decision records contain aggregates, source type, calculation method and the explicit boundary against rollout approval, with no session or event IDs.

```sh
node --test tests/measurement-review.test.cjs
python projects/measurement-lab/verify_review.py
```

## Portable numeric and calendar contract

JSON numbers with the same integer value (`1`, `1.0`, `1e0`) are equivalent for schema version and sequence. Booleans, numeric strings and fractional values are rejected. Timestamps must use canonical UTC milliseconds, Gregorian years 0001–9999, and a real calendar date. Year 0000 is rejected in both implementations. These choices avoid a browser accepting a file that the independent SQL handoff rejects solely because its parser represents a number differently.

See [contract-review.md](contract-review.md) for the reproduced defects, alternatives, decision and release checks. Existing canonical demo exports are unchanged; no measured outcome or denominator is restated by this correction.
