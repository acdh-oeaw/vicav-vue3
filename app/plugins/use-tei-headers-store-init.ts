export default defineNuxtPlugin(async (nuxtApp) => {
	if (import.meta.server) {
		const teiHeadersStore = useTeiHeadersStore();
		await teiHeadersStore.initialize();
		return;
	}

	nuxtApp.hook("app:created", async () => {
		const teiHeadersStore = useTeiHeadersStore();
		await teiHeadersStore.initialize();
	});
});
