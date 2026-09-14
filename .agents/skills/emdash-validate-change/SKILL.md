---
name: emdash-validate-change
description: Select and run safe, change-scoped validation for the Emdash monorepo and maintain its product roadmap. Use after implementing or reviewing Emdash changes, before handoff or a pull request, when completing a feature or roadmap item, when deciding which focused tests and Nx checks apply, or when validating changes in high-risk ACP, PTY, SSH, database, provider, workspace-server, or updater areas.
---

# Validate an Emdash Change

Validate the smallest relevant surface first, then broaden checks in proportion to the change.

## Establish scope

1. Work from the repository root and read the applicable `AGENTS.md` instruction chain.
2. For feature work, read `ROADMAP.md` and identify the checklist item that owns the outcome. Add a
   concise unchecked item only when the user approved a feature not represented there.
3. Read the matching `agents/` topic page, including the risky-area page for ACP process hosting,
   PTY, SSH, database, or updater changes.
4. Run `git status --short` and inspect the relevant diff. Treat unrelated changes as user-owned.
5. Confirm `node --version` matches `.nvmrc` and `pnpm --version` matches the root
   `packageManager`. Stop and report a toolchain mismatch instead of changing lockfiles or
   dependencies with the wrong versions.

## Choose checks

- Documentation-only agent guidance: run `pnpm run docs:check`. No app build is required.
- A focused bug fix: run the closest test file first with the owning package's Vitest command.
- A package change: run that Nx project's `format:check`, `lint`, `typecheck`, and `test` targets.
- A shared contract change: also validate every direct consumer or use
  `pnpm nx affected -t format:check lint typecheck test` with an appropriate base and head.
- Database schema or migration work: additionally run the desktop package's `db:fixtures` and
  `test:migrations` scripts.
- ACP, provider, PTY, SSH, process-spawn, or workspace-server changes: run focused lifecycle,
  failure-path, cancellation, quoting, and cleanup tests before the owning project gate.
- Broad or cross-cutting work: finish with `pnpm run format:check`, `pnpm run lint`,
  `pnpm run typecheck`, and `pnpm run test` when the scope justifies the full merge gate.

Use `pnpm nx show projects` and `pnpm nx show project <project>` when project ownership or target
availability is unclear. Do not assume every project offers an app-specific target.

## Preserve validation integrity

- Prefer `format:check` during validation. If formatting fails, format only files owned by the
  current task and re-run the check.
- Do not reset, stash, delete, or rewrite unrelated files to make checks pass.
- Do not weaken tests, lint rules, type safety, security validation, shell escaping, or env
  allowlists.
- Diagnose whether a failure is caused by the current diff, pre-existing worktree changes, missing
  native tooling, or the environment. Do not claim a pass for a command that did not run.
- For persistent dev commands such as `pnpm run dev`, verify startup explicitly and terminate the
  process; do not wait for it to exit as if it were a test.

## Maintain the roadmap

Before handoff, compare the result with the matching `ROADMAP.md` acceptance criteria.

- If the complete outcome passed its automated and manual acceptance, change `[ ]` to `[x]`, append
  `(completed YYYY-MM-DD)`, and add an `Evidence` bullet with exact tests and manual checks.
- If any required behavior, failure path, platform, or manual acceptance remains, leave the item
  unchecked and record the next concrete gap without presenting the feature as complete.
- Keep completed entries in place. Do not rewrite app vision, reorder priorities, or broaden scope
  unless the user explicitly approves that product decision.
- A bug fix, refactor, or documentation task does not require a new roadmap item unless it creates,
  completes, removes, or materially changes a product outcome.

## Report the result

List the exact commands run and whether each passed, failed, or was blocked. Summarize any remaining
failure with its likely ownership and call out unrun checks, manual coverage gaps, and high-risk
areas touched. State which roadmap item was updated or why no roadmap update applied.
