# Product roadmap

This is the prioritized product plan for CipherText Video Studio. Items marked implemented describe the current foundation; remaining details are still planned work. Order reflects product impact and how each capability builds toward finished, editable videos.

## Priorities

1. **Scene timeline and preview (foundation implemented)** — Arrange scenes, adjust timing and transitions, and preview visuals, narration, and phrase-level captions together. The preview includes proportional scene blocks, a live playhead and active-scene feedback, duration labels, format metadata, transition markers, and click-to-seek. Editing still happens in the scene cards; a fully integrated timeline editing surface remains future work.
2. **Per-scene media editing (video foundation implemented)** — Attach images, video clips, screenshots, and screen recordings. Crop and position visuals, set clip in/out points, and frame media for landscape, portrait, or square output. Local still and video upload, trim controls, fill/fit selection, and horizontal/vertical framing are implemented; screenshot and image-crop workflow refinements remain.
3. **Data-driven charts (scene editor implemented)** — Enter or import data, select chart styles, animate values and labels, and display units, dates, and sources. Bar and line styles now use scene-entered values with units, periods, and citations; approval and rendering require at least two labeled values and a source. CSV import and richer chart labeling remain future work.
4. **History visuals (timeline foundation implemented)** — Build sourced maps, dated timelines, and archival image sequences with visible source credits and clear treatment of illustrative reconstructions. The editor now supports 2–8 dated events, optional local images, per-event citations, and reconstruction labels; source maps and archival asset verification remain future work.
5. **Software marketing visuals (callout foundation implemented)** — Attach screenshots or screen recordings and add timed callouts with target and label positions. The software-demo scene now uses attached product media and animated callouts; richer highlight shapes and multi-track editing remain future work.
6. **Timed captions (phrase-level foundation implemented)** — Narration is split into readable phrases and timed across each generated audio clip using its measured duration. This deterministic pacing is approximate; word-level forced alignment and manual caption editing remain future work.
7. **Media library management (foundation implemented)** — Preview, reuse, replace, and remove uploaded assets, and record credit and license details. The local library now manages uploaded images and videos, tracks scene usage, stores credit/license metadata, and blocks deletion until an asset is unused.

## Shared direction

The timeline and preview should provide a common editing surface for history, analysis, software marketing, and climate videos. Scene-specific tools should then provide the right visual controls: maps and archival material for history; sourced charts for analysis and climate; and screenshots, recordings, and callouts for software marketing.

## Existing capabilities to build on

- Scene editing, up/down reordering, estimated durations, camera movement and strength, and cut/fade/wipe transitions.
- Still-image upload, reuse from the local image library, and attachment to a scene; local MP4, MOV, and WebM uploads with trim and framing controls.
- Playback-synchronized scene timeline, user-data bar/line charts with citation display, and sourced history sequences with dated event cards.
- Typed scene treatments for historical maps, sourced history sequences, data charts, document highlights, and software demos.
- Bengali Azure and ElevenLabs narration, measured audio duration, scene-level audio, and Remotion preview/render.

## Cross-cutting requirements

- Keep source, credit, and license information attached to the relevant media and visible where appropriate in the video.
- Preserve human review for factual claims, data, maps, and archival material.
- Keep scene timing synchronized with narration and media trim points.
- Preview the actual output framing for all supported aspect ratios before rendering.
