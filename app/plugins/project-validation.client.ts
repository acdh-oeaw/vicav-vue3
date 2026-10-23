import { createProjectValidationReporter } from "@/utils/project-validation-toasts.ts";

export default defineNuxtPlugin({
	name: "project-validation",
	dependsOn: ["project-query-client"],
	setup(nuxtApp) {
		const project = useProjectInfo();
		const toasts = useToastsStore();
		const report = createProjectValidationReporter(toasts.addToast, toasts.removeToast);
		nuxtApp.hook("app:mounted", () => {
			watch(() => project.data.value, report, { immediate: true });
		});
	},
});
