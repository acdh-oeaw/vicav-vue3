# vicav-vue3

A redevelopment of the [current VICAV frontend](https://vicav.acdh.oeaw.ac.at/) using [Vue3](https://vuejs.org/) and [Nuxt](https://nuxt.com/)

For basic info on how it works, check out [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction).

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Generate API client

The current setup uses a [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api) module for
communication with the REST-API of the VICAV backend.

The OpenAPI document is maintained [here](https://github.com/acdh-oeaw/vicav-app-api) and can be explored [here](https://vicav.acdh-ch-dev.oeaw.ac.at/openapi).

To generate the API client run:

```bash
npm run makeapi
```

**Note:** The resulting `gen` folder SHOULD NOT be commited.

## Environment variables

see [dev.env.template](dev.env.template) for recommended values

```
VITE_BASEURL - base address of the app
VITE_APIBASEURL - base address of the backend api
VITE_MAP_TILELAYER - template URL for the leaflet map tile-layer
VITE_MAP_INITIAL_X - coordinates for the the initial map view
VITE_MAP_INITIAL_Y - coordinates for the the initial map view
VITE_MAP_INITIAL_Z - coordinates for the the initial map view
```
## Development

Start the development server on http://localhost:3000

```bash
npm run dev
```

## Production

Build and run the application for production:

```bash
#create a build (will automatically recreate the API Module)
npm run build
# run production server
npm run start
```

Locally preview production build:

```bash
npm run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


## API Module

### Setup

See in the general setup steps above.

### Usage

The module is set up as a [Nuxt Plugin](https://nuxt.com/docs/guide/directory-structure/plugins) and can be imported in
any view like so:

```javascript
const { $api } = useNuxtApp();
```

By default the generated module will use the first defined server from the swagger file. This can be updated
at runtime by modifying the `baseUrl`:

```javascript
$api.baseUrl = "https://vicav.acdh-ch-dev.oeaw.ac.at/vicav";
```

