// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            meta: [{
                name: 'VICAV Frontend'
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
})
