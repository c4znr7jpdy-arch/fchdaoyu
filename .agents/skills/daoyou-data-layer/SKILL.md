---
name: daoyou-data-layer
description: Daoyou PostgreSQL、Drizzle schema/migrations、repositories、transactions、Better Auth schema、Redis 半持久数据、creation_products、condition 和 consumables.spec 持久化指南。Use when modifying database schema, migrations, repositories, persistence mappers, Drizzle queries, transactions, Better Auth tables, Redis-backed state, or durable game data models in this repo.
---

# Daoyou Data Layer

## Read First

- `drizzle.config.ts`
- `src/server/lib/drizzle/db.ts`
- `src/server/lib/drizzle/schema.ts`
- `src/server/lib/auth/schema.ts`
- `src/server/lib/auth/auth.ts`
- `src/server/lib/repositories`
- `src/server/lib/services/consumablePersistence.ts`
- `src/shared/engine/creation-v2/persistence`
- Relevant migrations under `drizzle/`

## Core Facts

- The Drizzle entrypoints are `src/server/lib/drizzle/db.ts` and `src/server/lib/drizzle/schema.ts`.
- Do not create parallel `src/db` or `src/server/db` layers.
- Drizzle Kit outputs to `drizzle/`, uses PostgreSQL, and filters `wanjiedaoyou_*` tables only.
- Better Auth tables are managed by Better Auth migrations, not the main Drizzle migration stream. Schema defaults to `BETTER_AUTH_DB_SCHEMA || "better_auth"`.
- `pgPool` sets PostgreSQL `search_path` to Better Auth schema plus `public`, max pool size 4, and reuses the Drizzle instance on `globalThis` outside production.
- Use `getExecutor(tx?)` and accept `DbExecutor` / `DbTransaction` when code may be called inside a transaction.
- Redis also stores important state: locks, market cache, world chat, rate limits, rankings, and temporary generation data.

## Durable Model Boundaries

- `cultivators.condition` is the current persistent state field. Do not restore old `persistent_state` or `persistent_statuses`.
- `consumables.spec` is the current consumable authority. Do not restore old `effects`, `use_spec`, or `details` columns.
- `wanjiedaoyou_creation_products` is the v2 creation product path for `skill | artifact | gongfa`.
- `product_model` stores slim JSON. `battleProjection` is removed before persistence and rebuilt during rehydrate.
- Equipped artifact state is `creation_products.is_equipped`; do not use `equipped_items` for new behavior.
- `battle_records_v2` is the current battle record path; `/api/battle-records/v2` and bet-battle settlement use it.
- Old tables such as `skills`, `artifacts`, `cultivation_techniques`, `equipped_items`, and `battle_records` still exist, but current runtime evidence shows new products use `creation_products` and battle logs use `battle_records_v2`.
- Legacy forget routes for old `skills` / `cultivation_techniques` delete old tables and do not handle new `creation_products`.
- `pre_heaven_fates.effects` is deprecated; current assembly reads `details.effects`.

## Workflow

1. Locate the owning model and current persistence path before changing schema.
2. For business tables, edit `src/server/lib/drizzle/schema.ts` and generate/apply Drizzle migrations.
3. For Better Auth schema changes, use Better Auth scripts (`auth:generate`, `auth:migrate`) instead of main Drizzle.
4. Preserve transaction propagation by passing `tx` through repositories/services.
5. For JSONB models, update runtime validators/parsers and tests together.
6. Check Redis keys when behavior is cache, lock, ranking, market, or world-chat related.

## Do Not

- Do not add Better Auth tables to the main `wanjiedaoyou_*` migration stream.
- Do not persist `battleProjection` directly.
- Do not duplicate v2 creation storage with new product tables.
- Do not add new runtime reads/writes to old `skills`, `artifacts`, `cultivation_techniques`, `equipped_items`, or `battle_records` without proving a migration/compatibility need.
- Do not treat projected runtime arrays such as `cultivator.skills`, `cultivations`, or `inventory.artifacts` as proof that old same-name tables are authoritative.
- Do not write DB code that opens a fresh executor inside an existing transaction.
- Do not delete legacy tables or fields only because they look unused; verify call chains first.

## Verify

- Persistence changes: run nearest repository/service tests.
- Schema changes: inspect generated migrations and `drizzle/meta/_journal.json`.
- Auth schema changes: run the relevant Better Auth migration/generation command in an environment with required auth env variables.
- JSONB contract changes: run parser/mapper tests and build.
