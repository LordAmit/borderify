# Spec Kit SDD Tasks Template

This file outlines the pattern for managing subsequent features, changes, and bug fixes using Spec-Driven Development.

## Task Creation Workflow

When a new feature or bug fix is requested:
1.  **Specify:** Describe the change in the relevant colocated `src/*.spec.md` file (see the index in `.specify/specify.md`) using the strict EARS patterns.
2.  **Plan:** Update `.specify/plan.md` to map the code changes needed.
3.  **Task list:** Create an entry in this `tasks.md` file using the template format below.
4.  **Implement:** Edit the codebase files to match the updated specifications, and put a `// [REQ-…]` tag directly above each function or block that satisfies a requirement (convention in `.specify/specify.md`).
5.  **Verify:** Run tests and check execution against the specification before closing the task.

---

## SDD Task Template Example

### [Task ID] - [Brief Feature Name]

*   **Requirements Changed:** (Link to specific requirement IDs in the relevant `src/*.spec.md` file; index in `.specify/specify.md`)
*   **Architecture Changed:** (Link to specific lines in `.specify/plan.md`)
*   **Action Items:**
    *   `[ ]` Action 1
    *   `[ ]` Action 2
*   **Verification Checklist:**
    *   `[ ]` Test cases updated
    *   `[ ]` `npm run verify-specs` passes (every ID tagged in implementation and carried by a passing test)
    *   `[ ]` Render pipeline verified on device viewport
