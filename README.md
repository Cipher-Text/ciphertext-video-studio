# CipherText Video Studio

A local-first starter for turning reviewed scripts into brand-aware scene plans and Remotion video compositions. Manual script writing and local rendering do not require an AI service.

## Start

Requires Node.js 22.13+ and pnpm. Install dependencies with `pnpm install`, then run `pnpm dev` and open the printed local URL. The dev command starts both the dashboard and local Node API. Project drafts and storyboard edits are saved to SQLite in `data/ciphertext.sqlite`; set `CIPHERTEXT_DATA_DIR` to store the database elsewhere. Import and export project JSON from the dashboard.

Use `pnpm studio` to open the Remotion composition preview after dependencies are installed. `pnpm render:demo` renders the clearly illustrative demo composition with animated scenes, an original generated ambient music bed, and burned-in text captions to `out/demo.mp4`. In a project view, **Render MP4** sends the saved storyboard to the local Remotion composition and provides a download when complete.

## Current scope

The current foundation includes six brand profiles, manual project creation, deterministic storyboard preparation, scene editing/reordering/approval, SQLite persistence, JSON import/export, a validated Zod storyboard model, a Remotion Player preview, and a reusable documentary composition with project-specific local rendering. Asset uploads, TTS, aligned subtitles, provider integrations, and a durable local render queue remain future work. See [docs/PROGRESS.md](docs/PROGRESS.md) for exact status.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start local dashboard |
| `pnpm studio` | Open Remotion Studio |
| `pnpm typecheck` | Check TypeScript |
| `pnpm test` | Run unit tests |
| `pnpm build` | Bundle the Remotion project |
| `pnpm render:demo` | Render the illustrative demo MP4 |
| `pnpm render:project -- --props=<json-file>` | Render the `CipherTextProject` composition from serialized project props |

No provider credentials are needed for the foundation. Copy `.env.example` only when implementing optional provider adapters. Do not put secrets in browser storage.
