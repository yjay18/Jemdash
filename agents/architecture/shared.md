# Shared Modules

## Main Shared Areas

- Agent/provider DTOs:
  - `src/shared/core/agents/agent-payload.ts`
  - provider metadata and capabilities are sourced from `packages/plugins/src/agents/registry.ts`
- IPC primitives:
  - `src/shared/lib/ipc/rpc.ts` — typed RPC router, controller, and client
  - `src/shared/lib/ipc/events.ts` — typed event emitter
- Typed event definitions:
  - `src/shared/events/` — cross-cutting app, browser, GitHub, resource, and update events
  - `src/shared/core/` — domain-local agent, automation, conversation, filesystem, Git, preview,
    project, PTY, pull-request, SSH, task, and terminal events
- MCP types:
  - `src/shared/core/mcp/`
- Skills types and validation:
  - `src/shared/core/skills/`
- Domain type modules:
  - `src/shared/core/` groups domain types by feature; cross-cutting compatibility types remain at
    the `src/shared/` root
- PTY helpers:
  - `src/shared/core/pty/ptySessionId.ts` (provider-aware PTY ID parsing lives in main under
    `src/main/core/pty/`)
- App settings types:
  - `src/shared/core/app-settings.ts`

## Path Aliases

All aliases are defined in a single `tsconfig.json` and mirrored in `electron.vite.config.ts`:

| Alias | Resolves to |
| --- | --- |
| `@/*` | `src/*` |
| `@renderer/*` | `src/renderer/*` |
| `@main/*` | `src/main/*` |
| `@shared/*` | `src/shared/*` |
| `@root/*` | `./*` |

Aliases are resolved at build time by electron-vite. No runtime monkey-patching is needed.

## Provider Metadata Rules

When adding a provider:

1. add or update its plugin in `packages/plugins/src/agents/impl/` and register it in
   `packages/plugins/src/agents/registry.ts`
2. add any required env passthrough in `src/main/core/pty/pty-env.ts`
3. add or update hook/plugin installation in `src/main/core/agent-hooks/` if the provider
   supports explicit events
4. update renderer surfaces that consume agent metadata from `rpc.agents.*`
5. add tests for non-standard spawn or detection behavior
