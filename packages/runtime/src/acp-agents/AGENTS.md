# ACP Runtime

Read `agents/architecture/acp-runtime.md` before changing this directory.

- Keep API contracts, shared models, reducer vocabulary, errors, and transport ports in
  `packages/core/src/acp/`; implement runtime lifecycle and session behavior here.
- Keep cross-session ownership in `SessionManager` and per-session projection, effects, permissions,
  prompt queues, and quiescence in `SessionCell`.
- Preserve state-machine legality, deterministic cleanup, cancellation, process-exit handling,
  terminal disposal, and provider session-ID routing.
- Keep provider quirks in `packages/plugins/` and host-specific Electron/workspace-server adaptation
  at host edges.
- Treat public model or contract changes as workspace-server protocol changes.
- Run the closest machine, cell, manager, connection, and terminal tests, then runtime typecheck.
