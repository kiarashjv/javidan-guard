# AI Working Agreement

## Engineering Principles
- Follow OOP principles where appropriate; use composition over inheritance.
- Keep a clear, consistent folder and file structure that matches the implementation plan.
- Keep files focused and modular; avoid overloading single files with too much code while also avoiding over-engineering.
- Prefer the latest stable package versions; avoid legacy patterns.
- Never use TypeScript `any`.

## Code Quality
- Favor small, focused modules with explicit types.
- Use descriptive names and keep functions pure when possible.
- Avoid hidden side effects; document non-obvious behavior.
- Do not ignore TypeScript or lint errors.
- Always run `pnpm check` and `pnpm lint` before reporting completion.

## Project Structure
- App Router is the source of truth for routes.
- Localization files live in `src/messages`.
- Shared configuration lives in `src/i18n` and `src/lib`.

## Safety
- Preserve data integrity: never delete, only supersede.
- Do not add tracking or PII collection.
