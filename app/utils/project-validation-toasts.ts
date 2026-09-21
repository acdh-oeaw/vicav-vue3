import type { ProjectResponse, ValidationDiagnostic } from "@/types/project.ts";

/** Browser-session reporting state; never changes the cached diagnostics. */
export function createProjectValidationReporter(
	addToast: (toast: {
		id: string;
		title: string;
		description: string;
		variant: "negative";
	}) => void,
	removeToast: (id: string) => void,
) {
	const displayed = new Set<string>();
	const active = new Set<string>();
	let version: string | undefined;
	return (response: ProjectResponse | undefined) => {
		if (!response) return;
		const nextVersion = response.ETag ?? "unversioned";
		if (version !== nextVersion) {
			for (const id of active) removeToast(id);
			active.clear();
			version = nextVersion;
		}
		const groups = new Map<ValidationDiagnostic["source"], Array<ValidationDiagnostic>>();
		for (const diagnostic of response.projectConfig?._validationErrors ?? []) {
			const key = JSON.stringify([nextVersion, diagnostic.id]);
			if (displayed.has(key)) continue;
			displayed.add(key);
			const group = groups.get(diagnostic.source) ?? [];
			group.push(diagnostic);
			groups.set(diagnostic.source, group);
		}
		for (const [source, diagnostics] of groups) {
			const id = `project-validation:${source}`;
			active.add(id);
			addToast({
				id,
				title: `Invalid project data: ${source}`,
				description: `${String(diagnostics.length)} affected record(s). Invalid ${source === "corpus" ? "corpora and their texts" : source === "metadata" ? "derived metadata" : source === "geojson" ? "map features" : "geographic places"} were skipped.`,
				variant: "negative",
			});
		}
	};
}
