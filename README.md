# CipherText Video Studio

A local-first starter for turning reviewed scripts into brand-aware scene plans and Remotion video compositions. Manual script writing and local rendering do not require an AI service.

## Start

Requires Node.js 20+ and pnpm. Install dependencies with `pnpm install`, then run `pnpm dev` and open the printed local URL. Brand profiles, project drafts, and storyboard edits are saved to this browser's local storage. Import and export project JSON from the dashboard.

Use `pnpm studio` to open the Remotion composition preview after dependencies are installed. `pnpm render:demo` renders the clearly illustrative demo composition with animated scenes, an original generated ambient music bed, and burned-in text captions to `out/demo.mp4`.

## Current scope

This repository was empty at the start of implementation. The first foundation includes six brand profiles, manual project creation, deterministic storyboard preparation, scene editing/reordering/approval, browser-local persistence, JSON import/export, a validated Zod storyboard model, a Remotion Player preview, and a reusable documentary composition. It does not yet provide project-specific MP4 rendering, SQLite, asset uploads, TTS, aligned subtitles, provider integrations, or a durable local render queue. See [docs/PROGRESS.md](docs/PROGRESS.md) for exact status.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start local dashboard |
| `pnpm studio` | Open Remotion Studio |
| `pnpm typecheck` | Check TypeScript |
| `pnpm test` | Run unit tests |
| `pnpm build` | Bundle the Remotion project |
| `pnpm render:demo` | Render the illustrative demo MP4 |

No provider credentials are needed for the foundation. Copy `.env.example` only when implementing optional provider adapters. Do not put secrets in browser storage.
