# Product roadmap

## Documentary scene engine phases — 2026-11-11

- **Phase 1 implemented:** typed scene descriptors, six brand presentation themes, a pure frame-to-camera transform helper, D3 chart scales/ticks with Remotion-controlled SVG reveals, strict-schema sample scenes, and deterministic unit/schema tests. No SQLite or storyboard migration was required.
- **Phase 2 planned/optional:** add MapLibre GL JS and Turf behind an optional map-renderer boundary only when sourced offline geographic styles/tiles or geoprocessing needs justify the dependency. Keep the current GeoJSON/SVG render path as fallback; no hosted tile provider is required.
- **Phase 3 planned/optional:** add `@remotion/three` and React Three Fiber behind an opt-in renderer for reviewed local 3D assets. Preserve a 2D fallback, reduced pixel ratio, and single-worker rendering. All scene state remains frame-derived.
- **GSAP:** not needed for exported animation. If used for future authoring interactions, its output must be converted to deterministic frame-addressable values before Remotion rendering.

## Animation quality rebuild — 2026-11-11

1. **Reusable motion contracts** — Catalog entries include source/data requirements, camera and motion defaults, compatible aspect ratios, render-cost estimates, preview configuration, and quality criteria. SQLite stores metadata independent of projects. A project stores an optional preset reference and per-scene settings. These are renderer templates, not rendered video files.
2. **Media-led historical treatment** — The primary battlefield treatment now uses a labeled reconstruction plate, subtle atmospheric layers, restrained eased camera motion, and readable titles. Legacy tank and map modes remain accepted for old project JSON.
3. **Source-aware maps and comparisons** — New optional scene `mapData` supports clearly labeled schematic campaign routes, and `comparisonData` supports two cited numeric series with units/period. GeoJSON remains available for geographic data. Empty map/data inputs render a required-source state, never an invented route/value.
4. **Six brand-specific families** — Bengal Unfolded, KaloKhata, Delta Signal, FactLens, Open Care, and CipherText Labs have dedicated renderer treatments. Further templates need reviewed data/assets for clinical diagrams, live forecast uncertainty, court status, product screenshots, and high-detail historical vehicles.
5. **Gallery workflow** — The library is browsable without a project; six-second synthetic previews share the production renderer registry. Category/brand/search filters, format/asset requirements, camera controls, and optional preset-to-scene binding are available. Preview props do not include project narration, media, or structured data inputs.

### Remaining animation work

- **Generic animation-video binding** — Current catalog entries point to code renderers; they do not represent reusable rendered MP4 files. To support the intended clip workflow, add persistent animation-video records/assets, independent clip previews, and a scene binding that stores the clip reference separately from the current renderer preset. Keep existing preset IDs and `videoAsset` compatibility intact.
- Add UI editors/import for source-backed `mapData` and `comparisonData`; previews should accept representative scene inputs so data-driven templates can be inspected with real routes/values.
- Wire tank/troop motion renderers into the live scene registry with reviewed, clearly illustrative artwork. Treat the current Delta storm path as a static illustration until a source-driven track renderer is implemented.
- Render the Garibpur sample in landscape and square, plus one short real MP4 for each brand pack; inspect output metadata and representative-frame contact sheets. The portrait 18-second sample is complete. Subsequent browser launches currently fail under the macOS Codex sandbox.
- Review the generated plate and all sample copy with a historian/editor; acquire rights-cleared PT-76/M24 reference artwork before using model-specific visuals.
- Bundle or document a licensed Bengali font for reproducible rendering across hosts.
- Run automated checks for text bounds, blank frames, contrast, assets, source labels, and safe areas, then manually inspect motion and Bengali typography. Automated tests do not prove publication quality.

This roadmap records the current product foundation and evidence-backed follow-up work from the 2026-11-08 production review. Existing project persistence and manual storyboarding remain supported.

## Implemented foundation

1. **Manual and AI storyboarding** — Manual scenes remain editable. The provider-independent director accepts brand, script/topic, audience, language, duration, format, and available media; it returns narrative structure, narration, visuals, treatment, camera, animation, asset suggestions, durations, and source requirements. Zod validates input/output. Local OpenAI-compatible and configured remote chat-completions endpoints are supported. Real provider operation still needs deployment configuration and smoke testing.
2. **Timeline, preview, and transitions** — Scene timeline, click-to-seek, playback feedback, and three formats are supported. Official Remotion TransitionSeries supplies overlapping fades/wipes with total frame duration preserved; a two-scene transition exported at the exact 12-second target. Full drag-and-drop timeline editing remains future work.
3. **Video and media** — Image/video uploads, local media reuse, scene attachment, trim in/out, fit/fill, and position are supported. The API serves uploaded media with byte-range support through the Vite proxy, and browser decoder readiness is covered with a WebM fixture. Actual MP4 export with uploaded video, trim, contain framing, and ElevenLabs narration is verified. Crop/keyframe tooling and portable project media bundles remain future work.
4. **Data visuals** — Bar/line charts use user data, units, period, citation, and separate deterministic geometry/animation. A square MP4 fixture is rendered. CSV import, uncertainty intervals, and richer labeling remain future work.
5. **Geography and history** — GeoJSON point, line, and polygon types render with required source labels; a BAMIS Bangladesh boundary fixture is included. Confirm BAMIS reuse terms before external publishing. Sourced dated event cards animate in a portrait MP4. Historical boundary reconstruction and higher-detail projection/label controls require domain review and sourced datasets.
6. **Software demo and narration** — Timed callouts render over supplied images/video; a scene with callout and a separate real uploaded-video/ElevenLabs export are in `examples/rendered/`. Speech phrase captions display over audio and are proportionally timed. Word alignment and manual caption edits remain future work.
7. **Six brand examples** — One editable project JSON per brand is in `examples/projects/`. Rendered examples cover software demo, data chart, history timeline, and GeoJSON map.

## Next priorities

1. Add a forced real-renderer failure/retry test and cancellation during active frame encoding; worker SIGKILL/restart recovery and transition duration preservation are verified.
2. Review portrait safe areas and accessibility across each brand and scene family; review narration/caption timing by listening.
3. Run the AI director against supported local/remote providers in an explicitly configured deployment; record latency, output quality, and rate-limit behavior.
4. Add CSV import, forced alignment/manual phrase editing, image crop tools, richer callout shapes, and project media packaging.

## Product guardrails

- Keep scene schema additions optional and preserve existing project JSON compatibility.
- Keep local API keys server-side; never accept provider URLs from storyboard requests.
- Preserve review gates for chart data, map sources, historical claims, and health content.
- Keep source credits attached to maps, data, narration, and media; identify illustrative reconstructions.
- Keep exports deterministic, verify actual MP4 streams, and exercise landscape, portrait, and square output before release.
