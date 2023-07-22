import { Api } from '~/gen/Api';

export default defineNuxtPlugin(() => {
    const api = new Api({baseUrl: "" + import.meta.env.VITE_APIBASEURL});
    return { provide: { api } };
});