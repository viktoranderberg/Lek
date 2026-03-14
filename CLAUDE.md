# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working in this repository.

## Project Overview

**Name:** Lek
**Status:** Early-stage / scaffold — no application code exists yet.

The repository currently contains only a `README.md` placeholder. The technology stack, directory layout, and development workflows are yet to be established.

## Current Repository Structure

```
Lek/
├── CLAUDE.md       # This file — AI assistant guidance
└── README.md       # Project title placeholder
```

## Git Workflow

### Branches
| Branch | Purpose |
|--------|---------|
| `main` | Primary integration branch |
| `master` | Legacy default branch (kept for compatibility) |
| `claude/*` | AI-generated feature/task branches |

### Branch Naming Convention
- Human features: `<username>/<short-description>`
- AI-generated work: `claude/<description>-<session-id>`

### Commit Conventions
- Write concise, imperative-mood commit messages (e.g. "Add authentication module", not "Added auth")
- Reference issue numbers when applicable: `Fix login redirect (#42)`
- Keep commits focused and atomic

### Pushing Changes
Always push with upstream tracking:
```bash
git push -u origin <branch-name>
```

## Development Setup

> No build system or runtime is configured yet. Update this section when the stack is chosen.

Suggested first steps when starting development:
1. Choose a language/framework
2. Initialize a package manager or build tool
3. Add a `.gitignore` appropriate for the chosen stack
4. Define `lint`, `test`, and `build` scripts
5. Update this file with actual commands

## Code Conventions

No code exists yet — conventions should be documented here once the stack is decided. Common things to capture:

- **Formatting:** (e.g. Prettier, Black, gofmt)
- **Linting:** (e.g. ESLint, Ruff, golangci-lint)
- **Type system:** (e.g. TypeScript strict mode, mypy, typed Python)
- **Testing approach:** unit tests, integration tests, test file naming

## Testing

No test framework is configured yet. Update this section once tests are added, including:
- How to run the full test suite
- How to run a single test file or test case
- Where test fixtures and mocks live

## Deployment / CI

No CI/CD pipelines are configured. When added (e.g. GitHub Actions), document:
- Trigger conditions (push, PR, tag)
- Required secrets/environment variables
- Deployment targets

## Notes for AI Assistants

- This is an **empty scaffold** — do not assume any framework, build tool, or file exists unless you have verified it.
- Before suggesting code changes, confirm the target language and framework with the user.
- When adding new files, also update this `CLAUDE.md` to reflect the new structure.
- Prefer editing existing files over creating new ones unless a new file is clearly necessary.
- Avoid over-engineering: keep initial implementations simple and focused on what is explicitly requested.
