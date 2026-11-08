# Implementation progress

Current verification snapshot: 2026-11-08, main branch review. Existing project and SQLite schemas remain backward-compatible; new scene fields are optional. No destructive migration or application rebuild was performed.

## Completed and reviewed

- Preserved the six-brand editor, manual storyboard workflow, SQLite project persistence, render jobs, media library, scene timeline, preview, upload, trim/framing, charts, history events, software callouts, phrase captions, and Azure/ElevenLabs speech.
- Added a provider-independent AI storyboard director at `POST /api/storyboard/director`. The UI collects audience and target duration; brand, language, script/topic, format, and available media are supplied from the active project. Input and output use strict Zod schemas. Supports a local OpenAI-compatible chat-completions endpoint or configured remote endpoint, with timeout, duration checks, and human review. Manual storyboard preparation remains available. Saved project/storyboard schema and SQLite tables are unchanged.
- Added deterministic image-layer parallax and GeoJSON map rendering (Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon). Optional schema additions validate local asset paths, layer depth/opacity, coordinate bounds, feature/vertex bounds, and required map-source text. The example boundary data is attributed to [BAMIS Bangladesh map data](https://www.bamis.gov.bd/res/public/map/).
- Added real frame-overlap fades and wipes through official `@remotion/transitions` v4.0.534, aligned with the installed Remotion version. Transition overlap is allocated across adjacent sequences so total composition frames stay at the existing project duration. Chart coordinates are now pure deterministic geometry; Remotion applies animation separately. History timeline layout adapts for portrait output.
- Fixed uploaded-media playback by serving UUID-validated assets from the API with byte-range support and proxying `/assets` through Vite. Existing upload and project schemas stay intact.
- Added regression coverage for AI request/provider behavior, output validation, GeoJSON projection and validation, chart geometry, caption phrase pacing, transition duration preservation, and browser video upload/playback URL.
- Added six editable project examples, one for each brand, under `examples/projects/`. Rendered fixtures under `examples/rendered/` include a GeoJSON map, user-data chart, history timeline, software callout scene, frame-based transition export, and a separate uploaded-video/trim/framing/ElevenLabs narration export.

## Production validation evidence

- `pnpm typecheck` — passed after the current implementation.
- `pnpm test` — passed: 24 tests across 10 files, including strict validation of all six example project JSONs.
- `pnpm test:e2e` — passed: 8 browser/API flows, including actual WebM upload, media-library presence, and browser decoder readiness through the streamed media route.
- `pnpm build` — passed for Vite and Remotion. Existing upstream Zod annotation and 500 kB chunk warnings remain.
- Live isolated render: uploaded an MP4 fixture (319,403 bytes), applied trim 0.1–1.5s and contain framing, generated Bengali narration through ElevenLabs (2.299s), then exported a 5-second H.264/AAC 1920×1080 MP4 (561,382 bytes). Worker metadata confirmed both audio and video streams. Fixture: `examples/rendered/software-demo-elevenlabs-trimmed.mp4`.
- Complete scene exports: software demo/callout 1920×1080; sourced GeoJSON map 1920×1080; sourced-user-data chart 1080×1080; history timeline 1080×1920. The render worker confirmed H.264 video streams, expected dimensions, and 6-second durations.
- Two-scene fade transition render succeeded at exactly 12 seconds, confirming frame overlap does not shorten the saved composition duration. Fixture: `examples/rendered/transitions.mp4`.
- GeoJSON example uses the BAMIS Bangladesh boundary GeoJSON published 2022-06-22; the source URL and date are stored in the scene. The displayed boundary is geographic context and does not imply a historical border for any specific period.
- Phrase captions were rendered with generated narration and regression-tested to cover the measured audio duration without gaps. Timing remains proportional by word count; no forced alignment or listening-based phrase synchronization is claimed.
- Browser playback regression uses VP8 WebM because this headless Chromium build rejects the H.264 MP4 fixture; the MP4 export itself is verified separately by its H.264/AAC stream metadata.
- Worker process recovery: killed the dedicated isolated render worker during a 60-second active render. The API restarted the worker, recovered the persisted job, and the output succeeded on attempt 2. Unit coverage also exercises retry and recovery state transitions.

## AI provider configuration

Set `STORYBOARD_LLM_LOCAL_BASE_URL` and `STORYBOARD_LLM_LOCAL_MODEL` for the local endpoint, or set `STORYBOARD_LLM_REMOTE_BASE_URL`, `STORYBOARD_LLM_REMOTE_MODEL`, and `STORYBOARD_LLM_REMOTE_API_KEY` for the remote endpoint. Base URLs are server configuration, never accepted from the browser. A configured local endpoint takes precedence. No live LLM endpoint was configured in this workspace, so provider integration was validated with deterministic mocked OpenAI-compatible responses, not a real model.

## Remaining work and limits

1. Force a real Remotion render failure/retry and test cancellation during frame encoding.
2. Manually inspect/listen to phrase captions against narration; current timing is approximate.
3. Review the six brand examples for copy, accessibility, localization, portrait safe areas, and licensing before publication. The examples are editable starters, not approved factual content; BAMIS data reuse terms also need confirmation before external publication.
4. Add CSV chart import, forced word alignment/manual caption editing, crop tooling, map viewport/label tooling, and richer software callouts when those workflows are prioritized.
5. Configure and smoke-test a local or remote LLM deployment; verify the endpoint with real provider rate limits and JSON-mode behavior.

## Commands

```sh
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
git diff --check
```
