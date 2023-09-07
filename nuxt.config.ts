// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            meta: [{
                name: 'application-name',
                content: 'VICAV  Frontend'
            }],
            link: [
                {
                    rel: 'icon',
                    type: 'image/png',
                    href: '/favicon-32x32.png',
                    sizes: 'any'
                }
            ]
        }
    },
    css: [
        '~/assets/styles/main.scss',
        'leaflet/dist/leaflet.css',
        '@fortawesome/fontawesome-svg-core/styles.css',
    ],
    dev: true,
    vite: {
        define: {
            'process.env.DEBUG': false,
        },
        plugins: [

        ]
    },
    vue: {
        compilerOptions: {

        }
    },
    modules: [
        '@pinia/nuxt',
    ],
    sourcemap: {
        "server": true,
        "client": true
    }
})
