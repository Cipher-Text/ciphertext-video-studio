# Implementation progress

Reviewed against main commit `12c380c` on 2026-11-07. Existing SQLite project rows and migrations remain in place; this work adds migration `002_render_jobs.sql`.

## Completed in this pass

- Restricted API CORS responses to configured loopback origins. State-changing requests require an allowed `Origin`; the default list covers the Vite development and Playwright ports.
- Validated project IDs and decoded route parameters, rejected encoded slash/backslash/NUL paths, and constrained resolved render downloads to `out/`.
- Added a 2 MiB JSON body limit, structured safe API errors, and strict Zod project/storyboard validation before inserts and updates. Validation includes unique scene IDs, scene ordering, title/language agreement, duration consistency, asset path containment, bounds, and nested media fields.
- Matched Remotion Player dimensions and frame duration to project format and scene durations through shared metadata helpers. Landscape (1920×1080), portrait (1080×1920), and square (1080×1080) are covered by tests.
- Made camera movement duration-aware and added configurable camera movement/intensity and cut/fade/wipe transitions to the scene editor.
- Added a typed registry with nine distinct treatments: cinematic image, parallax, historical map, data chart, news headline, evidence timeline, medical explainer, software demo, and document highlight. Placeholder content is labeled; map visuals state that they are schematic and are not historical reconstructions. Local image paths are constrained to `public/assets/`.
- Added persistent SQLite render jobs, a separate single-concurrency worker, progress reporting, cancellation, automatic and manual retries, and unique output paths per attempt. The worker checks the output file and parses MP4 container/stream metadata before marking success. Previous project render paths are preserved.
- Added an interchangeable speech-provider contract with Azure Speech, two `bn-BD` voices, on-demand voice preview, per-text/voice audio caching, WAV duration detection, scene audio status, and duration synchronization.
- Added local PNG, JPEG, and WebP uploads with a 15 MiB limit, a reusable image library, per-scene attachment, and actual image display in the scene preview and render.
- Added API security, aspect-ratio, speech adapter, scene-registry, and browser/API lifecycle regression tests.

## Not complete

- Asset licensing/credit metadata, image deletion/replacement management, thumbnails, and broader media-library management.
- Word-level subtitle alignment, audio mixing/music ducking, additional TTS adapters, and non-Bengali Azure voice selection.
- Render worker retry/failure branches have implementation coverage in code but were not forced through an actual failing Remotion process in this pass. The queued cancellation path and successful render path were exercised.
- A visual export package, thumbnails, six sample projects, and broader accessibility review.

## Verification executed

- `pnpm typecheck` — passed.
- `pnpm test` — passed (13 tests across 5 files).
- `pnpm test:e2e` — passed (3 browser/API flows), including cross-origin rejection (without an `Access-Control-Allow-Origin` header), missing Origin rejection, malformed IDs, encoded traversal, project workflow, and persistent render-job cancellation/history.
- `pnpm build` — passed for Vite and Remotion. Rollup emitted upstream Zod annotation and large-chunk warnings; the build completed.
- `node --check src/server/index.mjs && node --check src/server/render-worker.mjs && node --check src/server/validation.mjs && node --check src/server/security.mjs && node --check src/server/azureSpeech.mjs` — passed.
- Azure Speech live call — generated `bn-BD-NabanitaNeural` narration, returned a PCM WAV, detected 4.55 seconds from its WAV metadata, and a repeat request hit the scene audio cache. The `bn-BD-PradeepNeural` voice preview endpoint also returned a valid 24 kHz, mono, 16-bit PCM WAV.
- Final Bengali project render — persistent job `89ce7558-e5da-4a88-8804-4410eab987af` succeeded on attempt 1 with progress samples 15%, 54%, 93%, then 100%. The worker validated H.264 video at 1080×1920 and AAC audio, 4.587 seconds, 729,239 bytes. `ffprobe` is not installed; stream metadata was read from the MP4 container by the worker.
- `file out/bn-project-2026/renders/89ce7558-e5da-4a88-8804-4410eab987af-attempt-1.mp4 /tmp/ciphertext-bn-final.mp4` — both the stored render and API download were recognized as ISO Base Media MP4 containers. Download size was 729,239 bytes.

The live Azure request required no secrets in browser storage. The generated WAV cache is ignored at `public/generated-audio/`; the MP4 is under ignored `out/`.

## Exact verification commands

```sh
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
node --check src/server/index.mjs && node --check src/server/render-worker.mjs && node --check src/server/validation.mjs && node --check src/server/security.mjs && node --check src/server/azureSpeech.mjs
CIPHERTEXT_DATA_DIR=/tmp/ciphertext-review-jobs pnpm dev --host 127.0.0.1 --port 4173
curl -sS -X POST http://127.0.0.1:4174/api/projects/bn-project-2026/scenes/bn-scene-1/audio -H 'Origin: http://127.0.0.1:4173' -H 'content-type: application/json' --data '{"voice":"bn-BD-NabanitaNeural"}'
curl -sS -X POST http://127.0.0.1:4174/api/projects/bn-project-2026/render -H 'Origin: http://127.0.0.1:4173' -H 'content-type: application/json' --data '{}'
node --input-type=module -e 'const id="89ce7558-e5da-4a88-8804-4410eab987af";for(let i=0;i<300;i++){const res=await fetch(`http://127.0.0.1:4174/api/render-jobs/${id}`,{headers:{Origin:"http://127.0.0.1:4173"}});const job=await res.json();console.log(job.status,job.progress,job.attempt,job.errorMessage||"");if(["succeeded","failed","cancelled"].includes(job.status)){console.log(JSON.stringify(job));process.exit(job.status==="succeeded"?0:1)}await new Promise(r=>setTimeout(r,1000))}'
curl -sS -o /tmp/ciphertext-bn-final.mp4 -H 'Origin: http://127.0.0.1:4173' http://127.0.0.1:4174/api/renders/89ce7558-e5da-4a88-8804-4410eab987af
file out/bn-project-2026/renders/89ce7558-e5da-4a88-8804-4410eab987af-attempt-1.mp4 /tmp/ciphertext-bn-final.mp4
```

The Bengali project fixture (`bn-project-2026`) was created in the same isolated database with one `historical-map` schematic scene and Bangla narration. The corresponding saved MP4 and job ID above identify the final verified render. Azure credentials remain in the local `.env` and are not recorded here.

## Runtime and remaining verification notes

- Node.js 22.13 or newer is required for built-in `node:sqlite`.
- Retry behavior after a real renderer failure, interrupted-worker recovery, and cancellation during active frame encoding remain unverified end-to-end.
- The preview/render dimension contract is unit-tested for all three formats; the live MP4 was rendered in portrait format.
- Scene registry mapping and production bundling passed; each of the nine scene types was not separately rendered to a standalone MP4 in this pass.

## Next implementation task

Build the local asset library and extend narration/subtitle timing beyond scene-level audio durations, then test worker retry and interrupted-render recovery with deterministic failure fixtures.
