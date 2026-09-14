# Jemdash Product Roadmap

This tracked checklist is the source of truth for product direction and milestone completion. Keep
implementation notes in task-specific plans; keep this file concise, outcome-focused, and current.

## App Vision

Jemdash should be a reliable, local-first, chat-first desktop app for coordinating coding agents
without taking ownership away from the user.

- Open a repository and start a coding conversation immediately.
- Use existing Claude Code, ChatGPT/Codex, Gemini CLI, and supported local-provider authentication.
- Switch providers between turns while preserving one understandable transcript.
- Preserve provider-specific model, effort, approval, and permission settings.
- Show commands, file operations, diffs, permissions, plans, and terminal output as they happen.
- Make worktree isolation an explicit option rather than a prerequisite for every conversation.
- Support local and SSH workspaces without crossing host, credential, or process boundaries.
- Keep code, chats, credentials, and runtime state local except where the selected provider requires
  its own service.

## Checklist Rules

- `[ ]` means planned, in progress, or not yet verified.
- `[x]` means the complete outcome and its acceptance criteria were verified.
- Complete a checkbox in the same change that finishes the feature. Append
  `(completed YYYY-MM-DD)` and add an `Evidence` bullet naming the tests and manual acceptance run.
- Leave partially implemented or locally present behavior unchecked; update its note with the next
  concrete gap instead.
- Add newly approved features to the appropriate milestone before or alongside implementation.
- Do not reorder priorities, expand product scope, or mark an item complete without user approval or
  clear acceptance evidence.
- Keep completed items in place so the roadmap remains a durable history.

## Current Foundation

The repository already contains Electron local/SSH workspaces, Git worktree task isolation, provider
plugins, ACP and PTY runtimes, typed RPC/events, transcript and diff UI, integrations, and release
packaging. These are foundations, not proof that the milestones below are complete.

## Roadmap

Items are ordered by intended delivery sequence. Unless the user changes priorities, the first
unchecked item is the next upcoming task.

### Milestone 0: Trustworthy Baseline

- [ ] **RM-001 — Establish a reproducible provider and conversation baseline**
  - Outcome: classify inherited failures and local deviations against a pinned upstream snapshot.
  - Done when: Claude and Codex detection, authentication, session start, prompting, cancellation,
    restart, and sanitized failure behavior have recorded focused test and manual results.
- [ ] **RM-002 — Restore reliable Claude subscription authentication**
  - Outcome: users signed into the official Claude CLI can start and resume ACP conversations.
  - Done when: signed-in, signed-out, expired, missing-CLI, startup-failure, and retry paths pass
    focused tests and a real subscription smoke test without reading or logging credentials.
  - Next gap: complete the signed-in, expired-session, missing-CLI/startup-failure, retry, and real
    subscription smoke-test matrix; automated auth/URL/code-fallback tests and a credential-safe
    signed-out check currently pass.

### Milestone 1: Chat-First Workflow

- [ ] **RM-003 — Make the existing checkout the default conversation workspace**
  - Outcome: opening a repository and sending the first prompt does not require a branch or worktree.
  - Done when: existing-checkout creation, optional isolated worktrees, failure recovery, restart,
    and branch-safety messaging pass automated and manual acceptance.
- [ ] **RM-004 — Make Claude and Codex handoff reliable**
  - Outcome: users can switch providers between turns without losing transcript context or drafts.
  - Done when: bounded context transfer, per-provider settings, active-turn guards, atomic failure,
    transcript boundaries, and restart hydration pass tests plus a round trip in both directions.

### Milestone 2: Provider Expansion and Local Runtime

- [ ] **RM-005 — Add Gemini CLI as a native ACP provider**
  - Outcome: Gemini personal OAuth works through the official CLI without requiring an API key.
  - Done when: detection, auth, ACP lifecycle, models, permissions, tools, cancellation, resume,
    handoff, local/SSH availability, and secret-safety acceptance pass.
- [ ] **RM-006 — Harden managed Ollama lifecycle**
  - Outcome: Jemdash safely reuses external Ollama or starts and stops only a process it owns.
  - Done when: readiness, concurrent start, ownership, crash, retry, shutdown, endpoint safety, model
    discovery, pull cancellation, and local/SSH routing tests pass.
- [ ] **RM-007 — Select and implement an Ollama coding-agent bridge**
  - Outcome: supported local models provide coding tools through an explicitly documented ACP path.
  - Done when: an ADR selects the bridge and a supported model completes tools, permissions, edits,
    output streaming, and cancellation without silently installing or mislabeling dependencies.

### Milestone 3: Activity, Reliability, and Release Readiness

- [ ] **RM-008 — Render live commands, file activity, diffs, permissions, and terminal output**
  - Outcome: structured activity from every supported provider remains responsive and understandable.
  - Done when: stable streaming IDs, bounded output, file links, permission blocking, tab switching,
    restart hydration, provider fixtures, and a 10,000-line output stress case pass.
- [ ] **RM-009 — Standardize provider diagnostics and recovery UX**
  - Outcome: missing, signed-out, expired, incompatible, crashed, and retrying states are distinct and
    actionable without exposing secrets.
  - Done when: diagnostics report safe executable/version/capability context and bounded recovery
    works across supported providers and workspace hosts.
- [ ] **RM-010 — Complete end-to-end and packaged-app release validation**
  - Outcome: the milestone works in clean and dirty repositories, optional worktrees, supported
    subscription providers, local runtime modes, restart/failure cases, and packaged builds.
  - Done when: focused checks, the full merge gate, manual provider matrix, packaged smoke tests,
    secret-redaction review, and upstream reconciliation all pass with recorded evidence.
