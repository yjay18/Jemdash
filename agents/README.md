# Agent Docs

This directory is the system of record for agent-facing repo guidance. Keep topic pages small, specific, and mechanically checkable where possible.

## Recommended Reading Order

1. `quickstart.md`
2. root `ROADMAP.md` for feature work
3. `architecture/overview.md`
4. the task-specific page for the area you are changing

## Directory Layout

- `architecture/`
  - system structure and major code ownership boundaries
  - [`workspace-server.md`](architecture/workspace-server.md) — protocol versioning, negotiation handshake, and behavior-change rules for the remote workspace daemon
  - [`acp-runtime.md`](architecture/acp-runtime.md) — ACP runtime, session manager, connection pool, cells, live models, and API contract ownership
- `workflows/`
  - task-oriented procedures like testing, worktrees, remote development, and Nx task orchestration
- `integrations/`
  - provider, MCP, and external service guidance
- `risky-areas/`
  - places where incorrect changes are expensive
- `conventions/`
  - coding contracts and repo rules

## Maintenance Rules

- Prefer one page per concrete topic.
- Avoid volatile counts unless you can verify them cheaply.
- Link to the source-of-truth file paths.
- Update the smallest relevant page instead of expanding `AGENTS.md`.
- Run `pnpm run docs:check` after changing agent documentation or repository-scoped skills.
- Keep product vision and feature completion in root `ROADMAP.md`; keep temporary implementation
  plans and milestone details out of architecture pages.

## Repository Skills

- `emdash-validate-change` in `.agents/skills/` selects focused checks and broadens validation in
  proportion to the files and risks touched.
