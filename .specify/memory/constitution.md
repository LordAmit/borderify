# Borderify Project Constitution

This document defines the non-negotiable principles, development standards, architectural rules, and safety boundaries for the Borderify repository.

## 1. Safety and Deployment Restrictions
*   **No Automated Deployments:** Under no circumstances shall an AI coding assistant run `npm run deploy`, `rsync`, or execute any commands that deploy code to staging or production environments. All deployments must be done manually by the human user via `./deploy.sh`.
*   **Mandatory Plan and Approval Review (No Exceptions):** AI agents shall present a detailed plan and obtain the user's explicit approval *before* executing any modifications to code, configuration files, scripts, workflows, or project instructions. This includes any minor tweaks, script updates, or follow-up changes to already approved plans. No changes shall be made or committed without direct user consent in the current turn.

## 2. Architectural Principles

System-level obligations. Each carries an `[ARC-NN]` ID and follows the same EARS form and traceability rules as feature requirements: tagged in the implementing code, covered by a passing test, linted by `npm run lint-specs`, and checked by `npm run verify-specs`.

*   **[ARC-01]** The system shall use HTML5 Canvas (`CanvasRenderingContext2D`) as the single source of truth for generating output frames, ensuring pixel-perfect exports; DOM-based overlays are restricted to visual previews only. *(Canvas-First Rendering)*
*   **[ARC-02]** The system shall perform all image loading, rendering, EXIF metadata parsing, and ZIP generation strictly on the user's local machine, shall transmit no image data, EXIF metadata, or user-identifying information to any server, and shall limit analytics to anonymous page-level analytics declared in `index.html` (no analytics or event-tracking calls inside application modules). *(Offline-First & Privacy)*
*   **[ARC-03]** The system shall store all application configuration, loaded image state, and visual preferences in the centralized React Context store ([src/store.tsx](../../src/store.tsx)). *(State Integrity)*

## 3. Technology Stack Rules
*   **Core Frontend Framework:** React (TypeScript) initialized via Vite.
*   **Styling:** Custom styling shall use Vanilla CSS (`index.css` and component-specific stylesheets). Modern CSS tools (e.g. CSS nesting, custom properties) are preferred. Tailwind CSS is not permitted.
*   **Testing Framework:** Unit and integration testing shall use Vitest.

## 4. Traceability
*   **Spec Traceability:** Every requirement ID (`[REQ-AREA-NN]` in `src/*.spec.md`) and every architectural principle ID (`[ARC-NN]` above) appears in three places: its declaration, a `// [ID]` tag directly above the implementing code, and the title of a test that runs and passes. `npm run verify-specs` enforces all three links from executed Vitest results (convention: [.specify/specify.md](../specify.md)).
*   **Commit Traceability:** Every commit that changes `src/` references the affected IDs in its message (or `[NO-REQ]` with a reason); enforced by the `commit-msg` hook and CI through `npm run check-commit-ids`.
*   **Bug-Fix Discipline:** A bug fix merges only together with a specification change (normally an EARS Unwanted Behavior line, "If <condition>, then the system shall <response>") and a test whose title carries that requirement's ID. Every failure becomes a requirement with a test, not only a patch. Enforced for `fix:` commits by the same check.
