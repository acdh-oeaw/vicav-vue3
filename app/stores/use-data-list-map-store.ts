import { defineStore } from "pinia";
import {
	computed,
	effectScope,
	markRaw,
	onScopeDispose,
	ref,
	shallowReactive,
	toRef,
	watch,
} from "vue";

import { mapDatasetColors, mapDatasetRegistryVersion, mapDatasets } from "@/config/map-datasets.ts";
import {
	getSimpleMetadataValue,
	simpleMetadataAccessors,
	useTeiHeadersStore,
} from "@/stores/use-tei-headers-store.ts";
import { GeoCoordinatesSchema } from "@/types/geo-coordinates.ts";
import type {
	DataListMapLayer,
	DataListWindowItem,
	SimpleMetadataListState,
} from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus.ts";
import { createSimpleMetadataTable } from "@/utils/simple-metadata-table.ts";

function normalizeReference(reference: string): string {
	return reference.replace(/^geo:/i, "").trim();
}

function popupLabelFor(item: simpleTEIMetadata): string | undefined {
	if (!["Feature", "SampleText"].includes(item.dataType) || item.person.length === 0)
		return undefined;

	return item.person
		.map((person) => `${person.name} (age: ${person.age}, sex: ${person.sex})`)
		.join(", ");
}

type DatasetDefinition = Pick<DataListWindowItem["params"], "dataTypes" | "filterListBy">;

interface DatasetRecord {
	title: string;
	definition: DatasetDefinition;
	color: string;
	configured: boolean;
	attached: boolean;
	enabled: boolean;
	mapped: boolean;
	listState?: SimpleMetadataListState;
	defaultFacets: NonNullable<SimpleMetadataListState["facets"]>;
}

function dataTypesKey(dataTypes: DatasetDefinition["dataTypes"]): string {
	return [...new Set(dataTypes)].sort().join(",");
}

function matchesDataTypes(left: DatasetDefinition, right: DatasetDefinition): boolean {
	return dataTypesKey(left.dataTypes) === dataTypesKey(right.dataTypes);
}

function matchesItem(item: simpleTEIMetadata, definition: DatasetDefinition): boolean {
	if (!definition.dataTypes.includes(item.dataType)) return false;
	const filter = definition.filterListBy;
	return (
		!filter ||
		!Object.hasOwn(simpleMetadataAccessors, filter.key) ||
		getSimpleMetadataValue(item, filter.key as keyof typeof simpleMetadataAccessors) ===
			filter.value
	);
}

