# SSH Runtime

Read `agents/risky-areas/ssh.md` and `agents/workflows/remote-development.md` before changing this
directory. Read the PTY risk page when commands or terminals cross that boundary.

- Treat credentials, host verification, remote paths, and command construction as
  security-sensitive.
- Use shared escaping, validation, credential, and connection helpers; do not interpolate untrusted
  values into shell strings.
- Preserve connection cleanup, retry/error typing, cancellation, and redaction.
- Validate both connection setup and command execution, including malformed and hostile inputs.
- Run the closest SSH tests and any affected PTY or workspace-server tests, then desktop typecheck.
