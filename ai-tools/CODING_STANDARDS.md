# Coding Standards

Personal JS/TS coding standards. These apply to every project regardless of framework or tooling.

## Testing

### Setup Pattern (KCD Style)
- Use a `setup()` function — never `beforeEach` for configuring handlers or mocks.
- `setup()` only accepts what varies between tests. It is always the happy path.
- Error scenarios get their own named function: `setupWithPayloadError()`, `setupWithDbUnavailable()`.
- Never put conditional logic (ternaries, if/else) inside setup to toggle between success/error mocks.

```ts
// Good
function setup() {
  server.use(http.get('/api/items', () => HttpResponse.json({ items: [] })));
  return render(<ItemList />);
}

function setupWithNetworkError() {
  server.use(http.get('/api/items', () => HttpResponse.error()));
  return render(<ItemList />);
}

// Bad — branching inside setup
function setup({ shouldFail = false } = {}) {
  server.use(http.get('/api/items', () =>
    shouldFail ? HttpResponse.error() : HttpResponse.json({ items: [] })
  ));
}
```

### TDD Workflow
- Write tests first, get explicit approval, then implement production code.
- Tests should not be biased by implementation — they encode the specification.

### HTTP Mocking
- Use MSW (Mock Service Worker) for all HTTP mocking. Never `vi.spyOn(globalThis, 'fetch')`.
- MSW intercepts at the network level — more realistic, less brittle than spying on fetch.

### User Interactions
- Always `@testing-library/user-event`, never `fireEvent`.
- Call `userEvent.setup()` once at module level.

### Environment Variables
- Use `vi.stubEnv('VAR_NAME', 'value')` inline in the test that needs it.
- Never use `process.env = { ...originalEnv }` with beforeEach/afterEach cleanup.

### Data Fetching Cache Isolation
- Wrap renders in `<SWRConfig value={{ provider: () => new Map() }}>` (or equivalent) to isolate cache per test.

### Toast Assertions
- Assert on the spy, not visible text — toast providers aren't mounted in unit tests.

### No Branching in Tests
- Tests must never contain `if`/`else`, ternaries, or `switch`. Test code is a linear sequence: setup, action, assertion.
- If an MSW handler needs different responses, use sequential `server.use()` overrides — not conditionals inside a handler.

### No `as any` in Tests
- Never use `as any` casts in test code. Use proper types, narrow structural types, or let mock inference flow naturally.

### Only Mock External Boundaries
- Never mock your own components or hooks. Only mock what you cannot control — external HTTP (MSW), external scripts, third-party APIs.
- If you mock `ComponentB` when testing `ComponentA`, a prop rename in B won't break the test. The real integration silently breaks.

## Code Style

### Modern JS/ES6+
- Always prefer destructuring, shorthand properties, `const`/`let`, arrow functions, template literals, optional chaining, nullish coalescing.
- This applies everywhere — production code, tests, migrations, utilities.

### Comments
- Do not add comments that restate what the code already says.
- Only comment when explaining **why** something non-obvious is done, documenting a constraint, or providing context that cannot be inferred from the code.

### YAGNI
- No shared abstractions until two real consumers exist.
- Three similar lines of code is better than a premature abstraction.

## Components (React)

### Declaration Style
- Declare components as `const Name: FC = () => {}`, not `function Name() {}`.
- For props: `const Name: FC<Props> = ({ prop1, prop2 }) => {}`.

```ts
// Good
const UserCard: FC<UserCardProps> = ({ name, email }) => {
  return <div>{name} — {email}</div>;
};

// Bad
function UserCard({ name, email }: UserCardProps) {
  return <div>{name} — {email}</div>;
}
```

### Hooks
- Hooks live in a `hooks/` subdirectory, one file per hook. Never a flat `hooks.ts`. No barrel `index.ts`.
- All hooks called before any early return — no exceptions.

### Side Effects
- `useEffect` for DOM side-effects — never `requestAnimationFrame`.

### Extraction
- Extract to a separate file when a component has its own refs, state, or lifecycle.

## Styling

- Tailwind first — inline `style={{}}` only as an absolute last resort.
- For CSS custom properties, use Tailwind arbitrary value syntax: `bg-[var(--theme-bg)]`, `text-[var(--theme-text)]`.

## Git Workflow

### Commits
- Format: `type(scope): Short description (TICKET-ID)`
- Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`
- One logical change per commit.

### Branches
- Naming: `feature/TICKET-ID-short-description`
- Branch off the correct base (feature branch if dependent, not always `main`).

### Rebase
- Always rebase to integrate upstream changes. Never create merge commits.
- `git fetch origin main && git rebase origin/main`
- Force-push with `--force-with-lease`, never `--force`.

### PR Descriptions
- Leave PR body empty (`--body ""`). Automation generates the description.

## Code Review & Collaboration

### Investigate Before Editing
- When encountering a bug, investigate and explain findings first. Do not immediately propose fixes.
- Wait for explicit approval before suggesting code changes.

### Never Commit Without Approval
- Always show staged files, diff summary, and proposed commit message first.
- Wait for explicit "yes" / "commit" / "push" before running `git commit` or `git push`.
- "Ready to commit" or "green light" for implementation does NOT imply commit approval.

### Never Drop Commits
- Never remove, drop, or squash commits from a branch without explicit permission.
- If a reviewer suggests splitting commits into another PR, surface the suggestion — never act on it autonomously.

## Anti-Patterns

Never do any of the following:

| Rule | Instead |
|------|---------|
| `beforeEach` for mock/handler setup | `setup()` function (KCD style) |
| `fireEvent` | `@testing-library/user-event` |
| `vi.spyOn(globalThis, 'fetch')` | MSW `http.get`/`http.post` handlers |
| `process.env = { ...original }` | `vi.stubEnv('VAR', 'value')` |
| `as any` in tests | Proper types or let mock inference flow |
| Mock own components/hooks | Only mock external boundaries |
| `if`/`else`/ternary in tests | Separate test cases |
| Ternary in `setup()` | Named `setupWithX()` functions |
| `function Component()` | `const Component: FC = () => {}` |
| `style={{}}` | Tailwind utility classes |
| `requestAnimationFrame` | `useEffect` |
| Flat `hooks.ts` | `hooks/` directory, one file per hook |
| `git merge origin/main` | `git rebase origin/main` |
| `git push --force` | `git push --force-with-lease` |
| Comments restating code | Only comment the "why" |
| Commit without approval | Show diff, wait for explicit "yes" |
| Drop commits without approval | Surface the suggestion, let user decide |
| Propose fixes without investigation | Investigate, discuss, then edit |
| Premature abstractions | YAGNI — wait for two real consumers |
