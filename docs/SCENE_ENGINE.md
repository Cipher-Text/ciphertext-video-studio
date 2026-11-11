# Documentary scene engine

## Repository analysis

The application already has a local-first React/TypeScript dashboard, Zod-validated project and storyboard JSON, SQLite persistence, independent SQLite animation metadata, Azure Speech and ElevenLabs integrations, a single local render worker, and a Remotion composition in `src/video`. `MasterDocumentary` owns scene timing, approved transition overlap, audio, and measured-audio caption progression. Scene visuals are selected through `sceneRegistry`; a separate allow-listed animation catalog resolves reusable presets. Optional `animationConfig`, `animationPresetId`, `mapData`, `geoJson`, `chartData`, `comparisonData`, and `videoAsset` fields are additive. The six requested brand profiles are already configured.

No database migration is needed for this increment. No project/storyboard fields are removed or renamed, and the existing `animation` values retain their current meaning. See [ROADMAP.md](ROADMAP.md) for the phased dependency plan and remaining gates.

## Phase 1 — deterministic 2D scene engine

- `sceneDefinitions` is the typed registry contract: each current `SceneType` resolves to a renderer, purpose, and motion family. `sceneRegistry` remains the production resolver and still applies explicit presets before legacy modes.
- `brandThemes` provides active presentation typography and recommended motion guidance for all six brands. Existing scene camera values remain authoritative; the guidance does not change saved project data or legacy camera behavior.
- `cameraTransformAtFrame` is a pure frame-to-transform function. Preview and render use the same frame math; Remotion `useCurrentFrame`, `interpolate`, and `spring` remain the animation clock.
- Quantitative chart domains, band positions, and tick values use D3 `scaleBand` and `scaleLinear`. SVG drawing and reveal timing remain frame-driven in Remotion.
- Reusable JSON-ready samples are in `examples/scene-templates.json`. They intentionally use the existing strict `SceneSchema` and are validated by tests.

GSAP is not part of the export runtime. If a future authoring-only interaction uses GSAP, exported scene state must still be serialized into frame-addressable parameters; never use wall-clock timelines for a rendered composition.

## Migration plan

### Phase 1 (current)

Keep the current React scene components and SQLite animation catalog. Strengthen the typed registry and reusable tokens, use D3 for chart geometry, add deterministic tests, and preserve the current media/audio/caption/render flow. Use one Remotion worker and Studio `--scale=0.5` for an 8 GB Mac.

### Phase 2 (implemented optional map runtime)

Select **Map renderer → MapLibre · local GeoJSON** on a historical-map scene, or set optional `mapEngine: "maplibre"` in storyboard JSON. MapLibre scenes require GeoJSON with a source citation and are capped at 250 features / 25,000 coordinate positions for predictable local rendering. Scenes without `mapEngine` continue to use SVG; dynamic import keeps MapLibre out of the initial scene-engine chunk. Failed MapLibre setup falls back to the existing SVG renderer.

The MapLibre renderer uses a bundled worker and a style/source constructed from the scene's inline GeoJSON. It draws local polygons, lines, and point markers; it does not request remote styles, sprites, glyphs, tiles, or API keys. The source citation remains in frame. Turf `bbox` calculates the camera extent, and `length` / `lineSliceAlong` reveal linework from frame progress. Camera framing remains static for the shot to avoid live-map shimmer; polygons and markers are stable while routes draw by frame.

The in-Studio example at `CipherTextSceneEngineDemo` includes synthetic geometry clearly labeled as not representing a real location or boundary. Replace it with locally attached, sourced GeoJSON before factual production. Existing SVG, GeoJSON validation, campaign-map, and mapData renderers remain available.

### Phase 3 (implemented optional 3D runtime)

In a scene card, set **Scene renderer → 3D · procedural illustration** and choose **Armored vehicles**, **Terrain**, or **Globe**. This is a generic reusable treatment, not a project-specific scene or a historical model claim. Storyboard JSON can opt in with `sceneEngine: "three"` and optional `threeConfig: { "subject": "armored-vehicle", "accentColor": "#db9b62" }`. Existing scenes remain on their previous renderers; omitting `sceneEngine` changes nothing.

`ThreeIllustrationScene` is dynamically imported and uses `@remotion/three`, React Three Fiber and low-poly procedural geometry. Vehicle travel, turret movement, camera shift and globe rotation are derived from Remotion frame progress. The canvas is fixed to DPR 1, uses low-power WebGL, and has no real-time physics, external models, textures or network assets. Renderer errors fall back to the original 2D scene renderer. Preview uses a dedicated 720p composition; production scenes inherit the project's output dimensions and should be rendered with concurrency 1 on an 8 GB Mac. This is an artistic reconstruction and must not be labeled as archival footage or as a specific verified vehicle/unit unless source-backed artwork is attached.

## Compatibility and authoring

- Existing `animation: zoom-in | pan-left | fade | rise` and camera movement values remain supported.
- `animationConfig`, `animationPresetId`, `geoJson`, `mapData`, `comparisonData`, and `videoAsset` are optional. Existing imports remain valid; new scenes still pass through `StoryboardSchema`.
- Animation library entries remain metadata references to allow-listed code renderers in SQLite. They are project-independent; binding a preset to a scene remains optional.
- `videoAsset` remains distinct from an animation preset and keeps its trim, fit, and position properties.
- Scene narration duration remains the greater of the planned duration, measured audio duration, or trimmed video duration. Caption time remains based on scene frames and the measured narration length.
- Do not add database migrations for scene-engine-only visual tokens. If a future feature requires persistent renderer or asset metadata, add an additive migration and a rollback/data-preservation test first.

## Development and rendering on an 8 GB Mac

```sh
# Reduced-size preview
pnpm exec remotion studio src/video/index.tsx --scale=0.5 --concurrency=1

# Existing full project render pipeline (the app render worker also defaults to one job at a time)
pnpm render:project -- --props=examples/garibpur-1971.project.json --concurrency=1 --codec=h264 --crf=20

# Optional local MapLibre sample; the selected frame range covers the synthetic map scene
pnpm exec remotion render src/video/index.tsx CipherTextSceneEngineDemo out/maplibre-demo.mp4 --frames=330-479 --concurrency=1 --codec=h264 --crf=24 --gl=angle

# Optional procedural 3D illustration demo (6 seconds, 720p)
pnpm exec remotion render src/video/index.tsx CipherTextThreeSceneDemo out/three-scene-demo.mp4 --concurrency=1 --codec=h264 --crf=24 --gl=angle
```

For preview, run `pnpm exec remotion studio src/video/index.tsx --scale=0.5 --concurrency=1`. Open `/CipherTextSceneEngineDemo` and scrub to about 11 seconds for MapLibre, or open `/CipherTextThreeSceneDemo` for the 3D scene. Keep preview and final output deterministic at the same input props and frame number. Both MapLibre and Three.js use WebGL; validate exports with ANGLE and one render worker before using either for production.
