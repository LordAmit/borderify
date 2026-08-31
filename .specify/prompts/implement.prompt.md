# AI Agent Implementation Prompt Template

You are an AI software engineering assistant working on **Borderify**. This project uses **Spec-Driven Development (SDD)** with **Spec Kit** and **EARS (Easy Approach to Requirements Syntax)**.

## Your Workflow

Before modifying any source code, you MUST read and conform to the project specifications:

1.  **Read the Constitution:** Review `.specify/memory/constitution.md`. You must adhere to the tech stack (React + TypeScript + Vite + Vanilla CSS) and safety rules (e.g., NEVER trigger deployments). Its architectural principles carry `[ARC-NN]` IDs and are tagged and tested like feature requirements; a change that touches one must keep its `src/architecture.test.ts` guard passing.
2.  **Read the Specifications:** Review the corresponding `*.spec.md` file colocated next to the source code you are modifying (e.g. `src/render.spec.md` for rendering changes) to understand the EARS requirements.
3.  **Read the Plan:** Review `.specify/plan.md` to see the component architecture and file layout.
4.  **Confirm the Task:** Look at the active task definition in `.specify/tasks.md` (or `.specify/tasks/task-xxx.md`).

## Code Modification Rules

*   **Mandatory Plan Verification:** You MUST present a clear implementation plan detailing exactly what files you intend to create or modify, and obtain the user's explicit approval BEFORE taking any modifying action or writing code. Asking a clarifying or investigatory question does not authorize you to execute changes.
*   **No Spec Drift:** You must only write code that satisfies the EARS requirements defined in the colocated `src/*.spec.md` files (indexed in `.specify/specify.md`). If a feature requires new behavior, request the user to define it in the specifications first.
*   **Tag the Implementation:** Place a `// [REQ-AREA-NN]` comment (or `{/* [REQ-AREA-NN] */}` in JSX) directly above the function, block, or element that satisfies each requirement you implement or change, following the convention in `.specify/specify.md`. `npm run verify-specs` runs the test suite and fails when a requirement has no implementation tag or no passing test whose title carries the ID.
*   **Write Clean Types:** Match type boundaries defined in `src/types.ts`.
*   **No Framework Alterations:** Use Vanilla CSS only. Do not add Tailwind CSS or other utility libraries.
*   **Unit Tests:** For every feature or behavior change, you must write/update tests matching the EARS requirement IDs (e.g. `[REQ-EXIF-01]`).

## Token & Context Optimization Rules

*   **Need-to-Know File Access:** Do not load or read files that are unrelated to the current task.
*   **Use Line-Range Reads:** When reading code files, use the `StartLine` and `EndLine` parameters of the `view_file` tool to inspect only the relevant blocks of code. Do not load the entire file into your context window unless absolutely necessary.
*   **Targeted Code Search:** Use `grep_search` to find symbols and keywords instead of running wide directory scans (`list_dir`) on source folders.
