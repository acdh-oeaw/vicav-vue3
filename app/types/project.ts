import type { ProjectConfig, ProjectConfigType } from "@/lib/api-client";

export interface ValidationDiagnostic {
	id: string;
	source: "corpus" | "geographic-place" | "metadata" | "geojson";
	itemId?: string;
	index: string | number;
	issues: Array<{ code: string; path: Array<string | number>; message: string }>;
}
export interface ProjectResponse extends ProjectConfig {
	projectConfig?: ProjectConfigType & { _validationErrors?: Array<ValidationDiagnostic> };
}
