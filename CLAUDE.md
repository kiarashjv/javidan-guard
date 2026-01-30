# Claude Code Working Agreement

## Testing

- Always run tests before committing: `pnpm test --run`
- Ensure all tests pass before creating commits
- Write focused, pragmatic tests that verify critical functionality
- Prefer simple, readable tests over complex mocking

## Code Quality

- **ALWAYS** run `pnpm check` before committing (TypeScript type checking)
- **ALWAYS** run `pnpm lint` before committing (ESLint)
- Both must pass with zero errors before creating any commit
- Do not bypass these checks or use `@ts-ignore` without justification

## Commit Messages

- Use simple, imperative mood commit messages
- Examples: "Add testing infrastructure", "Fix rate limiting bug", "Update validation schemas"
- Keep messages concise and descriptive
- Include Co-Authored-By when appropriate:
  ```
  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```

## Documentation

- Update relevant documentation when making significant changes
- Keep docs in sync with implementation
- Documentation lives in `/docs` folder
- Key docs: `TESTING_STRATEGY.md`, `DATA_MODEL_RESEARCH.md`, `SCHEMA_OPTIMIZATION_PLAN.md`

## Pre-Commit Checklist

Before every commit, verify:
1. [ ] All tests pass: `pnpm test --run`
2. [ ] Type check passes: `pnpm check`
3. [ ] Lint passes: `pnpm lint`
4. [ ] Relevant documentation updated
5. [ ] Commit message is clear and concise

## Reference

See also: [AGENTS.md](./AGENTS.md) for general engineering principles and project structure guidelines.
