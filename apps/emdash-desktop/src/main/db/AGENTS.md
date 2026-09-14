# Database

Read `agents/risky-areas/database.md` and the versioned-schema convention before changing this
directory.

- Never hand-edit numbered migrations or `drizzle/meta/`; change the schema and use
  `pnpm run db:generate` from `apps/emdash-desktop/`.
- Use `EMDASH_DB_FILE` with a scratch database for development and migration experiments.
- Preserve versioned JSON upgrade chains and use explicit parsing for raw-SQL snapshot columns.
- Keep schema changes, generated migration output, fixtures, and migration tests together.
- Run focused DB tests, `pnpm run db:fixtures`, `pnpm run test:migrations`, and desktop typecheck.
- Do not run `db:reset` unless the user explicitly authorizes deleting the development databases.
