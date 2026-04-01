# Contributing to VICAV

This document was AI generated April 2026 and proof read.

## Prerequisites

- Node.js 24.x
- pnpm 10.x

## Setup

```bash
cp .env.example .env.local  # configure API base URL and other vars
pnpm install                # installs deps, runs nuxt prepare, generates API client
```

## Development

```bash
pnpm dev  # http://127.0.0.1:3000
```

## Code Quality

All checks must pass before merging:

```bash
pnpm validate        # format + lint + types + unit tests
pnpm format:fix      # auto-fix formatting
pnpm lint:fix        # auto-fix lint errors
```

## Project Architecture

- **Window-driven MDI**: All content opens in WinBox windows. Window state is serialized in URL.
- **Composable-first**: Business logic in `app/composables/use-*.ts`. Components are thin
  dispatchers.
- **TanStack Query**: All API calls use TanStack Query with 15-minute stale time.
- **Client-only**: Maps and window manager are client-only (`.client.vue` suffix).
- **Zod schemas**: Window types defined in `app/types/global.ts` as discriminated unions.

## Adding a New Window Type

1. Add Zod schema to `app/types/global.ts` keyed on `targetType`
2. Create `*-window-content.vue` component in `app/components/`
3. Add to `window-content.vue` dispatch logic
4. Use existing composables or create new ones for data fetching

## Testing

- **Unit**: Co-located in `app/utils/*.test.ts` or `app/composables/*.test.ts`
- **E2E**: `e2e/pages/{vicav,shawi,tunocent,wibarab}/` — tests run against real backends

```bash
pnpm test:unit          # vitest
pnpm test:e2e           # playwright headless
pnpm test:e2e:ui        # playwright interactive
```

## Git Workflow

1. Create feature branch from `develop`
2. Make changes and ensure `pnpm validate` passes
3. Push and create PR to `develop`
4. After review, merge to `main` and tag version

## Commit Messages

Conventional commits preferred but not enforced:

- `feat: add new window type`
- `fix: resolve searchbar filter issue`
- `docs: update API usage guide`
