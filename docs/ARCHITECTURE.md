# Architecture and repository audit

## Baseline audit (2026-11-07)

The repository initially contained only Git metadata: no commits, package manifest, application source, Remotion configuration, compositions, scene schema, Azure Speech code, render scripts, assets, tests, or environment configuration. There was no existing working functionality or video project to migrate. Node.js v25.9.0, npm 11.12.1, and pnpm 12.3.4 are installed in the development environment.

## Current foundation

- Vite + React + strict TypeScript provide a small local dashboard without introducing a large framework.
- `src/domain.ts` owns the six brand definitions and versioned Zod storyboard shape. `makeStoryboard()` is deterministic and leaves source citations empty rather than manufacturing them.
- `src/web/` is the browser project and scene editor. It reads and writes projects through the local API and retains JSON import/export. Script and per-scene approvals are explicit; `ProjectPreview` uses Remotion Player to play the current storyboard.
- `src/server/index.mjs` provides the loopback Node API and SQLite repository. `migrations/001_projects.sql` creates the project table; the default database is `data/ciphertext.sqlite` and `CIPHERTEXT_DATA_DIR` can relocate it.
- `src/video/` contains the reusable Remotion `MasterDocumentary`, illustrative `CipherTextDemo`, and `CipherTextProject` composition. The latter validates serialized storyboard props and calculates duration and dimensions from scene timings and project format.
- `tests/` contains foundation tests for profiles and storyboard validation.

## Reuse and replacement

There was nothing to reuse from the application baseline. The foundation deliberately avoids bringing in Next.js, SQLite, ORM, AI SDKs, Azure SDKs, or an asset service before they are needed. Browser local storage is a temporary persistence choice, not an intended multi-project database architecture. The composition accepts serializable props and can later be called by a local Remotion render worker.

## Migration strategy

1. Foundation (current): brand registry, manual project creation, storyboard schema/editor, JSON portability, illustrative Remotion demo.
2. Durable local data (complete): SQLite migration and repository API, with project state moved out of browser local storage.
3. Project render path (initial implementation): saved storyboard props, dynamic composition duration/format, synchronous local MP4 render and download. Queue/worker, cancellation/progress, output validation, thumbnails, and export package remain.
4. Production storyboard: script versioning/approval history, claim and source records, optional AIProvider with mock and local-compatible implementations.
5. Media and voice: safe local asset library, TTS capability model and Azure Speech adapter, generated audio metadata, subtitles.
6. Quality: six illustrative demo projects, accessibility and deeper render-output verification.

## Technical risks

- SQLite data remains local to the machine and is not a backup. Export project JSON for portability and backup.
- The initial Remotion composition is an abstract visual treatment. It is not a full scene registry or asset-aware editor, and the demo is explicitly illustrative. Its caption band displays script text over music; it does not yet include spoken narration.
- Uploaded media, TTS, caption alignment, and a durable render queue/worker do not exist yet. Project rendering currently runs synchronously in the local API process.
- Long or numerous scripts may exceed the fixed 15-second demo composition duration; production timing must derive from narration and configured padding.
- Typography currently uses system fallbacks to keep the dashboard offline-capable.

## Local data and security

There are no external API calls or credentials in this foundation. Project JSON is stored in local SQLite. Generated render output is directed to the ignored `out/` path. `.env.example` lists future optional provider variables and contains no secrets.

## Remotion guidance

The project follows the installed Remotion create, best-practices, and render skills. The composition uses `useCurrentFrame()`, `interpolate()`, `spring()`, `Sequence`, and `AbsoluteFill`; animation is deterministic and side-effect free. Current official Remotion guidance recommends frame-based timing and `renderMedia()` for programmatic server rendering; the current demo uses Remotion CLI for local rendering.
