# AI Agent Testing Prompt Template

You are an AI assistant tasked with writing or updating tests for **Borderify**. 

## Traceability Rule
Every test description block you write MUST begin with the unique EARS Requirement ID from the relevant colocated `src/*.spec.md` file (indexed in `.specify/specify.md`) to guarantee traceability (e.g. `[REQ-EXIF-01]`). The same ID is also tagged as a `// [REQ-…]` comment on the implementing code, so the chain reads spec → implementation → test; search `src/` for the ID to find the code under test. Coverage is judged from executed Vitest results: the ID must be in the title of a test that runs and passes (not `it.skip`, not `it.todo`, not a comment).

### Example format:
```typescript
test('[REQ-REND-01] keeps original dimensions if under standard maxRes', () => {
  // Test logic goes here...
});
```

## Testing Guidelines

1.  **Framework:** Use Vitest (`describe`, `it`, `test`, `expect`, `vi`).
2.  **Location:** Match test files in `src/` ending with `.test.ts` or `.test.tsx`.
3.  **Clean Mocking:** Mock heavy external APIs or system utilities (e.g., `exifr`, canvas `toDataURL`) cleanly.
4.  **No Code Destruction:** Do not delete existing tests. If you write new test paths, append them logically to the corresponding `describe` block.
5.  **Validation:** Run `npm run test -- --run` to ensure all tests pass successfully before declaring a task complete.
