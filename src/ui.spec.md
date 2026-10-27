# User Interface Specification

This document contains the functional requirements for layouts, settings controls, preset management, image queue, and batch file actions.

### Ubiquitous Requirements
*   **[REQ-UI-01]** The system shall render a split-pane layout: on viewports wider than 768 px, a canvas preview panel beside a settings sidebar; on narrower viewports, the canvas preview above a bottom drawer that collapses to a peek bar (a handle plus one tab per settings section) so the preview stays visible while a setting is changed, and that opens on the tapped section.
*   **[REQ-UI-02]** The system shall organize settings inside distinct collapsible sections for Border, Canvas/Background, Captions, Logo, EXIF, and Export Settings within the control panel.
*   **[REQ-UI-03]** The system shall pair sliders for scale variables with inline plus and minus buttons to increment or decrement values by step amounts.

### Event-Driven Requirements
*   **[REQ-UI-04]** The system shall allow exporting the current configuration object as a JSON file, and overwriting configuration states when a preset JSON file is uploaded.
*   **[REQ-UI-05]** The system shall maintain an image queue panel displaying thumbnails of loaded files, with controls to select the active image, delete individual images, or clear all queue contents.
*   **[REQ-UI-06]** When batch download is triggered, the system shall process all queued images sequentially and download them compiled inside a single ZIP file.

### Accessibility Requirements
*   **[REQ-UI-07]** The system shall associate every settings control (slider, color picker, select, text field) with a visible label through a programmatic name so that assistive technology announces the control by that label.
*   **[REQ-UI-08]** The system shall render every clickable control (style cards, position dots, EXIF tag chips, advanced-section toggles, queue thumbnails) as a keyboard-focusable button that exposes its selected state through `aria-pressed`.
*   **[REQ-UI-09]** The system shall give every icon-only button an accessible name and every queue thumbnail and export preview image alternative text.
*   **[REQ-UI-10]** While the export preview overlay is open, the system shall present it as a modal dialog that receives keyboard focus, keeps Tab focus inside it, closes on Escape, and returns focus to the control that opened it.
*   **[REQ-UI-11]** The system shall expose the expanded or collapsed state of each collapsible settings section through `aria-expanded` and show a visible focus ring on every focusable control.

*   **[REQ-UI-17]** The system shall render all interface text at a contrast ratio of at least 4.5:1 against its background, and shall define every color, radius and type size as a design token in the stylesheet `:root` block rather than as a literal value in component markup or component rules.

### State-Driven Requirements
*   **[REQ-UI-14]** While a batch export is running, the system shall show the progress as "Exporting N of M" in a live region, label the batch button with it, and disable the export and preview buttons until the ZIP download starts.
*   **[REQ-UI-15]** While files are dragged over the application, the system shall highlight the canvas area as the drop target and show a "Drop photos to add them" hint.

### Unwanted Behavior
*   **[REQ-UI-12]** If a selected preset file cannot be parsed as a configuration object (invalid JSON, or no layout and labels fields), then the system shall show a dismissible error notice naming the file and keep the current configuration unchanged.
*   **[REQ-UI-13]** If one or more selected, dropped, or pasted files cannot be read as images, then the system shall show a dismissible notice with the count of skipped files and still load the remaining files.
*   **[REQ-UI-16]** If a web font family name is still being typed, then the system shall request the font stylesheet only after 500 ms without further input and shall remove stylesheet links for names that were superseded before that delay elapsed.
