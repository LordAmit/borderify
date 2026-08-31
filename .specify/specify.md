# Borderify Specifications Index

The EARS requirements for Borderify are not kept in this file. They live in `*.spec.md` files colocated with the source module they describe under `src/`. This file is the index: use it to find the spec for a given area, then read that spec directly.

| Area | Spec file | Requirement ID prefix | Implementation |
| --- | --- | --- | --- |
| Image loading and EXIF extraction | [exif.spec.md](../src/exif.spec.md) | `REQ-EXIF-*` | [exif.ts](../src/exif.ts) |
| Exporting and saving | [export.spec.md](../src/export.spec.md) | `REQ-EXPT-*` | [utils.ts](../src/utils.ts) |
| Canvas rendering and layout | [render.spec.md](../src/render.spec.md) | `REQ-REND-*` | [render.ts](../src/render.ts) |
| Presets and state management | [store.spec.md](../src/store.spec.md) | `REQ-STAT-*` | [store.tsx](../src/store.tsx) |
| User interface | [ui.spec.md](../src/ui.spec.md) | `REQ-UI-*` | [App.tsx](../src/App.tsx), [SidebarControls.tsx](../src/SidebarControls.tsx) |
| Architectural principles (system-level) | [constitution.md §2](memory/constitution.md) | `ARC-*` | [render.ts](../src/render.ts), [exif.ts](../src/exif.ts), [App.tsx](../src/App.tsx), [store.tsx](../src/store.tsx); guarded by [architecture.test.ts](../src/architecture.test.ts) |

## Conventions

*   Requirements are written in EARS patterns (ubiquitous, event-driven, state-driven, optional, unwanted-behavior) and grouped by pattern inside each spec.
*   Every requirement carries a unique ID in the form `[REQ-<AREA>-<NN>]`; architectural principles use `[ARC-<NN>]` and follow the same rules. Tests reference these IDs in their descriptions for traceability (see [test.prompt.md](prompts/test.prompt.md)).
*   To change behavior, edit the relevant `src/*.spec.md` first, then update [plan.md](plan.md) if the architecture changes, then implement (workflow and done-checklist: [prompts/implement.prompt.md](prompts/implement.prompt.md)).
*   When a new module gets its own spec, add a row to the table above.
*   Design rationale lives in [DESIGN_DECISIONS.md](../DESIGN_DECISIONS.md) as numbered `DR-NNN` records; each record lists the requirement IDs it serves, and the checker rejects a record that cites an undeclared ID.

## Commit message convention

A commit that changes anything under `src/` must reference at least one declared ID in bracketed form, in its subject or body: `[REQ-AREA-NN]` or `[ARC-NN]`. Suggested subject shape: `type(scope): summary [REQ-REND-06]`; put further IDs and the reasoning in the body.

*   Referenced IDs must be declared in a spec or the constitution at that commit or its parent (a commit that removes a requirement may still cite it).
*   A `src/` change with no requirement impact (formatting, comment wording, tooling) uses `[NO-REQ]` instead of an ID, with the reason in the body. The check lists these as warnings so they stay visible.
*   Enforced locally by the `commit-msg` hook ([.specify/hooks/commit-msg](hooks/commit-msg)) and in CI by the "Check Commit Messages" step, both through `npm run check-commit-ids` ([check-commit-ids.js](scripts/check-commit-ids.js)). CI checks every non-merge commit in the push or pull-request range; run it locally with `npm run check-commit-ids -- main..HEAD`.
*   Bug reports ask for the affected IDs ([.github/ISSUE_TEMPLATE/bug_report.yml](../.github/ISSUE_TEMPLATE/bug_report.yml)), so an issue → fix commit → requirement → test chain can be followed in either direction.

## Bug fixes

A bug is a behaviour the specification did not rule out, so the fix arrives as structure, not only as a patch. Before a fix merges, the same pull request (or push) must contain, for every ID the fix commit cites:

1.  **A spec change** — normally a new EARS Unwanted Behavior line in the relevant `src/*.spec.md`: `If <condition that produced the bug>, then the system shall <correct response>`. If the fix restores an existing requirement that was violated, edit that requirement so the failure condition is explicit.
2.  **A test whose title carries the ID** and reproduces the failure (fails before the fix, passes after).
3.  **The fix commit**, with a `fix:` / `fix(scope):` subject citing the ID.

Enforced by `check-commit-ids.js`: a `fix` commit that changes `src/` may not use `[NO-REQ]`, and for each cited ID the change set (push/PR range in CI; current branch plus staged changes in the `commit-msg` hook) must add a spec line and a test title carrying it. A spec change that is not an Unwanted Behavior line passes with a warning. Bug reports collect the affected IDs up front ([bug_report.yml](../.github/ISSUE_TEMPLATE/bug_report.yml)); the PR template repeats the checklist ([PULL_REQUEST_TEMPLATE.md](../.github/PULL_REQUEST_TEMPLATE.md)).

## Traceability convention

Every requirement ID links three places. `npm run verify-specs` runs the Vitest suite and fails when any link is missing; `npm run verify-specs -- --matrix` prints the full table, and `--results <file>` reuses an existing Vitest JSON report (`vitest run --reporter=json --outputFile=<file>`) instead of running the suite again.

| Link | Where | Form |
| --- | --- | --- |
| Spec | `src/<area>.spec.md` | `*   **[REQ-AREA-NN]** The system shall ...` |
| Implementation | `src/**/*.ts`, `src/**/*.tsx` (not tests) | `// [REQ-AREA-NN] short note` on the line directly above the function, block, or JSX element that satisfies it; `{/* [REQ-AREA-NN] ... */}` inside JSX |
| Test | `src/**/*.test.ts(x)` | `test('[REQ-AREA-NN] ...', ...)` or `describe('[REQ-AREA-NN] ...', ...)` — the test must run and pass; skipped, todo, and failing tests do not count, and an ID in a comment inside a test file does not count |

Rules for implementation tags:

*   Put the tag directly above the smallest unit that satisfies the requirement (a function, an `if` block, a JSX element). Do not tag whole files.
*   One line may carry several IDs when one block satisfies several requirements: `// [REQ-REND-11] [REQ-REND-12] [REQ-REND-05] Inner card ...`.
*   IDs come first, then an optional plain-language note. Keep the bracketed form exactly (`[REQ-REND-06]`) so the checker matches it.
*   A requirement may be tagged in more than one place when it is satisfied in more than one place (e.g. `[REQ-EXPT-03]` on the resolution-limit lookup and on the canvas bounds calculation).
*   When code moves, the tag moves with it. When a requirement is removed from a spec, remove its tags and tests in the same change; the checker rejects IDs that no spec declares, whether found in an implementation tag or in an executed test title.
*   Test coverage is judged from Vitest's executed results (JSON reporter), not from test-file text. Put the ID in the `test`/`it`/`describe` title; the checker only warns about IDs that appear elsewhere in a test file.
