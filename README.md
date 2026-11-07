# CipherText Video Studio

A local-first starter for turning reviewed scripts into brand-aware scene plans and Remotion video compositions. Manual script writing and local rendering do not require an AI service.

## Start

Requires Node.js 22.13+ and pnpm. Install dependencies with `pnpm install`, then run `pnpm dev` and open the printed local URL. The dev command starts the dashboard, local Node API, and single render worker. Project drafts, storyboards, and render jobs are saved to SQLite in `data/ciphertext.sqlite`; set `CIPHERTEXT_DATA_DIR` to store the database elsewhere. The API accepts only configured loopback frontend origins. Import and export project JSON from the dashboard.

Use `pnpm studio` to open the Remotion composition preview after dependencies are installed. `pnpm render:demo` renders the illustrative demo composition to `out/demo.mp4`. Project previews and exports support landscape, portrait, and square formats. **Render MP4** creates a persistent job; the dashboard shows progress, errors, cancellation, retries, and a download link after output validation.

For Bengali narration, set `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` in `.env`. The app supports Azure voices `bn-BD-NabanitaNeural` and `bn-BD-PradeepNeural`, caches generated scene audio, and derives scene duration from WAV metadata. Text is sent to Azure only when you request a preview or generate a scene voice.

## Current scope

The current application includes six brand profiles, manual project creation, deterministic storyboard preparation, scene editing/reordering/approval, SQLite persistence, JSON import/export, Zod API validation, aspect-matched Remotion previews, a persistent render queue, nine typed illustrative scene treatments, and Azure Speech narration for Bengali (Bangladesh). Full asset management, word-level subtitle timing, other speech providers, and advanced render packaging remain future work. See [docs/PROGRESS.md](docs/PROGRESS.md) for verification status.

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

Copy `.env.example` to configure local paths, frontend origins, or optional providers. Keep provider secrets in the server environment and out of browser storage.
