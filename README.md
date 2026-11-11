# CipherText Video Studio

A local-first starter for turning reviewed scripts into brand-aware scene plans and Remotion video compositions. Manual script writing and local rendering do not require an AI service.

## Start

Requires Node.js 22.13+ and pnpm. Install dependencies with `pnpm install`, then run `pnpm dev` and open the printed local URL. The dev command starts the dashboard, local Node API, and single render worker. Project drafts, storyboards, and render jobs are saved to SQLite in `data/ciphertext.sqlite`; set `CIPHERTEXT_DATA_DIR` to store the database elsewhere. The API accepts only configured loopback frontend origins. Import and export project JSON from the dashboard.

Use `pnpm studio` to open the Remotion composition preview after dependencies are installed. `pnpm render:demo` renders the illustrative demo composition to `out/demo.mp4`. Project previews and exports support landscape, portrait, and square formats. **Render MP4** creates a persistent job after every storyboard scene and the storyboard itself are approved; the dashboard shows progress, errors, cancellation, retries, and a download link after output validation.

For Bengali narration, configure Azure with `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`, or ElevenLabs with `ELEVENLABS_API_KEY` in `.env`. The local server lists available ElevenLabs voices and Bengali-compatible TTS models, supports Bengali preview, and saves scene audio locally (WAV for Azure, MP3 for ElevenLabs). Generated audio is cached by provider, voice, model, and text; scene timing uses measured audio duration. Provider credentials remain server-side.

ElevenLabs voice listing requires the key to have voice read access, and its full model catalog requires `models_read`. If model listing is restricted, the studio reports that limitation and offers Eleven v3 as a known Bengali-capable choice; synthesis errors are shown without changing the selected voice.

## Current scope

The current application includes six brand profiles, manual project creation, deterministic storyboard preparation, scene editing/reordering/approval, SQLite persistence, JSON import/export, local image and video upload with per-scene trim and framing controls, a media library with preview/reuse and credit/license metadata, aspect-matched Remotion previews with a playback-synchronized scene timeline, a persistent render queue, data-driven bar and line charts with citations, dated history sequences with per-event sources and reconstruction labels, software-demo screenshots and recordings with timed callouts, phrase-level captions paced to measured Bengali narration, and Azure Speech or ElevenLabs providers. JSON imports must follow the exported project shape: `format` is `landscape`, `portrait`, or `square`; scene `animation` is `zoom-in`, `pan-left`, `fade`, or `rise`; and camera movement is `zoom-in`, `zoom-out`, `pan-left`, `pan-right`, `rise`, or `none`. Validation errors identify the offending fields. Editing a scene or generating narration resets its scene approval. Rendering requires all scenes and the storyboard to be approved. See [docs/PROGRESS.md](docs/PROGRESS.md) for historical and latest verification notes and [docs/ROADMAP.md](docs/ROADMAP.md) for prioritized future features.

## Bengal Unfolded: Garibpur 1971

`examples/garibpur-1971.project.json` is a portrait, 11-scene sample using the existing project and storyboard schema. Its optional per-scene `animationConfig` adds deterministic battlefield modes, subject tracking, and depth-based foreground, midground, and background movement. Scenes without `animationConfig` still use the legacy `animation` values. Image assets and trimmed video clips continue to use the existing asset fields. The battlefield SVGs are labeled historical illustrations. The animated locations use the published MP-IDSA area-of-operations map as a relative schematic and are explicitly not to scale. Unit insignia are omitted unless a verified, licensed reference is supplied.

### Reusable animation presets

`src/animations/catalog.json` defines the allow-listed preset catalog. On server startup, preset and quality metadata is upserted into SQLite (`animation_presets` and `animation_preset_quality_config`) and is available through `GET /api/animation-presets?brandId=...`. The catalog is independent of projects: browse and preview presets in **Animation Library** without opening a project, then optionally apply one to the selected scene. Scene components and renderer mappings remain version-controlled React/TypeScript; the database never evaluates stored code. A scene stores only an optional `animationPresetId` reference and `animationConfig` settings. Existing `animation` and `animationConfig.mode` values remain supported.

To add a preset, implement or reuse a renderer in `src/video/genericAnimationScenes.tsx` or `src/video/battlefieldAnimations.tsx`, add a descriptor with its `rendererKey` and brand scope to `src/animations/catalog.json`, and add that renderer key to the allow-listed switch. Use deterministic Remotion frame math, label reconstructions, and require citations for case-specific or measured claims. Current brand packs are Bengal Unfolded, KaloKhata, Delta Signal, FactLens, Open Care, and CipherText Labs, plus shared camera and parallax treatments. Generic renderers take facts, locations, and data from each scene; case-specific content belongs in storyboard data.

Prepare short preview props for the Garibpur portrait/landscape/square example and one demonstration per brand:

```bash
node scripts/prepare-animation-quality-samples.mjs
```

The generated props are in `out/animation-quality/props/` (ignored build output). To preview any preset, open **Animation Library**, choose a brand/preset card, and play its embedded Remotion preview. The preview is independent of the current project; use **Apply to selected scene** only when you want to add a preset reference to a project scene.

Open the project in Remotion Studio at half-scale and one render worker:

```bash
pnpm exec remotion studio src/video/index.tsx --props=examples/garibpur-1971.project.json --scale=0.5 --concurrency=1
```

Render the Garibpur sample (the portrait props include the animated opening and cited schematic map scene):

```bash
pnpm exec remotion render src/video/index.tsx CipherTextProject examples/rendered/animation-quality/garibpur-portrait.mp4 --props=out/animation-quality/props/garibpur-portrait.json --overwrite --concurrency=1 --chrome-mode=chrome-for-testing --codec=h264 --crf=24
```

Render the final portrait video at 1080×1920, 30 FPS:

```bash
pnpm exec remotion render src/video/index.tsx CipherTextProject out/garibpur-1971.mp4 --props=examples/garibpur-1971.project.json --concurrency=1 --chrome-mode=chrome-for-testing --codec=h264 --crf=20
```

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start local dashboard |
| `pnpm studio` | Open Remotion Studio |
| `pnpm typecheck` | Check TypeScript |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run browser and API workflow tests |
| `pnpm build` | Bundle the Remotion project |
| `pnpm render:demo` | Render the illustrative demo MP4 |
| `pnpm render:project -- --props=<json-file>` | Render the `CipherTextProject` composition from serialized project props |

Copy `.env.example` to configure local paths, frontend origins, or optional providers. Keep provider secrets in the server environment and out of browser storage.
