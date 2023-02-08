# vicav-vue3

A redevelopment of the [current vicav frontend](https://vicav.acdh.oeaw.ac.at/) using [Vue3](https://vuejs.org/) and [Nuxt](https://nuxt.com/)

For basic info on how it works, check out [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction).

## Setup
```bash
# install all dependencies
npm install
# create the API Module from swagger
npm run makeapi
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

The current setup uses a [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api) module for 
communication with the REST-API of the vicav backend. It can be created like so:

```bash
sta -p ./vicav-app-api/openapi.yaml -o ./gen/
#or
npm run makeapi
```
resides in the gen folder and should NOT be commited. 
The [OpenApi](https://swagger.io/specification/) - definition used is maintained [here](https://github.com/acdh-oeaw/vicav-app-api)
and included as a submodule. It can be updated using
```bash
git submodule update
```

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

