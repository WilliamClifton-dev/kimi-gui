# ADR-0004: Support provider profiles instead of a single hard-coded Kimi key

## Status
Accepted

## Date
2026-07-08

## Context
The product is positioned as a beginner-first Kimi coding workspace, but users may want to point the app at compatible providers such as OpenAI or DeepSeek while keeping the same visual workflow.

Official Kimi provider documentation shows that the Kimi CLI/runtime supports multiple provider types, including `kimi`, `openai_legacy`, `openai_responses`, `anthropic`, `gemini`, and `vertexai`.

Source:
- https://moonshotai.github.io/kimi-cli/en/configuration/providers.html

The same Kimi provider documentation also states that some capabilities, including `SearchWeb` and `FetchURL`, are currently only provided by the Kimi Code platform. That means compatibility does not imply full feature parity.

Source:
- https://moonshotai.github.io/kimi-cli/en/configuration/providers.html

DeepSeek official documentation states that its API is compatible with OpenAI-style usage and uses a documented base URL.

Source:
- https://api-docs.deepseek.com/

## Decision
We will represent runtime setup as a **provider profile**, not just an API key.

A provider profile includes:
- provider type
- base URL
- API key
- default model
- capability mode

The UI will distinguish between:
- **Kimi mode**: Kimi-native path, intended to support the fullest product experience
- **Compatible mode**: OpenAI, DeepSeek, and similar providers, where some advanced features may be limited

## Consequences
- Settings storage and validation must include provider metadata
- The UI should explain capability differences in plain language
- Runtime adapter work later can map provider profiles to actual runtime-specific configuration
- We should not promise full Kimi-native capabilities for compatible providers unless verified
