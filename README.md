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

`examples/garibpur-1971.project.json` is a portrait sample using the existing project and storyboard schema. Its optional per-scene `animationConfig` adds deterministic battlefield modes, camera tracking, and layered image movement. Scenes without `animationConfig` still use the legacy `animation` values. Image assets and trimmed video clips continue to use their existing scene fields. The generated battlefield plate is labeled as a historical illustration, not archival footage. The Garibpur example stores locations and an explicitly illustrative, not-to-scale route in that scene's `mapData`; it is based on the published MP-IDSA area-of-operations map. Unit insignia are omitted without a verified, licensed reference.

### Reusable animation presets

`src/animations/catalog.json` defines the allow-listed preset catalog. On server startup, preset and quality metadata is upserted into SQLite (`animation_presets` and `animation_preset_quality_config`) and is available through `GET /api/animation-presets?brandId=...`. The library is project-independent: browse and preview presets in **Animations** with no project open, then optionally bind a preset to a scene. Renderer code remains version-controlled React/TypeScript; the database stores metadata, not executable code or rendered animation clips.

**Current animation model:** a catalog entry is a reusable motion template that points to an allow-listed Remotion renderer. The gallery preview creates a six-second, 360×640 sample scene with the preset's title and default settings. It uses the same renderer family as project output, but it does not load the selected project's narration, footage, map data, or other scene inputs. Camera movement and strength can be previewed globally. The preview is not saved as a video file.

Choosing a project scene and **Apply to scene** binds the preset ID and camera/settings to that scene in `storyboard_json`. Export renders the renderer into the project composition alongside its narration, transitions, and captions; it does not copy a standalone animation MP4 into the scene. Existing `animation`, `animationConfig.mode`, `videoAsset`, and `assetPath` fields remain supported. An uploaded/trimmed `videoAsset` is a separate scene media clip, not an animation preset.

The optional `mapData` and `comparisonData` fields can carry sourced input in project JSON. There are no dedicated `mapData` or `comparisonData` editors in the current UI; add those values through JSON import/editing. A gallery preview has no such case-specific data and should show the source-required state. In particular, the current Delta storm treatment is illustrative: its path is a fixed graphic, not a track generated from storm observations.

To add a preset, implement or reuse a renderer in `src/video/genericAnimationScenes.tsx` or `src/video/battlefieldAnimations.tsx`, add a descriptor with its `rendererKey` and brand scope to `src/animations/catalog.json`, and add that renderer key to the allow-listed switch. Use deterministic Remotion frame math, label reconstructions, and require citations for case-specific or measured claims. Current brand collections are Bengal Unfolded, KaloKhata, Delta Signal, FactLens, Open Care, and CipherText Labs, plus shared camera and parallax treatments. Some catalog entries share renderer families; a new catalog entry does not automatically create a unique animation or a downloadable clip.

Prepare short preview props for the Garibpur portrait/landscape/square example and one demonstration per brand:

```bash
node scripts/prepare-animation-quality-samples.mjs
```

The generated props are in `out/animation-quality/props/` (ignored build output). To preview a preset, open **Animations**, choose a card, and play its embedded Remotion preview. To bind it, open a project, select a target scene in the optional project-scene control, and choose **Apply to scene**. This stores the renderer reference and settings on the scene; it does not bake or attach a separate video file.

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
