# vicav-frontend

Vue 3/Nuxt application for the VICAV project.

## Development

```bash
pnpm install
pnpm build           # Build production server
pnpm run start:local # start production server
pnpm run dev        # Start dev server
pnpm run test       # Run all tests
pnpm run validate   # Format, lint, typecheck, unit tests
```

## Documentation

### Specs (Test Plans)

| File                                                                   | Purpose                                                                                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [specs/menu-test-plan.md](./specs/menu-test-plan.md)                   | Comprehensive menu test plan for VICAV; covers desktop/mobile menus, dropdowns, keyboard nav, accessibility, window management |
| [specs/tunocent-menu-test-plan.md](./specs/tunocent-menu-test-plan.md) | Test plan for TUNOCENT (Tunisia Arabic varieties) app; includes profiles, feature lists, sample texts, corpus search           |
| [specs/shawi-menu-test-plan.md](./specs/shawi-menu-test-plan.md)       | Test plan for SHAWI (Shared Arabic World Information) app; covers menu, windows, footer, imprint page                          |

### Docs (Architecture & Features)

| File                                                                           | Purpose                                                                                                                                |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/windowTypes.md](./docs/windowTypes.md)                                   | Reference for all window `targetType` values and their params schemas (WMap, Text, Profile, DictQuery, etc.)                           |
| [docs/tests.md](./docs/tests.md)                                               | E2E testing guide: backend switching via env var, test locations, selector patterns for menu components                                |
| [docs/tei-metadata-loading-caching.md](./docs/tei-metadata-loading-caching.md) | Deep dive on TEI metadata loading pipeline: 3-layer caching (fetchWithETag → TanStack → SSR hydration), initialization, parsing, joins |
| [docs/searchbar.md](./docs/searchbar.md)                                       | Searchbar component docs: tag/text modes, CodeMirror integration, Lucene/CQL syntax highlighting, TriggerMap concept                   |
| [docs/menu.md](./docs/menu.md)                                                 | Menu system overview: components, data flow, menu item types, test selectors                                                           |
| [docs/dict-entry-component-mapping.md](./docs/dict-entry-component-mapping.md) | Dictionary entry rendering: API field to template mapping, entry shell, senses, examples, grammar items                                |
