# VICAV frontend

frontend application for the VICAV project.

## how to run

prerequisites:

- [Node.js v22](https://nodejs.org/en/download)
- pnpm (`corepack enable`)

set required environment variables in `.env.local`:

```bash
cp .env.example .env.local
```

also, set environment variables required by GitHub actions. use
["variables"](https://github.com/acdh-oeaw/template-app-nuxt/settings/variables/actions) for every
environment variable prefixed with `NUXT_PUBLIC_`, and
["secrets"](https://github.com/acdh-oeaw/template-app-nuxt/settings/secrets/actions) for all others.

install dependencies:

```bash
pnpm install
```

run a development server on [http://localhost:3000](http://localhost:3000):

```bash
pnpm run dev
```

## how to test for CI deployment

The automated build process is roughly equivalent to the following command sequence:

```bash
pnpm run build
pnpm run test
# export CI=true or
# $env:CI='true'
pnpm prune --prod
pnpm run start
```

If you did not actually set the environment variables in .env.local in your development environment,
replace the last line with:

```bash
pnpm run start:local
```

This loads .env.local as environment and then executes `pnpm run start`.

Open the production server on [http://localhost:3000](http://localhost:3000) and make sure it loads
and shows the new features you implemented.

If you do not verify that these commands work after major overhauls there is a high change that
`pnpm run dev` works but the deployed container does not.

Get back dev packages:

```bash
# unset CI or
# del env:CI
pnpm prune
```

## Release

- Checkput `main` branch
- Merge `develop` into `main`
- Update version in package.json (e. g. 0.8.0)
- Commit version change
- Create tag with version (e. g. v0.8.0)
- `git push` and `git push origin --tags`
- Checkout `develop` branch
- Merge `main` into `develop`
- Revert the commit `Limit actions to production ready`
- `git push`

## Telemetry

This project is instrumented with OpenTelemetry to collect traces and metrics. You can configure the
exporter endpoint via the `OTEL_EXPORTER_OTLP_ENDPOINT` environment variable in `.env.local`. See
`.env.example` for reference.

For a local setup, you can use the Jaeger all-in-one Docker image:

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

The global map config has been moved from env variables to `app/assets/mapStyles.json`

## Instances

The deployment workflow configures the following targets:

| Instance            | Branch    | Target URL                             |
| ------------------- | --------- | -------------------------------------- |
| VICAV production    | `main`    | https://vicav.acdh-dev.oeaw.ac.at/     |
| Shawi production    | `main`    | https://shawi.acdh.oeaw.ac.at          |
| Tunocent production | `main`    | https://tunocent.acdh.oeaw.ac.at/      |
| WIBARAB production  | `main`    | https://wibarab.acdh-dev.oeaw.ac.at    |
| VICAV develop       | `develop` | https://vicav-vue.acdh-dev.oeaw.ac.at/ |
| Shawi develop       | `develop` | https://shawi.acdh-dev.oeaw.ac.at/     |
| Tunocent develop    | `develop` | https://tunocent.acdh-dev.oeaw.ac.at   |
| WIBARAB develop     | `develop` | https://wibarab.acdh-dev.oeaw.ac.at/   |

Other branches use review environments. Unless an environment overrides `PUBLIC_URL`, the workflow
generates these target URLs using a normalized branch name:

| Instance        | Generated target URL                                      |
| --------------- | --------------------------------------------------------- |
| VICAV review    | `https://<branch>.acdh-cluster-2.arz.oeaw.ac.at`          |
| Shawi review    | `https://shawi-<branch>.acdh-cluster-2.arz.oeaw.ac.at`    |
| Tunocent review | `https://tunocent-<branch>.acdh-cluster-2.arz.oeaw.ac.at` |
| WIBARAB review  | `https://wibarab-<branch>.acdh-cluster-2.arz.oeaw.ac.at`  |

Version tags matching `v<number>.<number>.<number>` also use the production environments. These are
configured targets; a deployment may not have succeeded or be reachable at each URL.
