# Free local AI lab

Runtime: WebLLM 0.2.86 from version-pinned jsDelivr. Model: Qwen2.5-1.5B-Instruct-q4f16_1-MLC from the upstream MLC model catalog. GPU requirement in that catalog is 1629.75 MB; UI recommends 2 GB available. Download is approximately 1 GB. Actual memory and transfer vary. No billing service is used. Browser storage, bandwidth and electricity are still used.

The model selects JSON actions, real shared tools run, and results are fed back into subsequent model turns. This is a bounded agent loop, not native function-call support or a deterministic routing script labelled AI. Actions: evidence search/read, population comparison, synthetic event audit. Maximum five model turns; 500 tokens per turn; 800-character question. Evidence IDs must have been retrieved; this verifies provenance, not semantic accuracy. A small model may still reason incorrectly or fail to finish. Failed outputs are not replaced with canned AI answers.

Questions are not sent to a hosted inference provider. Initial model/runtime downloads contact jsDelivr, Hugging Face and the upstream MLC model-library host, which receive ordinary request metadata. Optional caching is controlled by WebLLM/browser. Stop terminates the worker and releases its GPU resources; downloaded cache may persist. No custom CSV is sent to the model.

Compatibility: secure context, WebGPU and sufficient memory. Devices without shader-f16 use the upstream q4f32_1 variant (catalog estimate 1888.97 MB). The page checks required GPU features before downloading. Setup times out at ten minutes and inference at three minutes. The portfolio and deterministic workbench remain usable without the model.

Validation: Node contract tests cover real tool execution, citation provenance, unknown actions, cancellation, malformed output and bounded looping. Model responses in those tests are injected fixtures, not live inference. Actual model quality requires compatible-hardware testing and is not established by passing contract tests.

Primary references: https://webllm.mlc.ai/docs/user/basic_usage.html and https://webllm.mlc.ai/docs/user/advanced_usage.html .

Live release check: Vercel deployment succeeded. Prompt buttons and no-download initial state were verified in the live UI. The cloud test browser returned no usable WebGPU adapter; real-model inference could not be validated in that environment. This is an experimental feature, not a verified cross-device AI release.
