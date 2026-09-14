# Electron ACP Adapter

Read `agents/architecture/acp-runtime.md` before changing this directory. Read the PTY and SSH risk
pages before changing process hosting, terminals, shell construction, or remote transport.

- Keep ACP contracts and models in `packages/core/src/acp/` and runtime session behavior in
  `packages/runtime/src/acp-agents/`; this directory adapts them to Electron RPC and events.
- Route spawning through process-host abstractions. Never concatenate shell commands or bypass
  quoting, env allowlists, or path validation.
- Preserve initialize, authentication, new/load session, prompt, cancellation, exit, timeout,
  disposal, and ownership ordering.
- Emit serializable normalized events with stable IDs and sanitized errors.
- Never reuse one provider's native session ID during a cross-provider handoff.
- Run the closest adapter and transport tests, then the desktop typecheck and test target.
