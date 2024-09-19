/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
export default defineNuxtPlugin((nuxtApp) => {
	// TODO: remove or transform before deploying to production
	nuxtApp.hook("app:error", (..._args) => {
		console.log(
			`app:error: [${_args.length} errors]`,
			_args.map((e) => e.message),
		);
	});
	nuxtApp.hook("vue:error", (..._args) => {
		console.log(
			`vue:error: [${_args.length} errors]`,
			_args.map((e) => e.message),
		);
	});
	nuxtApp.vueApp.config.errorHandler = (..._args) => {
		console.log(
			`global error handler: [${_args.length} errors]`,
			_args.map((e) => e.message),
		);
	};
});
