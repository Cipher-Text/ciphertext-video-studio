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

### Phase 2 (optional map runtime)

Add MapLibre GL JS and Turf only when a real project needs richer map styling or geospatial calculations than the current offline GeoJSON/SVG path. Keep them behind a map scene renderer boundary and dynamic/optional import so dashboard, old maps, and render jobs do not load the additional runtime unless used. Default to local GeoJSON, local raster/vector tiles, and bundled styles; no hosted tile service is required. Turf should precompute bounded geometry, routes, or buffers from sourced inputs. The renderer should use frame-specified camera/marker state and wait for a stable map snapshot before composing it. Do not replace the current renderer or silently infer historical boundaries.

### Phase 3 (optional 3D runtime)

Add `@remotion/three` and React Three Fiber as an opt-in renderer for scenes that have a reviewed model and clear value over 2D. Keep assets low-poly and local, cap pixel ratio and shadows, render with concurrency 1, and use a static/2D fallback when the optional packages or assets are unavailable. All camera, object, and material animation values must be functions of frame/fps. Avoid unbounded particle systems, live physics, and nondeterministic simulation.

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
```

MapLibre and 3D scenes should be smoke-tested separately with small representative scenes before they enter the production render worker. Keep preview and final output deterministic at the same input props and frame number.
