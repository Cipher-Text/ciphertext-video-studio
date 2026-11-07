# Architecture and repository audit

## Baseline audit (2026-11-07)

The repository initially contained only Git metadata: no commits, package manifest, application source, Remotion configuration, compositions, scene schema, Azure Speech code, render scripts, assets, tests, or environment configuration. There was no existing working functionality or video project to migrate. Node.js v25.9.0, npm 11.12.1, and pnpm 12.3.4 are installed in the development environment.

## Current foundation

- Vite + React + strict TypeScript provide a small local dashboard without introducing a large framework.
- `src/domain.ts` owns the six brand definitions and versioned Zod storyboard shape. `makeStoryboard()` is deterministic and leaves source citations empty rather than manufacturing them.
- `src/web/` is the browser project and scene editor. Project drafts are persisted in browser local storage and exchanged through JSON import/export. Script and per-scene approvals are explicit; `ProjectPreview` uses Remotion Player to play the current storyboard.
- `src/video/` contains the reusable Remotion `MasterDocumentary` and an illustrative `CipherTextDemo` composition. Frame-based zoom, spring entrances, caption overlays, a generated local ambient music bed, brand colors, and deterministic sequencing are used.
- `tests/` contains foundation tests for profiles and storyboard validation.

## Reuse and replacement

There was nothing to reuse from the application baseline. The foundation deliberately avoids bringing in Next.js, SQLite, ORM, AI SDKs, Azure SDKs, or an asset service before they are needed. Browser local storage is a temporary persistence choice, not an intended multi-project database architecture. The composition accepts serializable props and can later be called by a local Remotion render worker.

## Migration strategy

1. Foundation (current): brand registry, manual project creation, storyboard schema/editor, JSON portability, illustrative Remotion demo.
2. Durable local data: SQLite migrations and repository services; move project state out of browser local storage while retaining JSON import/export.
3. Production storyboard: script versioning/approval, claim and source records, optional AIProvider with mock and local-compatible implementations.
4. Media and voice: safe local asset library, TTS capability model and Azure Speech adapter, generated audio metadata, subtitles.
5. Project rendering: registry components, calculate composition dimensions/durations from actual audio, local queue/worker, cancellation/progress/output validation, thumbnail and export package.
6. Quality: browser workflow smoke test, six illustrative demo projects, accessibility and render-output verification.

## Technical risks

- Browser-local storage is origin/device-specific and has quota limits; it is not a backup. Export JSON before clearing browser data.
- The initial Remotion composition is an abstract visual treatment. It is not a full scene registry or asset-aware editor, and the demo is explicitly illustrative. Its caption band displays script text over music; it does not yet include spoken narration.
- No SQLite, uploaded media, TTS, caption alignment, render worker, or project-specific MP4 pipeline exists yet.
- Long or numerous scripts may exceed the fixed 15-second demo composition duration; production timing must derive from narration and configured padding.
- Typography currently uses system fallbacks to keep the dashboard offline-capable.

## Local data and security

There are no external API calls or credentials in this foundation. Project JSON is stored in browser local storage. Generated render output is directed to the ignored `out/` path. `.env.example` lists future optional provider variables and contains no secrets.

## Remotion guidance

The project follows the installed Remotion create, best-practices, and render skills. The composition uses `useCurrentFrame()`, `interpolate()`, `spring()`, `Sequence`, and `AbsoluteFill`; animation is deterministic and side-effect free. Current official Remotion guidance recommends frame-based timing and `renderMedia()` for programmatic server rendering; the current demo uses Remotion CLI for local rendering.
