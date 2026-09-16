export default defineNuxtPlugin({
	name: "tei-headers-init",
	dependsOn: ["pinia", "project-query-client"],
	async setup(nuxtApp) {
		if (import.meta.server) {
			await useTeiHeadersStore().initialize();
			return;
		}
		nuxtApp.hook("app:created", async () => {
			await useTeiHeadersStore().initialize({ reuseHydratedState: true });
		});
	},
});
