# Borderify Functional Specification (EARS Syntax)

This document contains the functional requirements of Borderify written in **EARS (Easy Approach to Requirements Syntax)**.

## 1. Image Loading and EXIF Extraction

### Ubiquitous Requirements
*   The system shall load local image files entirely on the client side via the browser File API.
*   The system shall parse camera, lens, exposure, focal length, ISO, and date tags from the raw image EXIF segment.

### Event-Driven Requirements
*   When a user selects one or more image files, the system shall add them to the session image queue.
*   When an image is added, the system shall execute EXIF extraction to populate the `exif` object.

### Unwanted Behavior Requirements
*   If an image file is corrupt or cannot be parsed, then the system shall log a warning and continue processing other files in the queue.
*   If EXIF metadata is missing from the image, then the system shall populate the template fields with empty strings.

---

## 2. Canvas-First Rendering and Layout Styling

### Ubiquitous Requirements
*   The system shall calculate the output canvas boundaries using the selected aspect ratio and scale limits.
*   The system shall calculate border padding inward from the final aspect ratio bounds to prevent layout skewing.
*   The system shall align text and logo objects using a 9-point anchor grid (Top/Middle/Bottom paired with Left/Center/Right).

### State-Driven Requirements
*   While the active image configuration is updated, the system shall run the render pipeline to refresh the canvas preview.

### Unwanted Behavior Requirements
*   If the browser does not support `ctx.roundRect`, then the system shall fallback to rendering standard rectangular borders.

### Optional Requirements
*   Where background type is set to `blurred-image`, the system shall downsample the image to a low-resolution buffer canvas, apply the canvas blur filter, and upscale the blurred result back to the main canvas to prevent mobile memory exhaustion.
*   Where inner image shadows are enabled, the system shall render the shadow offset on a distinct layer below the picture clipping boundary.

---

## 3. Presets and State Management

### Ubiquitous Requirements
*   The system shall store all current slider values, layout dimensions, fonts, custom texts, and logo parameters in a single configuration object.

### Event-Driven Requirements
*   When a preset JSON file is uploaded, the system shall overwrite the active layout configuration.
*   When the user clicks the reset icon on a slider row, the system shall revert that setting to its default value.

---

## 4. Exporting and Saving

### Ubiquitous Requirements
*   The system shall compress the canvas rendering to a JPEG blob using the designated quality ratio.

### Event-Driven Requirements
*   When the user initiates a batch export, the system shall bundle the processed images into a single ZIP archive for download.

### Optional Requirements
*   Where image scale limits are set (e.g. 4K, Facebook 2048px), the system shall resize the longest edge of the output canvas before compression.
*   Where `rawExifStr` is available, the system shall re-inject the raw EXIF header block back into the output JPEG payload prior to export.
