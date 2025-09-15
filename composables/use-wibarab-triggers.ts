// Adapted from https://reka-ui.com/examples/combobox-textarea

import { storeToRefs } from "pinia";

import type { TriggerMap } from "@/components/searchbar";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

function getFeatureList() {
	const table = tables.value.get(url);
	if (!table) return [];
	const features = table
		.getAllLeafColumns()
		.filter((column) => column.getCanFilter())
		.map((column) => ({
			value: `${column.id}:`,
			displayValue: column.columnDef.header! as string,
			col: column,
		}));
	return features;
}
const features = computed(() => getFeatureList());

function getValueList(columns: typeof features.value) {
	const table = tables.value.get(url);
	if (!table) return [];
	return columns
		.map((item) =>
			(
				[
					...new Set(table.getCoreRowModel().flatRows.flatMap((row) => row.getValue(item.col.id))),
				] as Array<string>
			).map((key: string) => ({
				value: `"${key}"`,
				displayValue: key,
			})),
		)
		.flat();
}

function getMetaInfoList() {
	const excludedMetaInfoKeys = new Set(["source_representations", "examples", "resp"]);

	const table = tables.value.get(url);
	const metaInfo = new Map<string, Set<string>>();
	if (!table) return new Map() as TriggerMap;
	table.getCoreRowModel().rows.forEach((row) => {
		Object.values(
			row.original.properties as Record<string, Record<string, Array<Record<string, unknown>>>>,
		).forEach((featureValues) => {
			if (typeof featureValues === "string") return;
			Object.values(featureValues).forEach((featureValueInfos) => {
				featureValueInfos.forEach((featureValueInfo) => {
					Object.entries(featureValueInfo).forEach(([key, val]) => {
						if (excludedMetaInfoKeys.has(key)) return;
						if (!metaInfo.has(key)) metaInfo.set(key, new Set());
						if (Array.isArray(val)) val.forEach((v: string) => metaInfo.get(key)?.add(v));
						else if (typeof val === "string") metaInfo.get(key)?.add(val);
						else {
							if ("short_cit" in (val as Record<string, string>))
								metaInfo.get(key)?.add((val as Record<string, string>).short_cit!);
						}
					});
				});
			});
		});
	});
	return new Map(
		[...metaInfo.entries()].map(([key, val]) => [
			key,
			[...val].map((v) => ({
				value: `"${v}"`,
				displayValue: v,
			})),
		]),
	);
}
const metaInfo = computed(() => getMetaInfoList());
const metaInfoKeys = computed(() =>
	[...metaInfo.value.keys()].map((key) => ({ value: `${key}:`, displayValue: key })),
);

const operators = ["and", "or"].map((o) => ({ displayValue: o, value: o.toUpperCase() }));

const wibarabTriggers = computed(() => {
	const map = {
		'" ': operators,
		") ": operators,
		...Object.fromEntries(features.value.map((f) => [f.value, getValueList([f])])),
		...Object.fromEntries([...metaInfo.value.entries()].map(([key, val]) => [`${key}:`, val])),
		"": [...features.value, ...metaInfoKeys.value],
	};

	return new Map(Object.entries(map));
});

export function useWibarabTriggers() {
	return { wibarabTriggers, metaInfo };
}
