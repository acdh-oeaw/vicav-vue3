# VICAV frontend

VICAV (Vienna Corpus of Arabic Varieties) is a Vue 3/Nuxt 4 single-page application. A single
codebase serves four distinct app instances — **VICAV**, **SHAWI**, **TUNOCENT**, and **Wibarab** —
selected at runtime by the backend URL. Content is presented in MDI windows (WinBox) whose state is
serialized in the URL.

## Tech stack

| Category      | Technology                                                                        |
| ------------- | --------------------------------------------------------------------------------- |
| Framework     | Nuxt 4, Vue 3                                                                     |
| Language      | TypeScript                                                                        |
| Styling       | Tailwind CSS 4                                                                    |
| State         | Pinia, TanStack Query                                                             |
| UI            | WinBox (window management), MapLibre GL / Leaflet (maps), CodeMirror (search bar) |
| Testing       | Playwright (E2E), Vitest (unit)                                                   |
| Observability | OpenTelemetry                                                                     |
| Validation    | Zod (runtime validation from OpenAPI spec)                                        |

## Prerequisites

- [Node.js 24.x](https://nodejs.org/en/download)
- [pnpm 10.x](https://pnpm.io/installation) (enabled via corepack: `corepack enable`)

## Getting started

```bash
# Copy the example environment file and configure your local variables
cp .env.example .env.local

# Install dependencies. This runs `nuxt prepare` and generates the API client
pnpm install

# The install process also:
#   1. Downloads openapi.json from acdh-oeaw/vicav-app-api@master
#   2. Generates a TypeScript API client in app/lib/api-client/ (gitignored)
#   3. Bundles app/assets/openapi.json for runtime schema validation (gitignored)

# Start the development server
pnpm run dev
```

Open http://127.0.0.1:3000 in your browser.

## Environment variables

Copy `.env.example` to `.env.local` and adjust as needed.

| Variable                      | Description                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE_URL`    | **Required.** Base URL of the backend API. Determines which app (VICAV, SHAWI, TUNOCENT, Wibarab) is displayed. |
| `NUXT_PUBLIC_APP_BASE_URL`    | Public URL of this frontend (default: `http://localhost:3000`).                                                 |
| `NUXT_PUBLIC_REDMINE_ID`      | Redmine project ID for the imprint service.                                                                     |
| `NUXT_PUBLIC_MATOMO_BASE_URL` | Matomo analytics base URL (optional).                                                                           |
| `NUXT_PUBLIC_MATOMO_ID`       | Matomo site ID (optional).                                                                                      |
| `NUXT_PUBLIC_API_USER`        | API username for authenticated endpoints (optional).                                                            |
| `NUXT_PUBLIC_API_PASS`        | API password for authenticated endpoints (optional).                                                            |
| `BOTS`                        | Set to `enabled` to allow web crawlers; defaults to `disabled`.                                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OpenTelemetry collector endpoint (e.g., `http://127.0.0.1:4317`).                                               |

### Backend URLs

Set `NUXT_PUBLIC_API_BASE_URL` to one of the following to switch apps:

| App      | Backend URL                                                            |
| -------- | ---------------------------------------------------------------------- |
| VICAV    | `https://vicav-dev.acdh.oeaw.ac.at` or `https://vicav.acdh.oeaw.ac.at` |
| SHAWI    | `https://shawi-api.acdh-dev.oeaw.ac.at`                                |
| TUNOCENT | `https://tunocent-api.acdh-dev.oeaw.ac.at`                             |
| Wibarab  | `https://wibarab-api.acdh-dev.oeaw.ac.at`                              |

## Scripts

| Command                                         | Description                                           |
| ----------------------------------------------- | ----------------------------------------------------- |
| `pnpm run dev`                                  | Start the development server (http://127.0.0.1:3000). |
| `pnpm build`                                    | Build the production server.                          |
| `pnpm run start`                                | Start the production server (requires a prior build). |
| `pnpm run start:local`                          | Start production server with `.env.local` loaded.     |
| `pnpm run start:preview`                        | Preview the built app locally.                        |
| `pnpm run test`                                 | Run all tests (format, lint, typecheck, unit, E2E).   |
| `pnpm run test:unit`                            | Run Vitest unit tests.                                |
| `pnpm run test:e2e`                             | Run Playwright E2E tests (requires a built app).      |
| `pnpm run test:e2e:ui`                          | Run Playwright E2E tests with interactive UI.         |
| `pnpm run validate`                             | Run format check, lint, typecheck, and unit tests.    |
| `pnpm run format:check` / `pnpm run format:fix` | Check / fix code formatting.                          |
| `pnpm run lint:check` / `pnpm run lint:fix`     | Check / fix lint errors.                              |
| `pnpm run types:check`                          | Run Nuxt type checking.                               |

## Testing

### Unit tests

Vitest runs unit tests co-located with source files (`*.test.ts`, `*.nuxt.spec.ts`).

```bash
pnpm run test:unit
```

### E2E tests

Playwright E2E tests live in `e2e/pages/{vicav,shawi,tunocent,wibarab}/`. Tests run against real
backends; the backend is selected via `NUXT_PUBLIC_API_BASE_URL` in your `.env.local`.

**Important:** E2E tests require a pre-built application because public environment variables are
baked into the bundle at build time.

```bash
# Build the app with your chosen backend
pnpm build

# Run E2E tests
pnpm run test:e2e
```

See [docs/tests.md](./docs/tests.md) for detailed information on backend switching and test
organization.

## Project structure

```
vicav-vue3/
├── app/                    # Nuxt application source
│   ├── assets/             # Static assets (OpenAPI spec, map styles)
│   ├── components/        # Vue components
│   ├── composables/       # Vue composables (business logic)
│   ├── config/            # App configuration (i18n, imprint, data types)
│   ├── layouts/           # Page layouts
│   ├── lib/               # Generated API client (gitignored)
│   ├── pages/             # Route pages
│   ├── stores/            # Pinia stores
│   ├── styles/            # Global CSS / Tailwind
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── server/                 # Server-side Nitro routes & plugins
│   ├── api/               # API endpoints (NoSketch proxy, export)
│   ├── plugins/           # Server plugins
│   └── routes/            # Custom routes (status)
├── shared/                 # Shared utilities
├── e2e/                   # Playwright E2E tests
│   └── pages/             # Test specs per app
├── docs/                  # Architecture documentation
├── specs/                 # Test plans
├── .devcontainer/         # Devcontainer configuration
├── playwright.config.ts   # Playwright configuration
├── vitest.config.ts       # Vitest configuration
└── nuxt.config.ts         # Nuxt configuration
```

## Architecture highlights

- **Window-driven MDI**: All content opens in WinBox windows. Window state is serialized in the URL,
  enabling deep linking.
- **Composable-first**: Business logic resides in `app/composables/use-*.ts`. Components are thin
  dispatchers.
- **TanStack Query**: All API calls use TanStack Query with a 15‑minute stale time.
- **Client-only components**: Maps and the window manager are client‑only (`.client.vue` suffix).
- **Zod schemas**: Window types are defined in `app/types/global.ts` as discriminated unions.
- **API contract**: The backend API contract lives in the
  [`vicav-app-api`](https://github.com/acdh-oeaw/vicav-app-api) repository. On install,
  `openapi.json` is downloaded and the TypeScript client is generated. The same OpenAPI document is
  converted to Zod schemas (`useOpenapiSchema()` + `z.fromJSONSchema()`) to validate backend
  responses at runtime (e.g., TEI metadata, dictionary entries), keeping runtime validation in
  lockstep with the contract.

### Documentation

| File                                                                           | Purpose                                                               |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| [docs/windowTypes.md](./docs/windowTypes.md)                                   | Reference for all window `targetType` values and their params schemas |
| [docs/menu.md](./docs/menu.md)                                                 | Menu system overview: components, data flow, menu item types          |
| [docs/searchbar.md](./docs/searchbar.md)                                       | Searchbar component: tag/text modes, CodeMirror, Lucene/CQL syntax    |
| [docs/tei-metadata-loading-caching.md](./docs/tei-metadata-loading-caching.md) | TEI metadata loading pipeline: 3‑layer caching, parsing, joins        |
| [docs/dict-entry-component-mapping.md](./docs/dict-entry-component-mapping.md) | Dictionary entry rendering: API field to template mapping             |
| [docs/tests.md](./docs/tests.md)                                               | E2E testing guide: backend switching, test locations, selectors       |
| [specs/menu-test-plan.md](./specs/menu-test-plan.md)                           | Comprehensive menu test plan                                          |
| [specs/tunocent-menu-test-plan.md](./specs/tunocent-menu-test-plan.md)         | TUNOCENT app test plan                                                |
| [specs/shawi-menu-test-plan.md](./specs/shawi-menu-test-plan.md)               | SHAWI app test plan                                                   |

## CI/CD

The project uses GitHub Actions (`.github/workflows/starter.yaml`) on the `main` and `develop`
branches:

1. **Build**: Creates a Herokuish image containing the built Nuxt app.
2. **Test**: Runs Vitest and Playwright E2E tests against each backend variant.
3. **Deploy**: Deploys to a Kubernetes cluster.

### Environments

| Branch / Trigger | Environment | URL pattern                    |
| ---------------- | ----------- | ------------------------------ |
| `main`           | Production  | TBD                            |
| `develop`        | Development | TBD                            |
| Other branches   | Review      | only deployed for internal use |

Each app variant (SHAWI, TUNOCENT, Wibarab) has its own GitHub environment (`-shawi`, `-tunocent`,
`-wibarab`) with separate backend configurations.

### GitHub variables & secrets

Configure environment variables in the repository settings:

- **Variables** (prefixed with `NUXT_PUBLIC_`): `NUXT_PUBLIC_API_BASE_URL`,
  `NUXT_PUBLIC_APP_BASE_URL`, etc.
- **Secrets** (non‑public): Currnetly unused.

Repository: GitHub Variables and Secrets

### Testing CI deployment locally

The automated build process is roughly equivalent to:

```bash
# Set CI=true to trigger production-like cleanup
# $env:CI='true'  # Windows
export CI=true  # macOS / Linux
pnpm build
pnpm run test
pnpm prune --prod
pnpm run start
```

If you did not set environment variables but keep them in `.env.local`, use:

```bash
pnpm run start:local
```

This loads `.env.local` as environment and then executes `pnpm run start`.

Open the production server on http://localhost:3000 and verify the app loads correctly.

**Note:** If you do not verify that these commands work after major overhauls, there is a high
chance that `pnpm run dev` works but the deployed container does not.

Restore dev packages afterwards:

```bash
# Unset CI
# $env:CI=''  (Windows)
# unset CI  (macOS / Linux)
pnpm prune
```

## Release

1. Checkout the `main` branch.
2. Merge `develop` into `main`.
3. Update the `version` field in `package.json` (e.g., `0.9.0`).
4. Commit the version change.
5. Create an annotated tag: `git tag -a v0.9.0 -m "Release v0.9.0"`.
6. Push the commit and tag: `git push && git push origin --tags`.
7. Checkout the `develop` branch.
8. Merge `main` into `develop`.
9. Push the `develop` branch.

## Telemetry

This project is instrumented with OpenTelemetry to collect traces and metrics. Configure the
exporter endpoint via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable in `.env.local`. See
`.env.example` for reference.

For a local setup, use the Jaeger all‑in‑one Docker image:

```bash
docker run --rm --name jaeger \
   -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
   -p 16686:16686 \
   -p 4317:4317 \
   -p 4318:4318 \
   -p 14250:14250 \
   -p 14268:14268 \
   -p 14269:14269 \
   -p 9411:9411 \
   jaegertracing/all-in-one:latest
```

Then set `OTEL_EXPORTER_OTLP_ENDPOINT=http://127.0.0.1:4317` in your `.env.local` file.

## Maps

The global map configuration has been moved from environment variables to
`app/assets/mapStyles.json`.

## Development container

A `.devcontainer` configuration is provided for VS Code Remote - Containers. It uses the
`pnpm:10-node24` image, forwards port 3000, and pre‑configures the Wibarab backend for development.

## License

MIT — see the `license` file for details.
