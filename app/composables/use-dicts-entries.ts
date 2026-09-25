import { useQuery } from "@tanstack/vue-query";
import type Zod from "zod";
import { z } from "zod";

import { useOpenapiSchema } from "@/composables/use-openapi-schema.ts";
import type { RestVLEEntry } from "@/lib/api-client";
import type { Dict } from "@/types/global.ts";
import { useApiClient } from "~/shared/utils/use-api-client.ts";

export const RestVLEEntrySchema = z.fromJSONSchema(
	useOpenapiSchema("RestVLEEntry"),
) as z.ZodType<RestVLEEntry>;

interface DictEntriesQueryParams {
	page?: number | null;
	pageSize?: number | null;
	id?: string | null;
	ids?: string | null;
	q?: string | null;
	sort?: "asc" | "desc" | "none" | null;
	altLemma?: string | null;
	format?: string | null;
}

function getEntryId(entry: unknown, fallback: number): string {
	if (typeof entry !== "object" || entry === null) return `entry #${String(fallback + 1)}`;

	const id = "id" in entry && typeof entry.id === "string" ? entry.id : undefined;
	const sid = "sid" in entry && typeof entry.sid === "string" ? entry.sid : undefined;

	return id ?? sid ?? `entry #${String(fallback + 1)}`;
}

export function useDictsEntries(
	params: {
		dictId: Zod.infer<typeof Dict>["id"];
		queryParams: DictEntriesQueryParams;
	},
	options?: { enabled?: boolean },
) {
	const api = useApiClient();

	return useQuery({
		enabled: options?.enabled,
		retry: false,
		queryKey: ["get-dicts-entries", params] as const,
		async queryFn({ queryKey: [, params] }) {
			const { queryParams } = params;
			if (!queryParams.q && !queryParams.id && !queryParams.ids) return null;
			try {
				const response = await api.restvle.getDictDictNameEntries(params.dictId, queryParams, {
					headers: { accept: "application/json" },
				});
				const entries = response.data._embedded.entries;
				if (!Array.isArray(entries)) return response.data;

				const validEntries: Array<RestVLEEntry> = [];
				const invalidEntries: Array<{ id: string; entry: unknown; error: z.ZodError }> = [];

				entries.forEach((entry, index) => {
					const parsedEntry = RestVLEEntrySchema.safeParse(entry);
					if (parsedEntry.success) {
						validEntries.push(parsedEntry.data);
					} else {
						invalidEntries.push({
							id: getEntryId(entry, index),
							entry,
							error: parsedEntry.error,
						});
					}
				});

				if (invalidEntries.length > 0) {
					console.error("Invalid dictionary entries returned by API", invalidEntries);

					if (import.meta.client) {
						const toastsStore = useToastsStore();
						const invalidEntryIds = invalidEntries.map(({ id }) => id).join(", ");

						toastsStore.addToast({
							title: "Invalid dictionary entries",
							description: `${String(invalidEntries.length)} dictionary ${
								invalidEntries.length === 1 ? "entry was" : "entries were"
							} skipped because the API response did not match the expected schema: ${invalidEntryIds}.`,
							type: "foreground",
							variant: "negative",
						});
					}
				}

				return {
					...response.data,
					_embedded: {
						...response.data._embedded,
						entries: validEntries,
					},
				};
			} catch (e) {
				/*
				TODO TypeScript defaults errors to unknown, so this won't work without manual type assertion
				see https://www.typescriptlang.org/tsconfig/#useUnknownInCatchVariables
				if (e.status === null) {
					console.error(e);
					return null;
				}
				 TODO this won't work like this, because the return type RestVLEEntries
					 implies a different shape
					 either complete the shape here or move error handling to the component
					 using the "isError" return value
				switch (e.status) {
					case 404: {
						return {
							total_items: "0",
						};
					}
					default: {
						break;
					}
				}
				*/
				console.error(e);
				throw e;
			}
		},
	});
}
