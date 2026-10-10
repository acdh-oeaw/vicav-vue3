export default defineNuxtPlugin({
	name: "tei-headers-init",
	dependsOn: ["pinia", "project-query-client"],
	async setup(nuxtApp) {
		const metadataStore = useTeiHeadersStore();
		const mapStore = useDataListMapStore();
		if (import.meta.server) {
			await metadataStore.initialize();
			await mapStore.initialize();
			return;
		}
		nuxtApp.hook("app:created", async () => {
			await metadataStore.initialize({ reuseHydratedState: true });
			await mapStore.initialize({ reuseHydratedState: true });
		});
	},
});
