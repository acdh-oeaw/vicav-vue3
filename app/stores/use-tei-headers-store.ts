import { defineStore } from "pinia";
import type { ReadonlyDeep } from "type-fest";

import type { Person } from "@/lib/api-client";
import {
	freezeCacheEntry,
	type GroupedSimpleItemsByCountry,
	groupSimpleItems,
	type GroupSimpleItemsOptions,
	prepareProject,
} from "@/lib/project/prepare-project.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";

export type {
	GroupedSimpleItemsByCountry,
	GroupedSimpleItemsByDataType,
	GroupedSimpleItemsByPlace,
	GroupedSimpleItemsByRegion,
	GroupSimpleItemsOptions,
	SimpleMetadataAccessor,
	SimpleMetadataAccessorKey,
} from "@/lib/project/prepare-project.ts";
export {
	GeoPlaceSchema,
	getSimpleMetadataValue,
	groupSimpleItems,
	simpleMetadataAccessors,
	TeiCorpusSchema,
} from "@/lib/project/prepare-project.ts";
const METADATA_PIPELINE_VERSION = 2;

interface InitializationSnapshot {
	ready: true;
	pipelineVersion: number;
	projectIdentity: string;
	etag: string | null;
}

export const useTeiHeadersStore = defineStore("use-tei-headers-store", () => {
	const { data: projectData, suspense } = useProjectInfo();
	const config = useRuntimeConfig();
	const projectIdentity = config.public.apiBaseUrl.replace(/\/$/, "");
	const backendIdentity = (
		import.meta.server && config.apiBaseUrl ? config.apiBaseUrl : config.public.apiBaseUrl
	).replace(/\/$/, "");
	const simpleItems = shallowRef<Array<simpleTEIMetadata>>([]);
	const persons = shallowRef<Array<Person>>([]);
	const initialization = ref<InitializationSnapshot | null>(null);
	let inFlight: Promise<void> | null = null;

	function assignCacheEntry(
		entry: ReadonlyDeep<{ simpleItems: Array<simpleTEIMetadata>; persons: Array<Person> }>,
	): void {
		simpleItems.value = entry.simpleItems as Array<simpleTEIMetadata>;
		persons.value = entry.persons as Array<Person>;
	}

	function markInitialized(etag: string | null): void {
		initialization.value = {
			ready: true,
			pipelineVersion: METADATA_PIPELINE_VERSION,
			projectIdentity,
			etag,
		};
	}

	async function initialize(options: { reuseHydratedState?: boolean } = {}): Promise<void> {
		if (inFlight) return inFlight;

		inFlight = (async () => {
			await suspense();
			const envelope = toRaw(projectData.value);
			const etag = envelope?.ETag ?? null;
			const snapshot = initialization.value;
			if (
				options.reuseHydratedState &&
				snapshot?.ready &&
				snapshot.pipelineVersion === METADATA_PIPELINE_VERSION &&
				snapshot.projectIdentity === projectIdentity &&
				snapshot.etag === etag
			) {
				assignCacheEntry(
					freezeCacheEntry({
						response: {},
						simpleItems: toRaw(simpleItems.value),
						persons: toRaw(persons.value),
					}),
				);
				return;
			}

			const entry = await prepareProject(envelope ?? {}, backendIdentity, {
				authenticated: Boolean(config.public.apiUser),
			});

			assignCacheEntry(entry);
			markInitialized(etag);
		})();

		try {
			await inFlight;
		} finally {
			// eslint-disable-next-line require-atomic-updates -- concurrent callers only await the shared promise
			inFlight = null;
		}
	}

	function getGroupedSimpleItems(options: GroupSimpleItemsOptions): GroupedSimpleItemsByCountry {
		return groupSimpleItems(simpleItems.value, options);
	}

	return { initialize, simpleItems, persons, initialization, getGroupedSimpleItems };
});
