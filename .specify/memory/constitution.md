# Borderify Project Constitution

This document defines the non-negotiable principles, development standards, architectural rules, and safety boundaries for the Borderify repository.

## 1. Safety and Deployment Restrictions
*   **No Automated Deployments:** Under no circumstances shall an AI coding assistant run `npm run deploy`, `rsync`, or execute any commands that deploy code to staging or production environments. All deployments must be done manually by the human user via `./deploy.sh`.
*   **Mandatory Plan and Approval Review (No Exceptions):** AI agents shall present a detailed plan and obtain the user's explicit approval *before* executing any modifications to code, configuration files, scripts, workflows, or project instructions. This includes any minor tweaks, script updates, or follow-up changes to already approved plans. No changes shall be made or committed without direct user consent in the current turn.

## 2. Architectural Principles
*   **Canvas-First Rendering:** The system shall use HTML5 Canvas (`CanvasRenderingContext2D`) as the single source of truth for generating output frames, ensuring pixel-perfect exports. DOM-based overlays are restricted to visual previews only.
*   **Offline-First & Privacy:** All image loading, rendering, EXIF metadata parsing, and ZIP generation shall occur strictly on the user's local machine. The application shall collect no telemetry or tracking data.
*   **State Integrity:** All application configurations, loaded image states, and visual preferences shall be stored in a centralized React Context store ([src/store.tsx](../../src/store.tsx)).

## 3. Technology Stack Rules
*   **Core Frontend Framework:** React (TypeScript) initialized via Vite.
*   **Styling:** Custom styling shall use Vanilla CSS (`index.css` and component-specific stylesheets). Modern CSS tools (e.g. CSS nesting, custom properties) are preferred. Tailwind CSS is not permitted.
*   **Testing Framework:** Unit and integration testing shall use Vitest.
