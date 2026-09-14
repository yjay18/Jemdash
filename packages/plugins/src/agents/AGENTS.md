# Agent Provider Plugins

Read `agents/integrations/providers.md` before changing this directory. Read ACP and PTY guidance
when changing process launch, prompts, sessions, hooks, or ACP transforms.

- Treat registry IDs and order as persisted product data; do not rename or reorder casually.
- Keep provider-specific command, auth, config, MCP, trust, model, session, and hook behavior inside
  its plugin implementation.
- Drive renderer behavior through declared capabilities, not provider-ID checks.
- Preserve unrelated user configuration when installing or removing hooks and MCP entries.
- Update detection, PTY env passthrough, renderer assumptions, fixtures, snapshots, and metadata when
  a provider contract changes.
- Test missing CLI, signed-out auth, malformed protocol output, cancellation, resume/session behavior,
  and hook cleanup as applicable; then run plugin typecheck and tests.
