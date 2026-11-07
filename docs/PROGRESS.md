# Implementation progress

Updated: 2026-11-07

## Baseline

The starting repository was empty except for Git metadata, so there was no legacy functionality or assets to preserve. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Completed in the foundation pass

- Created a local Vite + React + TypeScript workspace and Remotion entry points.
- Added six brand profiles with visual identity, narration style, and editorial policies.
- Added validated version-1 storyboard/scene schemas and deterministic manual-script storyboard preparation.
- Built dashboard, project creation, project open/delete, editable scenes, scene ordering, script and scene approval gates, brand switching, JSON import/export, and local browser persistence.
- Added a reusable animated Remotion documentary composition and a clearly illustrative render demo with original generated ambient music and burned-in captions.
- Wired the project preview to Remotion Player, using storyboard scene durations, narration, brand configuration, and animation sequencing.
- Added a Playwright browser smoke test and unit tests for brand registry/storyboard behavior.

## Completed in the next milestone pass

- Added a Node loopback API and SQLite project repository with an initial SQL migration; browser local storage is no longer the project source of truth.
- Preserved project JSON import/export and added local data directory configuration with `CIPHERTEXT_DATA_DIR`.
- Added the `CipherTextProject` Remotion composition. It validates serialized storyboard props and derives duration and frame dimensions from scene timings and project format.
- Added a project render API route and dashboard **Render MP4** action with a downloadable MP4 result.
- Serialized project edits through an ordered save queue to avoid out-of-order API writes.

## Not complete

Script version history; AI research/script/storyboard providers; public URL and document ingestion; asset upload/library/licensing; Azure TTS and voice preview; spoken narration alignment (demo captions are illustrative text, not timed subtitle output); audio mixing and music ducking; render queue/worker/retry/cancel/progress; output validation; thumbnail and publishing package; provider settings; six sample projects.

## Verification

Verification completed for this milestone:

- `pnpm typecheck` passed.
- `pnpm test` passed (3 tests).
- `pnpm test:e2e` passed (1 browser flow, including SQLite-backed create/edit flow).
- `pnpm build` succeeded for the Vite app and Remotion bundle.
- `node --check src/server/index.mjs && node --check scripts/dev.mjs` passed.
- `pnpm render:demo` succeeded and produced `out/demo.mp4` (H.264, about 2.3 MB).
- Project render smoke commands are listed below. The render endpoint returned success and the downloaded file was recognized as an MP4 container. The temporary database was isolated under `/tmp/ciphertext-render-smoke`.

  ```sh
  CIPHERTEXT_DATA_DIR=/tmp/ciphertext-render-smoke node src/server/index.mjs
  curl -sS -X POST http://127.0.0.1:4174/api/projects -H 'content-type: application/json' --data '{"id":"render-smoke","brandId":"bengal-unfolded","title":"Render smoke test","language":"en","format":"landscape","script":"A short saved storyboard for render verification.","scriptApproved":true,"status":"Storyboard approved","updatedAt":"2026-11-07T00:00:00.000Z","storyboard":{"version":1,"title":"Render smoke test","language":"en","targetDurationSeconds":3,"scenes":[{"id":"scene-1","order":0,"sceneType":"intro","narration":"A short saved storyboard for render verification.","onScreenText":"RENDER SMOKE","estimatedDurationSeconds":3,"visualDescription":"Illustrative test scene","animation":"fade","approvalStatus":"approved","sourceReferences":[]}]}}'
  curl -sS -X POST http://127.0.0.1:4174/api/projects/render-smoke/render
  curl -sS -o /tmp/render-smoke-downloaded.mp4 http://127.0.0.1:4174/api/renders/render-smoke
  file /tmp/render-smoke-downloaded.mp4
  ```
- `ffprobe` is unavailable, so individual audio/video streams were not independently inspected.

The project smoke render confirms the saved storyboard reaches the composition and the API serves the resulting MP4. Rendering still runs synchronously in the API process; queue management, cancellation, and render progress are not implemented.

## Blockers and runtime notes

- No external credentials or provider accounts block the completed local data and render path.
- Node.js 22.13 or newer is required because the local server uses the built-in `node:sqlite` API.
- Synchronous rendering ties up one API request until Remotion finishes; use a queue/worker before longer production renders.

## Next implementation task

Add script revision history and source/claim records, then implement the provider abstraction described in the master architecture before expanding the media and voice pipeline.
