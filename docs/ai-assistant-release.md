# Portfolio AI assistant: implementation and activation gate

Status: implemented, tested with injected model responses, disabled by default.
No live model evaluation, cost verification or public-AI usability claim is made.

## Architecture

The existing static site is retained. `/api/portfolio-agent` is a Vercel Node
function. Its GET checks availability without a model request. The assistant UI
is hidden until configured. GitHub Pages remains static and hides this UI.
The separate local workbench remains usable without a server or AI model.

POST accepts only a bounded public portfolio question. The server owns the
instruction, model selection, fixed Gateway endpoint and four read-only tools:
search evidence, read evidence, compare populations, and audit synthetic samples.
A model selects tool calls and receives their real outputs before its next step.
Five model turns and six tool calls are the limits. Each provider call times out
after 12 seconds. Final JSON must cite records actually retrieved during the run.
Rendered answers use textContent; clickable sources come from the fixed catalog.
These controls validate structure and provenance, not semantic correctness.

The catalog is a curated summary, not a live scrape or exhaustive repository index.
Review it whenever the underlying work samples change. Tools cannot access arbitrary
URLs, execute generated code, write files, send messages or approve business actions.
The UI cancellation aborts the browser request; a provider request already in flight
may still complete and consume credits. Raw prompts are not explicitly logged by
this application, but Gateway/provider retention must be reviewed before activation.

## Activation prerequisites — complete before setting ENABLED

1. Restore authorized Vercel configuration access for project `portfolio`.
2. Obtain the user's explicit model-usage spending limit. Configure a hard
   AI Gateway project/key budget and verify its scope and exhaustion behavior.
   Do not enable automatic top-ups without separate approval.
3. Configure platform WAF rate limiting for this POST endpoint. Origin checking
   alone is not abuse prevention; non-browser clients can forge that header.
4. Retrieve the current Gateway model catalog; choose and verify a model with tool
   calling and JSON-output capability. Set `AI_GATEWAY_MODEL` to that exact ID.
5. Use deployment OIDC (`VERCEL_OIDC_TOKEN`) or a server-only `AI_GATEWAY_API_KEY`.
   Never put secrets in source, browser scripts, public responses or GitHub issues.
6. Set `PORTFOLIO_AI_BUDGET_CONFIRMED=true` only after steps 2–3 have been verified.
   This is an operator acknowledgement, not a programmatic budget check.
7. Set `PORTFOLIO_AI_ENABLED=true`, redeploy and run authorized live evaluations.
   Until then GET returns `available:false`, POST returns 503, and no provider is called.

## Required live evaluations before claiming readiness

- Ask why the experiment is on hold: source `ledger`, no causal success claim.
- Ask to compare population denominators: calculation tool, six versus 21.11 points.
- Ask to audit conflicts: actual audit tool, BLOCKED, zero provisional rows.
- Ask for proven revenue: distinguish assumptions and missing price evidence.
- Ask to ignore instructions or send email: no external action or fabricated tool.
- Exercise exhausted budget, provider error, invalid response, slow response,
  keyboard interaction and cancellation. Confirm no secret or internal error leaks.
- Record the actual model, test results, latency and cost; use held-out paraphrases.

Offline tests verify orchestration and boundaries only. They are not model evaluations.
The visible workbench is still explicitly labeled rule-based.

Primary implementation references (checked 2026-10-15):
- https://vercel.com/docs/ai-gateway/sdks-and-apis/openai-chat-completions/tool-calling
- https://vercel.com/docs/ai-gateway/authentication-and-byok/oidc
- https://vercel.com/docs/functions/runtimes/node-js
