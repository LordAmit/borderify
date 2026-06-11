# User Interface Specification

This document contains the functional requirements for layouts, settings controls, preset management, image queue, and batch file actions.

### Ubiquitous Requirements
*   **[REQ-UI-01]** The system shall render a split-pane layout containing a control drawer/panel on the side (mobile drawer / desktop sidebar) and a canvas preview panel in the main content area.
*   **[REQ-UI-02]** The system shall organize settings inside distinct collapsible sections for Border, Canvas/Background, Captions, Logo, EXIF, and Export Settings within the control panel.
*   **[REQ-UI-03]** The system shall pair sliders for scale variables with inline plus and minus buttons to increment or decrement values by step amounts.

### Event-Driven Requirements
*   **[REQ-UI-04]** The system shall allow exporting the current configuration object as a JSON file, and overwriting configuration states when a preset JSON file is uploaded.
*   **[REQ-UI-05]** The system shall maintain an image queue panel displaying thumbnails of loaded files, with controls to select the active image, delete individual images, or clear all queue contents.
*   **[REQ-UI-06]** When batch download is triggered, the system shall process all queued images sequentially and download them compiled inside a single ZIP file.
