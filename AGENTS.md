# vicav-frontend

Vue 3/Nuxt application for the VICAV project.

## Development

```bash
pnpm install
pnpm build           # Build production server (also downloads openapi.json via generate:api-client → network required, not offline-reproducible)
pnpm run start:local # start production server
pnpm run start:preview # start the built app with `nuxt preview`
pnpm run dev        # Start dev server
pnpm run test       # Full gate: env dump (checkenv.mjs) → playwright install → parallel format:check, lint:*:check-no-cache, types:check, test:unit, test:e2e (requires .env.local)
pnpm run validate   # Format, lint, typecheck, unit tests
```

### Test Scripts

| Script                      | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `pnpm run test:unit`        | Vitest unit tests (with `--typecheck`)               |
| `pnpm run test:e2e`         | Playwright end-to-end tests                          |
| `pnpm run test:e2e:codegen` | Playwright codegen (record selectors)                |
| `pnpm run test:e2e:debug`   | Playwright in debug mode                             |
| `pnpm run test:e2e:ui`      | Playwright UI mode                                   |
| `pnpm run types:check`      | `nuxt typecheck`                                     |
| `pnpm run format:fix`       | Prettier write (applies the fixes of `format:check`) |
| `pnpm run start:preview`    | Serve the production build via `nuxt preview`        |

## Documentation

### Specs (Test Plans)

| File                                                                               | Purpose                                                                                                                        |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [specs/README.md](./specs/README.md)                                               | Purpose of the `specs/` directory (test plans)                                                                                 |
| [specs/menu-test-plan.md](./specs/menu-test-plan.md)                               | Comprehensive menu test plan for VICAV; covers desktop/mobile menus, dropdowns, keyboard nav, accessibility, window management |
| [specs/tunocent-menu-test-plan.md](./specs/tunocent-menu-test-plan.md)             | Test plan for TUNOCENT (Tunisia Arabic varieties) app; includes profiles, feature lists, sample texts, corpus search           |
| [specs/shawi-menu-test-plan.md](./specs/shawi-menu-test-plan.md)                   | Test plan for SHAWI (Shared Arabic World Information) app; covers menu, windows, footer, imprint page                          |
| [specs/text-window-display-test-plan.md](./specs/text-window-display-test-plan.md) | Test plan for VICAV first-load Text windows; asserts text is displayed (loading resolved) and correct textId content loaded    |
| [specs/prompt_examples/](./specs/prompt_examples/)                                 | The five prompts used to create, update and implement test plans                                                               |

### Docs (Architecture & Features)

| File                                                                           | Purpose                                                                                                                                                                      |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/windowTypes.md](./docs/windowTypes.md)                                   | Reference for all window `targetType` values and their params schemas (WMap, Text, Profile, DictQuery, etc.)                                                                 |
| [docs/tests.md](./docs/tests.md)                                               | E2E testing guide: backend switching via env var, test locations, selector patterns for menu components                                                                      |
| [docs/tei-metadata-loading-caching.md](./docs/tei-metadata-loading-caching.md) | Deep dive on TEI metadata loading pipeline: 3-layer caching (fetchWithETag → TanStack → SSR hydration), initialization, parsing, joins                                       |
| [docs/searchbar.md](./docs/searchbar.md)                                       | Searchbar component docs: tag/text modes, CodeMirror integration, Lucene/CQL syntax highlighting, TriggerMap concept                                                         |
| [docs/menu.md](./docs/menu.md)                                                 | Menu system overview: components, data flow, menu item types, test selectors                                                                                                 |
| [docs/dict-entry-component-mapping.md](./docs/dict-entry-component-mapping.md) | Dictionary entry rendering: API field to template mapping, entry shell, senses, examples, grammar items                                                                      |
| [docs/unusual-design-decisions.md](./docs/unusual-design-decisions.md)         | Catalogue of non-obvious architecture choices: backend-driven UI, URL-as-state, generated Zod schemas, 3 caching layers, dep overlaps                                        |
| [docs/openapi-spec-change-requests.md](./docs/openapi-spec-change-requests.md) | Open change requests against the upstream OpenAPI spec: per-CR evidence, proposed schema fragments, repro harness (implemented CRs are listed as closed)                     |
| [docs/openapi-patches/](./docs/openapi-patches/)                               | Human readable YAML patches that should be integrated into vicav-app-api. If necessary machine readable JSON can also live here. Removed when implemented in `vicav-app-api` |

# Maintenance Prompt

> Check `AGENTS.md` and the markdown documents linked there for accuracy and completeness. Keep the
> documents concise, table/list driven, and consistent with the existing format.
>
> Do not change application code.
>
> Write a task list to a markdown file to be executed task by task.
