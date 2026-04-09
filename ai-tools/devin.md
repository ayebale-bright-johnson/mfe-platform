# Devin Instructions

You MUST follow the coding standards defined in this repository. Before writing any code, read and internalize the rules in `ai-tools/CODING_STANDARDS.md`.

## Critical Rules

- **TDD**: Write tests first, get approval, then implement.
- **Never commit or push** without explicit user approval. Show the diff first.
- **Never mock own code** — only mock external boundaries (HTTP via MSW, third-party APIs).
- **No `as any`** in tests. No `beforeEach`. No `fireEvent`. No branching in test code.
- **Components**: `const Name: FC = () => {}` style, never function declarations.
- **Git**: Rebase only, never merge. `--force-with-lease`, never `--force`. One logical change per commit.
- **Investigate before editing** — when hitting a bug, explain findings first. Wait for explicit go-ahead before writing fixes.

## Full Standards

See [`ai-tools/CODING_STANDARDS.md`](./CODING_STANDARDS.md) for the complete rule set with examples.
