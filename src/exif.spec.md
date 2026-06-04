# Image Loading and EXIF Extraction Specification

This document contains the functional requirements for local image loading and metadata extraction.

### Ubiquitous Requirements
*   **[REQ-EXIF-01]** The system shall load local image files entirely on the client side via the browser File API.
*   **[REQ-EXIF-02]** The system shall parse camera, lens, exposure, focal length, ISO, and date tags from the raw image EXIF segment.

### Event-Driven Requirements
*   **[REQ-EXIF-03]** When a user selects one or more image files, the system shall add them to the session image queue.
*   **[REQ-EXIF-04]** When an image is added, the system shall execute EXIF extraction to populate the `exif` object.

### Unwanted Behavior Requirements
*   **[REQ-EXIF-05]** If an image file is corrupt or cannot be parsed, then the system shall log a warning and continue processing other files in the queue.
*   **[REQ-EXIF-06]** If EXIF metadata is missing from the image, then the system shall populate the template fields with empty strings.
