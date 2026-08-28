import { useQuery } from "@tanstack/vue-query";
import type Zod from "zod";
import { z } from "zod";

import type { RestVLEEntry } from "@/lib/api-client";
import type { Dict } from "@/types/global.ts";

const api = useApiClient();
const RestVLEEntrySchema = z.fromJSONSchema(
	useOpenapiSchema("RestVLEEntry"),
) as z.ZodType<RestVLEEntry>;

function getEntryId(entry: unknown, fallback: number): string {
	if (typeof entry !== "object" || entry === null) return `entry #${String(fallback + 1)}`;

	const id = "id" in entry && typeof entry.id === "string" ? entry.id : undefined;
	const sid = "sid" in entry && typeof entry.sid === "string" ? entry.sid : undefined;

	return id ?? sid ?? `entry #${String(fallback + 1)}`;
}

export function useDictsEntries(
	params: {
		dictId: Zod.infer<typeof Dict>["id"];
		queryParams: Parameters<typeof api.restvle.getDictDictNameEntries>[1];
	},
	options?: { enabled?: boolean },
) {
	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-dicts-entries", params] as const,
		async queryFn({ queryKey: [, params] }) {
			if (!params.queryParams?.q && !params.queryParams?.id && !params.queryParams?.ids)
				return null;
			try {
				const response = await api.restvle.getDictDictNameEntries(
					params.dictId,
					params.queryParams,
					{
						headers: { accept: "application/json" },
					},
				);
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
