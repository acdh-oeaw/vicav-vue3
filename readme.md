# VICAV frontend

frontend application for the VICAV project.

## how to run

prerequisites:

- [Node.js v22](https://nodejs.org/en/download)
- [pnpm](https://pnpm.io/installation)

set required environment variables in `.env.local`:

```bash
cp .env.example .env.local
```

also, set environment variables required by github actions. use
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
pnpm prune
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
