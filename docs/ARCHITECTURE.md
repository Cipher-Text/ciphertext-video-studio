# Architecture and repository audit

## Baseline audit (2026-11-07)

The repository initially contained only Git metadata: no commits, package manifest, application source, Remotion configuration, compositions, scene schema, Azure Speech code, render scripts, assets, tests, or environment configuration. There was no existing working functionality or video project to migrate. Node.js v25.9.0, npm 11.12.1, and pnpm 12.3.4 are installed in the development environment.

## Current foundation

- Vite + React + strict TypeScript provide a small local dashboard without introducing a large framework.
- `src/domain.ts` owns the six brand definitions and versioned Zod storyboard shape. `makeStoryboard()` is deterministic and leaves source citations empty rather than manufacturing them.
- `src/web/` is the browser project and scene editor. It reads and writes projects through the local API and retains JSON import/export. Script and per-scene approvals are explicit; `ProjectPreview` uses Remotion Player to play the current storyboard.
- `src/server/index.mjs` provides the loopback Node API and SQLite repository. Configured loopback Origin checks, bounded JSON bodies, and strict Zod validation protect project writes. Migrations 001 and 002 add project and render-job tables; `CIPHERTEXT_DATA_DIR` relocates the database.
- `src/server/render-worker.mjs` processes one render at a time, records progress and attempts, supports cancellation, writes a unique file for each attempt, and parses MP4 stream metadata before marking a job successful.
- `src/server/azureSpeech.mjs` implements the speech-provider interface for Azure's `bn-BD` neural voices. Scene WAV files are cached in ignored `public/generated-audio/`; duration is detected from WAV metadata and influences preview and export timing.
- `src/video/` contains shared preview/render metadata, nine typed scene visual treatments, the reusable Remotion timeline, illustrative `CipherTextDemo`, and project-specific `CipherTextProject` composition. Placeholder scenes carry visible disclaimers; historical map visuals are explicitly schematic.
- `tests/` contains foundation tests for profiles and storyboard validation.

## Reuse and replacement

The original application foundation remains in place; this work extends its local server and Remotion pipeline without replacing its schema or database. Project JSON import/export remains supported, while SQLite is the project source of truth.

## Migration strategy

1. Foundation (complete): brand registry, manual project creation, storyboard schema/editor, JSON portability, illustrative Remotion demo.
2. Durable local data (complete): SQLite project repository and additive render-job migration.
3. Preview/render path (implemented): shared aspect and duration metadata, persistent worker jobs, progress/cancel/retry paths, unique output versions, MP4 verification.
4. Scene treatments (implemented): nine typed illustrative components with local asset paths, camera options, transitions, and visible placeholder labeling.
5. Bengali speech (implemented): Azure `bn-BD` speech preview, per-scene caching, and actual audio duration; more providers and timed subtitles remain.
6. Next quality work: deterministic retry/recovery failure tests, asset licensing metadata and deletion management, thumbnails, export package, sample projects, and accessibility review.

## Technical risks

- SQLite data remains local to the machine and is not a backup. Export project JSON for portability and backup.
- Scene visuals remain stylized; data charts, health diagrams, headlines, document highlights, and timeline graphics are labeled illustrative placeholders until reviewed sources or local assets are attached.
- Local image upload and per-scene attachment are implemented for PNG, JPEG, and WebP. Licensing metadata, deletion management, video uploads, word-level subtitle alignment, audio mixing/ducking, and render packaging remain future work. Retry after a real render failure and worker restart recovery still need deterministic end-to-end coverage.
- Long or numerous scripts may exceed the fixed 15-second demo composition duration; production timing must derive from narration and configured padding.
- Typography currently uses system fallbacks to keep the dashboard offline-capable.

## Local data and security

Project data remains local in SQLite and render output is directed to ignored `out/`. Azure Speech calls occur only after the user requests preview or scene synthesis; secrets stay on the server in `.env` or process environment. `.env.example` contains empty placeholders only.

## Remotion guidance

The project follows the installed Remotion create, best-practices, and render skills. The composition uses `useCurrentFrame()`, `interpolate()`, `spring()`, `Sequence`, and `AbsoluteFill`; animation is deterministic and side-effect free. Current official Remotion guidance recommends frame-based timing and `renderMedia()` for programmatic server rendering; the current demo uses Remotion CLI for local rendering.
