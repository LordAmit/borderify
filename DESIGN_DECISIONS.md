# Design Decision Records: Borderify

Numbered records of the core technical decisions, their trade-offs, and the requirements each one serves. The aim is to keep the *why* traceable next to the *what*: every record links the EARS requirement IDs it justifies, and `npm run verify-specs` rejects a record that cites an ID no spec declares.

**Record format.** `DR-NNN` heading; a field table (Status, Date, Requirements, Code); then Decision and Trade-offs. IDs link to the colocated spec that declares them (index: [.specify/specify.md](.specify/specify.md)).

**Status values.** `Accepted` (in force, matches the code) · `Proposed` (agreed, not yet implemented) · `Superseded` (replaced; the record stays for history and names what replaced it) · `Deprecated` (no longer applies, nothing replaced it).

## Standing rules

**AI assistants must never trigger deployments.** Do not run `npm run deploy`, `rsync`, or any command that pushes code to a staging or production environment. Deployment lives in `deploy.sh`, reserved for manual execution by the human user. The canonical statement of this and the other non-negotiables is [.specify/memory/constitution.md](.specify/memory/constitution.md).

---

## DR-001 — Canvas-First Rendering Pipeline

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Requirements** | [ARC-01](.specify/memory/constitution.md), [REQ-REND-01](src/render.spec.md), [REQ-REND-02](src/render.spec.md), [REQ-REND-03](src/render.spec.md), [REQ-REND-10](src/render.spec.md), [REQ-REND-13](src/render.spec.md), [REQ-EXPT-01](src/export.spec.md) |
| **Code** | [render.ts](src/render.ts), [CanvasPreview.tsx](src/CanvasPreview.tsx) |

**Decision:** The application relies entirely on HTML5 `<canvas>` rendering (`CanvasRenderingContext2D`) instead of DOM-based overlay styling (such as CSS absolute positioning) to generate the final borders and EXIF data. This is constitution principle [ARC-01](.specify/memory/constitution.md) (Canvas-First Rendering).

**Trade-offs:**
- *Pros:* Guarantees pixel-perfect exports; what is previewed is exactly what is exported. Inherently supports high-resolution output, since canvas dimensions mirror the physical image resolution before padding. Eliminates browser-specific CSS rendering quirks.
- *Cons:* Requires manual math for all positional logic (`ctx.fillText`, `ctx.roundRect`). Text and logo wrapping and alignment are rigid, so custom bounding-box measurement (`measureText` passes) was built to position EXIF pills and labels dynamically.

## DR-002 — Inward Canvas Padding Algorithm

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Requirements** | [REQ-REND-01](src/render.spec.md), [REQ-REND-02](src/render.spec.md) |
| **Code** | [render.ts](src/render.ts) (canvas bounds and padding calculation) |

**Decision:** Instead of calculating the final canvas size by *adding* a padding scale to the original image dimensions, the engine allocates the frame purely from the target aspect ratio and scale bounds, then works strictly *inward*. The frame edge is absolute; the image shrinks inside it.

**Trade-offs:**
- *Why:* Earlier versions added global border padding outward from the original canvas. That broke fixed output aspect ratios (forcing a 4:5 frame and then adding uneven 10% padding produced an unpredictable canvas shape).
- *Benefit:* With the canvas size dictated by the chosen ratio (e.g. `4:3`) bound to the longest image side, each padding scale subtracts from that boundary to shape the image area. Aspect-ratio skew is eliminated by construction.

## DR-003 — UI Component Standardization (`SliderRow`)

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Requirements** | [REQ-UI-03](src/ui.spec.md), [REQ-STAT-03](src/store.spec.md) |
| **Code** | [SidebarControls.tsx](src/SidebarControls.tsx) (`SliderRow`) |

**Decision:** Slider settings were refactored from repeated JSX blocks into one abstracted React component (`SliderRow`).

**Trade-offs:**
- *Pros:* Features can be added to every slider at once. The "Reset" icon and the −/+ nudge buttons reached 20+ sliders by editing a single component. Much smaller footprint.
- *Cons:* Control typing is loosely coupled to `store.tsx` updates; each parameter passes `onChange` and `onReset` closures inline instead of grouping them locally.

## DR-004 — Sub-Clipping Layers (Inner Borders and Curves)

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Requirements** | [REQ-REND-05](src/render.spec.md), [REQ-REND-07](src/render.spec.md), [REQ-REND-09](src/render.spec.md), [REQ-REND-11](src/render.spec.md), [REQ-REND-12](src/render.spec.md), [REQ-REND-14](src/render.spec.md) |
| **Code** | [render.ts](src/render.ts) (inner card, photo clip, photo border passes) |

