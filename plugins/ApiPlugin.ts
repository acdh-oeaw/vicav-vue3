import { Api } from '~/gen/Api';

export default defineNuxtPlugin(() => {
    const api = new Api();
    return { provide: { api } };
});