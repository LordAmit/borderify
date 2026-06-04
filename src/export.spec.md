# Image Exporting and Saving Specification

This document contains the functional requirements for compression quality, scaling, and file zipping exports.

### Ubiquitous Requirements
*   **[REQ-EXPT-01]** The system shall compress the canvas rendering to a JPEG blob using the designated quality ratio.

### Event-Driven Requirements
*   **[REQ-EXPT-02]** When the user initiates a batch export, the system shall bundle the processed images into a single ZIP archive for download.

### Optional Requirements
*   **[REQ-EXPT-03]** Where image scale limits are set (e.g. 4K, Facebook 2048px), the system shall resize the longest edge of the output canvas before compression.
*   **[REQ-EXPT-04]** Where `rawExifStr` is available, the system shall re-inject the raw EXIF header block back into the output JPEG payload prior to export.
