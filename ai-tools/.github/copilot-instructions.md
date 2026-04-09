# GitHub Copilot Instructions

Follow the coding standards in `ai-tools/CODING_STANDARDS.md` for all suggestions.

## Testing
- Use a `setup()` function — never `beforeEach` for configuring handlers or mocks.
- Error scenarios use named `setupWithX()` functions — never ternaries or branching in setup.
- Use MSW for HTTP mocking — never `vi.spyOn(globalThis, 'fetch')`.
- Use `@testing-library/user-event` — never `fireEvent`.
- Use `vi.stubEnv()` — never `process.env` reassignment.
- No `as any` casts in tests.
- No `if`/`else`/ternary in test code — each test is a linear sequence.
- Only mock external boundaries — never mock own components or hooks.

## Components
- `const Name: FC<Props> = ({ prop }) => {}` — never function declarations.
- Hooks in `hooks/` subdirectory, one file per hook.
- All hooks called before any early return.
- `useEffect` for side-effects — never `requestAnimationFrame`.

## Code Style
- Modern ES6+: destructuring, arrow functions, optional chaining, nullish coalescing.
- Tailwind classes — never inline `style={{}}`.
- Comments only when explaining "why" — never restate what code says.
- YAGNI — no abstractions until two real consumers exist.

## Git
- Commit format: `type(scope): Short description (TICKET-ID)`
- Always rebase, never merge. `--force-with-lease`, never `--force`.
