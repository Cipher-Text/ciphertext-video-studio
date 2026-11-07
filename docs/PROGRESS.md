# Implementation progress

Historical implementation and verification snapshot from 2026-11-07, based on main commit `12c380c`. It is not a complete inventory of capabilities added afterward. Existing SQLite project rows and migrations remain in place; this work adds migration `002_render_jobs.sql`.

## Completed in this pass

- Restricted API CORS responses to configured loopback origins. State-changing requests require an allowed `Origin`; the default list covers the Vite development and Playwright ports.
- Validated project IDs and decoded route parameters, rejected encoded slash/backslash/NUL paths, and constrained resolved render downloads to `out/`.
- Added a 2 MiB JSON body limit, structured safe API errors, and strict Zod project/storyboard validation before inserts and updates. Validation includes unique scene IDs, scene ordering, title/language agreement, duration consistency, asset path containment, bounds, and nested media fields.
- Matched Remotion Player dimensions and frame duration to project format and scene durations through shared metadata helpers. Landscape (1920×1080), portrait (1080×1920), and square (1080×1080) are covered by tests.
- Made camera movement duration-aware and added configurable camera movement/intensity and cut/fade/wipe transitions to the scene editor.
- Added a typed registry with nine distinct treatments: cinematic image, parallax, historical map, data chart, news headline, evidence timeline, medical explainer, software demo, and document highlight. Placeholder content is labeled; map visuals state that they are schematic and are not historical reconstructions. Local image paths are constrained to `public/assets/`.
- Added persistent SQLite render jobs, a separate single-concurrency worker, progress reporting, cancellation, automatic and manual retries, and unique output paths per attempt. The worker checks the output file and parses MP4 container/stream metadata before marking success. Previous project render paths are preserved.
- Added an interchangeable speech-provider contract with Azure Speech, two `bn-BD` voices, on-demand voice preview, per-text/voice audio caching, WAV duration detection, scene audio status, and duration synchronization. ElevenLabs support was added after this verification snapshot; see the README for current provider setup.
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

## Current import and approval contract

- Project JSON uses `landscape`, `portrait`, or `square` for `format`. Scene `animation` accepts `zoom-in`, `pan-left`, `fade`, or `rise`; `camera.movement` has its own set and additionally accepts `zoom-out`, `pan-right`, and `none`.
- Import validation reports field paths for schema errors. Render jobs require project status `Storyboard approved` and every scene to be approved.
- Editing scene content or settings returns that scene to draft approval; it must be approved again before the storyboard can be rendered.
- The dashboard now explains render readiness, announces notifications to assistive technology, shows keyboard focus clearly, and resets the JSON file picker after selection so the same file can be retried.
- These current import, approval, and UX changes were not included in the 2026-11-07 snapshot; their latest verification is recorded below.
- The workspace save indicator now distinguishes connecting, saving, saved, unavailable, and failed writes. Failed project creation and updates expose the failure to the user.
- Render worker retry and interrupted-job recovery transitions are centralized in `src/server/renderJobs.mjs`; interrupted jobs requeue at startup unless cancellation was pending. Deterministic unit fixtures cover retry exhaustion and both recovery outcomes.
- The preview now includes a proportional scene timeline synchronized to Remotion playback, with click-to-seek scene blocks, a live playhead, active-scene narration, duration labels, transition markers, and output format dimensions. Scene content and timing remain editable from the existing cards.
- Scene media now supports local MP4, MOV, and WebM upload (100 MiB limit), persisted trim in/out points, fill/fit framing, and horizontal/vertical object position. Remotion uses the attached clip and saved framing for both preview and project export. Browser interaction and actual encoded video rendering still need verification with a sample clip.
- Data-chart scenes now accept 2–12 labeled nonnegative values, bar or line styles, units, periods/date ranges, and source citations. Values and marks animate into view; unit, period, and citation appear in the rendered scene. The editor supports adding and removing points, and approval/rendering are blocked until the chart has two labeled values and a source.
- History timeline scenes now support 2–8 dated events, titles, descriptions, per-event citations, optional local images, and an explicit illustrative-reconstruction flag. Event cards enter in sequence during playback; citations and reconstruction/source-media labels remain visible. Scene and storyboard approval plus server render creation require dates, titles, and citations for every event.
- Software-demo scenes now use attached screenshots or screen recordings as the scene background and support up to eight timed callouts. Each callout animates a target marker, connector, and label at editable positions; all data is stored in the project and used by both preview and export. The unprovided interface remains clearly labeled illustrative.
- Generated narration is split into short caption phrases and paced proportionally by word count across the measured audio duration. The active phrase follows playback in preview and render; this estimates phrase timing and does not claim word-level alignment.
- The media library now previews local images/videos, reuses or replaces media in a selected scene, stores per-asset credit/license metadata in SQLite, and shows how many scene references use each asset. Deletion is allowed only after every scene reference is removed or replaced.

## Latest verification (2026-11-08)

- `pnpm typecheck` — passed.
- `pnpm test` — passed (15 tests across 6 files), including deterministic retry and interrupted-worker recovery cases.
- `pnpm test:e2e` — passed (7 browser/API flows), covering project creation and scene-approval reset, field-level import feedback, save failure feedback, render approval enforcement, API security and render-job workflows, and a 390px mobile viewport without horizontal overflow.
- Reviewed the dashboard at desktop size. The mobile layout was checked in the browser suite at 390×844.
- `git diff --check` — passed.
- The e2e setup now starts API and Vite separately on ports 4384 and 4383, uses a temporary SQLite directory, and runs serially to avoid shared-database test interference. The older 2026-11-07 command list and render evidence remain historical.
- The latest timeline implementation passed `pnpm typecheck`; browser-level interaction verification remains pending.
- The video media integration also passed `pnpm typecheck`; video upload and a rendered output have not yet been exercised end to end.
- Data-chart editor and Remotion integration passed `pnpm typecheck`; end-to-end chart editing and rendered output remain to be checked in a browser.
- History timeline editor, schema, preview, and render gating passed `pnpm typecheck`; end-to-end editor and rendered output remain to be checked in a browser.
- Software callout editor, schema, preview, and project-export wiring passed `pnpm typecheck`; browser interaction and a rendered callout scene remain pending.
- Phrase caption generation and Remotion integration passed `pnpm typecheck`; playback and exported caption timing remain to be checked in a browser/render.
- Media library UI, metadata migration/API, reuse flow, and safe deletion checks passed `pnpm typecheck` and server syntax checks; browser interaction remains pending.

## Pending work

1. Add CSV chart import with validation and source metadata.
2. Verify local video upload, trim/framing, preview, and rendered output using a sample clip.
3. Verify chart, history-timeline, software-demo, caption, and media-library interactions in a browser, including incomplete-data approval/render gates.
4. Review accessibility across the editor, timeline, chart, history, caption, and media controls.
5. Validate render-worker recovery after restart, retry after a real renderer failure, and cancellation during active encoding.
6. Continue roadmap follow-ups: screenshot/crop tools, richer software highlights, word-level caption alignment, manual caption editing, and fuller media credit/license display in exports.
