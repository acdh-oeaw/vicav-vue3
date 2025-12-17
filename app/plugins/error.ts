/* eslint-disable no-console */
export default defineNuxtPlugin((nuxtApp) => {
	const toastsStore = useToastsStore();
	const { addToast } = toastsStore;
	// TODO: remove or transform before deploying to production
	nuxtApp.hook("app:error", (err) => {
		console.log(`app:error`, err instanceof Error ? (err.stack ?? err.message) : "");
	});
	nuxtApp.hook("vue:error", (error, _instance, _info) => {
		// get the name of the instance/component? info is something like setup function so also helpful.
		const errorMessage = {
			title: "Error",
			description: error instanceof Error ? (error.stack ?? error.message) : "",
			type: "foreground",
			variant: "negative",
		} as const;
		console.log(`vue:error`, errorMessage.description);
		addToast(errorMessage);
	});
	nuxtApp.vueApp.config.errorHandler = (error, _instance, _info) => {
		console.log(
			`global error handler`,
			error instanceof Error ? (error.stack ?? error.message) : "",
		);
	};
});