**Decision:** Inner image padding, rounded frame corners, and rounded picture corners are built from multi-pass `ctx.clip()` and `ctx.shadowColor` paths rather than generic image manipulation.

**Trade-offs:**
- *Pros:* Defining a mathematical path, filling it white to cast a native shadow, and *then* applying a clip mask before drawing the image lets "Inner Image Shadow" and "Image Radius" work independently of the background rendering. Falls back to plain `rect` where `roundRect` is unsupported.
- *Cons:* Canvas clipping can anti-alias unexpectedly at sub-pixel edges, but at photo export resolutions (10+ megapixels) the clipping edge is sharp.

## DR-005 — Live Preview Pipeline Reused for Batch Export

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Requirements** | [ARC-03](.specify/memory/constitution.md), [REQ-REND-04](src/render.spec.md), [REQ-EXPT-02](src/export.spec.md), [REQ-EXPT-03](src/export.spec.md), [REQ-UI-06](src/ui.spec.md) |
| **Code** | [CanvasPreview.tsx](src/CanvasPreview.tsx), [App.tsx](src/App.tsx) (`handleExportBatch`) |

**Decision:** The primary view is a live render pipeline keyed on `state.activeImageId`: the active image is re-rendered on every slider change for the `CanvasPreview`. Batch export repeats the same `renderPhotoBorder` pipeline for each queued image on a hidden offscreen canvas.

**Trade-offs:**
- *Pros:* One rendering path, so preview and export cannot diverge. Users tune aesthetics on one photo and then export the whole queue asynchronously to a ZIP.
- *Cons:* Rapid slider interaction on very large images (80 MB RAW-derived JPEGs) can drop frames in the live preview; offscreen canvases are released after each export.

## DR-006 — Overridable EXIF Text (`customCameraText`, `customLensText`)

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-05-08 |
| **Requirements** | [REQ-REND-13](src/render.spec.md), [REQ-EXIF-06](src/exif.spec.md). *Gap:* no requirement yet declares the override fields themselves; `store.test.tsx` and `SidebarControls.test.tsx` cover them without a REQ ID. |
| **Code** | [render.ts](src/render.ts) (pill text resolution), [utils.ts](src/utils.ts) (`resolveTemplate`), [types.ts](src/types.ts) (`ExifPillSettings`) |

**Decision:** EXIF headers cannot be edited by the visual parser, so the store exposes `customCameraText` and `customLensText` template overrides that replace the parsed camera and lens strings in the pills.

**Trade-offs:**
- If a user sets a lens override and runs a batch export, every photo in that ZIP inherits the literal override. This is accepted so that a unified brand look can be applied across shoots with mismatched lenses.

## DR-007 — Direct Canvas-Filter Background Blur

| Field | Value |
| --- | --- |
| **Status** | Accepted |
| **Date** | 2026-08-31 (replaces a downsampled-buffer proposal from 2026-05-08 that was never implemented) |
| **Requirements** | [REQ-REND-06](src/render.spec.md) |
| **Code** | [render.ts](src/render.ts) (blurred-image background pass) |

**Decision:** When `backgroundType` is `blurred-image`, the source image is drawn cover-fit and centered onto the main canvas with `ctx.filter = blur(Xpx)` applied directly, where X = baseLength × `backgroundBlurScale`; a black overlay at `backgroundDimScale` opacity follows. No intermediate buffer canvas is used.

**Trade-offs:**
- *Pros:* One draw call and no extra canvas allocation; the blur radius scales with the output size, so preview and export match exactly (see DR-005). Simplest code path to reason about and test.
- *Cons:* Blurring a full-resolution canvas (6000 px+) with a large radius is expensive, and some mobile GPUs (Safari/iOS) have failed on large filtered draws. The UI labels the option "Desktop only" as a precaution.

**Considered alternative — downsampled buffer (not adopted):** draw the image to a small offscreen canvas (max 800 px), blur it there, and upscale it back to the main canvas. Cheaper on large images, guaranteed compatibility on mobile GPUs, and a naturally smoother blur from bilinear upscaling; at very low radii, a minor loss of sharpness compared with a full-resolution blur. Revisit this alternative if blur failures or unacceptable preview lag are reported on mobile devices; `[REQ-REND-06]` would need rewriting alongside the code.
