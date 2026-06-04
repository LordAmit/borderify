# Canvas-First Rendering and Layout Styling Specification

This document contains the functional requirements for canvas bounds calculations and image layout styling.

### Ubiquitous Requirements
*   **[REQ-REND-01]** The system shall calculate the output canvas boundaries using the selected aspect ratio and scale limits.
*   **[REQ-REND-02]** The system shall calculate border padding inward from the final aspect ratio bounds to prevent layout skewing.
*   **[REQ-REND-03]** The system shall align text and logo objects using a 9-point anchor grid (Top/Middle/Bottom paired with Left/Center/Right).

### State-Driven Requirements
*   **[REQ-REND-04]** While the active image configuration is updated, the system shall run the render pipeline to refresh the canvas preview.

### Unwanted Behavior Requirements
*   **[REQ-REND-05]** If the browser does not support `ctx.roundRect`, then the system shall fallback to rendering standard rectangular borders.

### Optional Requirements
*   **[REQ-REND-06]** Where background type is set to `blurred-image`, the system shall downsample the image to a low-resolution buffer canvas, apply the canvas blur filter, and upscale the blurred result back to the main canvas to prevent mobile memory exhaustion.
*   **[REQ-REND-07]** Where inner image shadows are enabled, the system shall render the shadow offset on a distinct layer below the picture clipping boundary.
