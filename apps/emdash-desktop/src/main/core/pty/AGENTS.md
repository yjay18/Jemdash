# PTY and Session Runtime

Read `agents/risky-areas/pty.md` before changing this directory. Also read the SSH risk page for any
remote or shell-wrapped path.

- Preserve the env allowlist in `pty-env.ts`; never pass the ambient environment wholesale.
- Use existing spawn, shell escaping, path validation, and exit-signal helpers.
- Validate direct and shell-wrapped startup, local and SSH behavior when applicable, resize,
  cancellation, process exit, tmux lifecycle, and cleanup.
- Keep provider-specific flags and resume behavior in provider plugins rather than generic PTY code.
- Do not infer agent status from terminal output; status comes from explicit provider hooks.
- Run the closest PTY and terminal tests, then the desktop typecheck and test target.
