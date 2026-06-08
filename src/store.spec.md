# Presets and State Management Specification

This document contains the functional requirements for configuration presets and state modifiers.

### Ubiquitous Requirements
*   **[REQ-STAT-01]** The system shall store all current slider values, layout dimensions, fonts, custom texts, and logo parameters in a single configuration object.

### Event-Driven Requirements
*   **[REQ-STAT-02]** When a preset JSON file is uploaded, the system shall overwrite the active layout configuration.
*   **[REQ-STAT-03]** When the user clicks the reset icon on a slider row, the system shall revert that setting to its default value.
*   **[REQ-STAT-04]** The system shall allow removing an image from the session queue, updating the active image selection if the deleted image was active.
*   **[REQ-STAT-05]** The system shall allow selecting an active image from the queue.
*   **[REQ-STAT-06]** The system shall allow clearing all images from the queue.