export const useDataListMapStore = defineStore("data-list-map", () => {
	const runtimeDatasets = shallowReactive(new Map<string, ReturnType<typeof createDataset>>());
	const datasets = computed(() => runtimeDatasets);
	const records = ref<Record<string, DatasetRecord>>({});
	const aliases = ref<Record<string, string>>({});
	const initialization = ref<
		| (NonNullable<ReturnType<typeof useTeiHeadersStore>["initialization"]> & {
				registryVersion: number;
		  })
		| null
	>(null);
	let inFlight: Promise<void> | null = null;
	const metadataStore = useTeiHeadersStore();
	const layers = computed<Record<string, DataListMapLayer>>(() =>
		Object.fromEntries(
			[...runtimeDatasets]
				.filter(([, dataset]) => dataset.mapped.value)
				.map(([id, dataset]) => [
					id,
					{
						id,
						title: dataset.title.value,
						color: dataset.color,
						enabled: dataset.enabled.value,
						markers: resolveMarkers(
							dataset.model
								? dataset.model.table.getFilteredRowModel().flatRows.map((row) => row.original)
								: dataset.items.value,
						),
					},
				]),
		),
	);
	const colorsById = ref<Record<string, string>>({});
	const { data: projectData } = useProjectInfo();

	function colorFor(id: string): string {
		const current = colorsById.value[id];
		if (current) return current;
		const color = mapDatasetColors[Object.keys(colorsById.value).length % mapDatasetColors.length]!;
		colorsById.value = { ...colorsById.value, [id]: color };
		return color;
	}

	function fallbackLocation(item: simpleTEIMetadata) {
		const geoFeatures =
			projectData.value?.projectConfig?.staticData?.geo?.flatMap(
				(collection) => collection.features,
			) ?? [];
		for (const feature of geoFeatures) {
			const properties = feature.properties as {
				"@id"?: string;
				name?: string;
				referencedBy?: Array<{ source?: string; ids?: Array<{ id?: string; reference?: string }> }>;
			};
			for (const reference of properties.referencedBy ?? []) {
				if (reference.source !== item.geoSource) continue;
				if (
					reference.ids?.some(
						(entry) =>
							entry.id === item.id &&
							(!item.geoReference ||
								normalizeReference(entry.reference ?? "") ===
									normalizeReference(item.geoReference)),
					)
				) {
					const coordinates = GeoCoordinatesSchema.safeParse(feature.geometry?.coordinates);
					return {
						coordinates: coordinates.success ? coordinates.data : undefined,
						placeName: properties.name,
					};
				}
			}
		}
		return undefined;
	}

	function resolveMarkers(items: Array<simpleTEIMetadata>) {
		const seen = new Set<string>();
		return items.flatMap((item) => {
			const placeName = [item.place.settlement, item.place.region, item.place.country]
				.map((name) => name?.trim())
				.find((name) => name != null && name.length > 0);
			const fallback = item.coordinates && placeName ? undefined : fallbackLocation(item);
			const coordinates = item.coordinates ?? fallback?.coordinates;
			if (!coordinates) return [];
			const key = `${item.geoSource}:${item.id}:${coordinates.join(",")}`;
			if (seen.has(key)) return [];
			seen.add(key);
			return [
				{
					id: item.id,
					label: item.label,
					placeName: placeName ?? fallback?.placeName ?? "Unknown place",
					alt: popupLabelFor(item),
					dataType: item.dataType,
					coordinates,
				},
			];
		});
	}

	function createRecord(
		title: string,
		params: DataListWindowItem["params"],
		color: string,
		configured = false,
	): DatasetRecord {
		return {
			title,
			color,
			configured,
			attached: !configured,
			definition: { dataTypes: [...new Set(params.dataTypes)], filterListBy: params.filterListBy },
			enabled: params.mapEnabled === true,
			mapped: configured || params.mapEnabled === true,
			listState: params.listState,
			defaultFacets:
				params.dataTypes.length === 1 && params.dataTypes[0] === "CorpusText"
					? { "@hasTEIw": ["true"] }
					: {},
		};
	}

	function createDataset(id: string) {
		const record = records.value[id]!;
		const scope = effectScope(true);
		const dataset = scope.run(() => {
			const definition = toRef(record, "definition");
			const items = computed(() =>
				metadataStore.simpleItems.filter((item) => matchesItem(item, definition.value)),
			);
			const dataType =
				definition.value.dataTypes.length === 1 ? definition.value.dataTypes[0] : undefined;
			const model =
				dataType && ["CorpusText", "SampleText", "Feature", "Profile"].includes(dataType)
					? createSimpleMetadataTable({
							getItems: () => items.value,
							dataType,
							listState: record.listState,
							get defaultFacets() {
								return record.defaultFacets;
							},
						})
					: undefined;
			if (model)
				watch(
					[model.globalFilter, model.columnFilters, model.sortMode],
					() => {
						record.listState = model.serializeListState();
					},
					{ deep: true, flush: "sync" },
				);
			return {
				title: toRef(record, "title"),
				definition,
				items,
				model,
				enabled: toRef(record, "enabled"),
				mapped: toRef(record, "mapped"),
			};
		})!;
		return markRaw({
			...dataset,
			get color() {
				return record.color;
			},
			dispose: () => {
				scope.stop();
			},
		});
	}

	function attachRuntimeModels(): void {
		for (const id of Object.keys(records.value)) {
			if (!runtimeDatasets.has(id)) runtimeDatasets.set(id, createDataset(id));
		}
	}

	function consolidateDatasets(): void {
		const idsByTypes = new Map<string, string>();
		const entries = Object.entries(records.value).sort(
			([, left], [, right]) => Number(right.configured) - Number(left.configured),
		);
		for (const [id, record] of entries) {
			const key = dataTypesKey(record.definition.dataTypes);
			const existingId = idsByTypes.get(key);
			if (!existingId) {
				idsByTypes.set(key, id);
				continue;
			}
			const existing = records.value[existingId]!;
			if (!existing.attached && record.attached) {
				existing.attached = true;
				existing.definition = record.definition;
				existing.listState = record.listState;
				existing.enabled = record.enabled;
				existing.mapped ||= record.mapped;
				runtimeDatasets.get(existingId)?.model?.applyListState(record.listState);
			}
			aliases.value[id] = existingId;
			removeDataset(id);
		}
	}

	function reconcileConfiguredDatasets(): void {
		const available = new Set<string>();
		const registeredTypes = new Set<string>();
		for (const config of mapDatasets) {
			const typesKey = dataTypesKey(config.dataTypes);
			if (registeredTypes.has(typesKey)) continue;
			registeredTypes.add(typesKey);
			if (!metadataStore.simpleItems.some((item) => config.dataTypes.includes(item.dataType)))
				continue;
			available.add(config.id);
			const previousId = Object.entries(records.value).find(([, record]) =>
				matchesDataTypes(record.definition, config),
			)?.[0];
			if (previousId && previousId !== config.id) {
				const record = records.value[previousId]!;
				runtimeDatasets.get(previousId)?.dispose();
				runtimeDatasets.delete(previousId);
				Reflect.deleteProperty(records.value, previousId);
				records.value[config.id] = record;
				aliases.value[previousId] = config.id;
			}
			const existing = records.value[config.id];
			if (existing) {
				existing.configured = true;
				existing.mapped = true;
				existing.title = config.title;
				existing.definition = {
					dataTypes: [...config.dataTypes],
					filterListBy: existing.attached ? existing.definition.filterListBy : config.filterListBy,
				};
				existing.color = config.color;
				existing.defaultFacets = config.defaultFacets ?? {};
			} else {
				records.value[config.id] = {
					...createRecord(config.title, config, config.color, true),
					defaultFacets: config.defaultFacets ?? {},
				};
			}
		}
		for (const [id, record] of Object.entries(records.value)) {
			if (record.configured && !available.has(id)) removeDataset(id);
		}
	}

	async function initialize(options: { reuseHydratedState?: boolean } = {}): Promise<void> {
		if (inFlight) return inFlight;
		inFlight = Promise.resolve().then(() => {
			const source = metadataStore.initialization;
			if (!source?.ready) return;
			const snapshot = { ...source, registryVersion: mapDatasetRegistryVersion };
			const reuseExistingState = options.reuseHydratedState ?? initialization.value !== null;
			if (
				!reuseExistingState ||
				JSON.stringify(initialization.value) !== JSON.stringify(snapshot)
			) {
				if (initialization.value?.projectIdentity !== source.projectIdentity) {
					for (const id of Object.keys(records.value)) removeDataset(id);
					aliases.value = {};
				}
				consolidateDatasets();
				reconcileConfiguredDatasets();
				initialization.value = snapshot;
			}
			if (import.meta.client) attachRuntimeModels();
		});
		try {
			await inFlight;
		} finally {
			// eslint-disable-next-line require-atomic-updates -- concurrent callers only await the shared promise
			inFlight = null;
		}
	}

	watch(
		() => metadataStore.initialization,
		(snapshot) => {
			if (snapshot?.ready && initialization.value) void initialize();
		},
	);

	function resolveDatasetId(
		id: string,
		params: DataListWindowItem["params"],
		fallbackId = id,
	): string {
		return (
			Object.entries(records.value).find(([, record]) =>
				matchesDataTypes(record.definition, params),
			)?.[0] ??
			(records.value[id]
				? fallbackId !== id
					? fallbackId
					: `data-types:${dataTypesKey(params.dataTypes)}`
				: id)
		);
	}

	function attachList(
		id: string,
		title: string,
		params: DataListWindowItem["params"],
		fallbackId = id,
	) {
		const resolvedId = resolveDatasetId(id, params, fallbackId);
		if (resolvedId !== id && !records.value[id]?.configured) aliases.value[id] = resolvedId;
		return ensureDataset(resolvedId, title, params);
	}

	function mergeMapLayers(savedLayers: Array<DataListMapLayer> = []): Array<DataListMapLayer> {
		return [
			...Object.values(layers.value),
			...savedLayers.filter(
				(layer) =>
					!records.value[layer.id] &&
					!aliases.value[layer.id] &&
					!mapDatasets.some((config) => config.id === layer.id),
			),
		];
	}

	function ensureDataset(id: string, title: string, params: DataListWindowItem["params"]) {
		const resolvedId = resolveDatasetId(id, params);
		if (resolvedId !== id) aliases.value[id] = resolvedId;
		const record = records.value[resolvedId];
		if (record) {
			if (!runtimeDatasets.has(resolvedId))
				runtimeDatasets.set(resolvedId, createDataset(resolvedId));
			const dataset = runtimeDatasets.get(resolvedId)!;
			if (!record.attached) {
				record.attached = true;
				if (params.filterListBy) record.definition.filterListBy = params.filterListBy;
				if (params.listState) dataset.model?.applyListState(params.listState);
				if (params.mapEnabled != null) setEnabled(resolvedId, params.mapEnabled);
			}
			return dataset;
		}
		records.value[resolvedId] = createRecord(title, params, colorFor(resolvedId));
		const dataset = createDataset(resolvedId);
		runtimeDatasets.set(resolvedId, dataset);
		return dataset;
	}

	function setEnabled(id: string, enabled: boolean) {
		const dataset = runtimeDatasets.get(id);
		if (!dataset) return;
		if (enabled) dataset.mapped.value = true;
		dataset.enabled.value = enabled;
	}

	function toggleLayer(id: string) {
		const dataset = runtimeDatasets.get(id);
		if (dataset) setEnabled(id, !dataset.enabled.value);
	}

	function removeDataset(id: string) {
		runtimeDatasets.get(id)?.dispose();
		runtimeDatasets.delete(id);
		Reflect.deleteProperty(records.value, id);
	}

	onScopeDispose(() => {
		runtimeDatasets.forEach((dataset) => {
			dataset.dispose();
		});
		runtimeDatasets.clear();
	});

	return {
		datasets,
		records,
		aliases,
		attachList,
		mergeMapLayers,
		initialization,
		initialize,
		resolveDatasetId,
		layers,
		colorFor,
		resolveMarkers,
		ensureDataset,
		setEnabled,
		toggleLayer,
		removeDataset,
	};
});
