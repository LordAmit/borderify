## Requirement IDs

<!-- Every src/ change cites the IDs it serves, e.g. [REQ-REND-06] [ARC-02]. -->

## Bug fix?

If any commit here is a `fix`, CI requires, in this PR:

- [ ] A spec line carrying each cited ID — usually an EARS Unwanted Behavior line: `If <condition>, then the system shall <response>` — in the relevant `src/*.spec.md` (or the constitution for `[ARC-…]`)
- [ ] A test whose title carries that ID and reproduces the failure
- [ ] The fix commit itself, citing the ID

Convention: `.specify/specify.md` → "Commit message convention" and "Bug fixes".
