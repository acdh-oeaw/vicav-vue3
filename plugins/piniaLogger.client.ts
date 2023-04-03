import { type Pinia } from 'pinia'
import { PiniaLogger } from "pinia-logger";

export default defineNuxtPlugin((nuxtApp) => {
    const pinia = nuxtApp.$pinia as Pinia

    pinia.use(
        PiniaLogger({
            expanded: true,
            disabled: process.env.mode === "production",
        })
    )
})
