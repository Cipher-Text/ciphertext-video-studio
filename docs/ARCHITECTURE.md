# Architecture and repository audit

## Baseline audit (2026-11-07)

The repository initially contained only Git metadata: no commits, package manifest, application source, Remotion configuration, compositions, scene schema, Azure Speech code, render scripts, assets, tests, or environment configuration. There was no existing working functionality or video project to migrate. Node.js v25.9.0, npm 11.12.1, and pnpm 12.3.4 are installed in the development environment.

## Current foundation

- Vite + React + strict TypeScript provide a small local dashboard without introducing a large framework.
- `src/domain.ts` owns the six brand definitions and versioned Zod storyboard shape. `makeStoryboard()` is deterministic and leaves source citations empty rather than manufacturing them.
- `src/web/` is the browser project and scene editor. It reads and writes projects through the local API and retains JSON import/export. Script and per-scene approvals are explicit; editing a scene or generating its narration clears that scene's approval. The UI reports connection, saving, saved, and failed states; explains render readiness; announces notifications to assistive technology; and exposes keyboard focus. `ProjectPreview` uses Remotion Player with a synchronized scene timeline. The media library previews and reuses local images/videos and edits per-asset credit/license metadata. Local MP4, MOV, and WebM uploads store trim and framing settings on the scene.
- `src/server/index.mjs` provides the loopback Node API and SQLite repository. Configured loopback Origin checks, bounded JSON bodies, and strict Zod validation protect project writes; validation errors include field paths. Render-job creation requires an approved storyboard and approved scenes. Migrations 001–003 add projects, render jobs, and local media credit/license metadata; media deletion is blocked while projects reference an asset. `CIPHERTEXT_DATA_DIR` relocates the database.
- `src/server/render-worker.mjs` processes one render at a time, records progress and attempts, supports cancellation, writes a unique file for each attempt, and parses MP4 stream metadata before marking a job successful. `renderJobs.mjs` centralizes retry and startup recovery transitions; interrupted renders requeue on worker restart unless cancellation was requested.
- `src/server/azureSpeech.mjs` and `src/server/elevenLabsSpeech.mjs` implement Bengali speech providers. Scene audio is cached in ignored `public/generated-audio/` as WAV or MP3; measured duration influences preview and export timing.
- `src/video/` contains shared preview/render metadata, typed scene visual treatments, the reusable Remotion timeline, illustrative `CipherTextDemo`, and project-specific `CipherTextProject` composition. Uploaded video scenes render with saved trim and framing in preview and export. Data charts animate validated values and labels with units, periods, and citations. History scenes sequence dated event cards with optional local images, citations, and reconstruction labels. Software demos use attached screenshots or recordings with timed, positioned callouts. Generated narration receives phrase-level captions paced over measured audio duration; phrase timing is estimated rather than word-aligned. The map treatment remains schematic.
- `tests/` and `e2e/` cover domain and schema validation, API security, speech adapters, scene registry, video metadata, project import errors, approval behavior, render gating, and mobile layout. Playwright starts the API and Vite separately on isolated ports and uses a temporary SQLite database; tests run serially because they share that database.

## Reuse and replacement

The original application foundation remains in place; this work extends its local server and Remotion pipeline without replacing its schema or database. Project JSON import/export remains supported, while SQLite is the project source of truth.

## Migration strategy

1. Foundation (complete): brand registry, manual project creation, storyboard schema/editor, JSON portability, illustrative Remotion demo.
2. Durable local data (complete): SQLite project repository and additive render-job migration.
3. Preview/render path (implemented): shared aspect and duration metadata, persistent worker jobs, progress/cancel/retry paths, unique output versions, MP4 verification.
4. Scene treatments (implemented): typed visual treatments with local assets, camera options, transitions, sourced chart/history data, software callouts, and visible placeholder labeling.
5. Bengali speech (implemented): Azure and ElevenLabs speech preview, per-scene caching, measured audio duration, and phrase-level timed captions.
6. Current product follow-ups: see [ROADMAP.md](ROADMAP.md) for media library management, caption alignment/editing, and richer visual tools. Engineering follow-ups include browser validation of recent video/chart/history/software/caption work, broader accessibility review, and live worker retry/recovery validation.

## Technical risks

- SQLite data remains local to the machine and is not a backup. Export project JSON for portability and backup.
- Scene visuals remain stylized; health diagrams, headlines, document highlights, maps, and timeline graphics need reviewed sources or local assets before production. Data charts use entered values and display the supplied citation.
- Local image upload (PNG, JPEG, WebP) and video upload (MP4, MOV, WebM) with per-scene trim/framing are implemented. Licensing metadata, richer media management, word-level subtitle alignment, audio mixing/ducking, and render packaging remain future work. Live retry and worker restart recovery still need end-to-end validation.
- Long or numerous scripts may exceed the fixed 15-second demo composition duration; production timing must derive from narration and configured padding.
- Typography currently uses system fallbacks to keep the dashboard offline-capable.

## Local data and security

Project data remains local in SQLite and render output is directed to ignored `out/`. Azure and ElevenLabs calls occur only after the user requests preview, connection testing, or scene synthesis; secrets stay on the server in `.env` or process environment. `.env.example` contains empty placeholders only.

## Remotion guidance

The composition uses `useCurrentFrame()`, `interpolate()`, `Sequence`, and `AbsoluteFill`; animation is deterministic and side-effect free. The demo command and the project render worker both invoke the Remotion CLI locally.
