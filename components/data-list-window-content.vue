<!-- eslint-disable @typescript-eslint/sort-type-constituents -->
<script lang="ts" setup>
import { useTEIHeaders } from "@/composables/use-tei-headers";
import type { DataListWindowItem, DataTypesEnum, simpleTEIMetadata } from "@/types/global.d";

import dataTypes from "../config/dataTypes";

interface Props {
	params: DataListWindowItem["params"];
}

const debug = false;

const props = defineProps<Props>();

const { simpleItems /* rawItems */ } = useTEIHeaders();
// Four grouping levels: country, region, place, dataType
type groupedByDataType = Record<DataTypesEnum, Array<simpleTEIMetadata>>;
type groupedByAnyString = Record<string, Array<simpleTEIMetadata>>;
type groupedByPlace = Record<string, groupedByAnyString>;
type groupedByRegion = Record<string, groupedByPlace>;
type groupedItemType = Record<string, groupedByRegion>;
type GroupedTypes = groupedByAnyString | groupedByPlace | groupedByRegion | groupedItemType;

// https://gist.github.com/andrewchilds/30a7fb18981d413260c7a36428ed13da?permalink_comment_id=4433741#gistcomment-4433741
type GetReturnType<T> = T | undefined;
type ValueType = Record<string | number, unknown>;

function deepGet<T>(
	value: unknown,
	query: string | Array<string | number>,
	defaultVal: GetReturnType<T> = undefined,
): GetReturnType<T> {
	const splitQuery = Array.isArray(query)
		? query
		: query
				.replace(/(\[(\d)\])/g, ".$2")
				.replace(/^\./, "")
				.split(".");

	if (!splitQuery.length || splitQuery[0] === undefined) return value as T;

	const key = splitQuery[0];

	if (
		typeof value !== "object" ||
		value === null ||
		!(key in value) ||
		(value as ValueType)[key] === undefined
	) {
		return defaultVal;
	}

	return deepGet((value as ValueType)[key], splitQuery.slice(1), defaultVal);
}

const orderByGroup = function (unordered: Record<string, Array<simpleTEIMetadata>>) {
	return Object.keys(unordered)
		.sort()
		.reduce((obj: Record<string, Array<simpleTEIMetadata>>, key: string) => {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			obj[key] = unordered[key]!;
			return obj;
		}, {});
};

const getGroupedItems = function (dataTypesFilter: Array<string>) {
	// Group by country
	const collectedItems = simpleItems.value
		.filter((item) => {
			return (
				dataTypesFilter.includes(deepGet(item, "dataType") ?? "") &&
				((deepGet(item, "dataType") ?? "") !== "CorpusText" || (deepGet(item, "hasTEIw") ?? false))
			);
		})
		.sort((a, b) => {
			return (deepGet<string>(a, "label") ?? "").localeCompare(deepGet(b, "label") ?? "");
		});

	const groupedByCountry = Object.groupBy(collectedItems, (item: simpleTEIMetadata) => {
		return deepGet(item, "place.country") ?? "";
	}) as GroupedTypes;

	// Group by region
	for (const country in groupedByCountry as Record<string, Array<simpleTEIMetadata>>) {
		(groupedByCountry as groupedByPlace)[country] = orderByGroup(
			Object.groupBy(
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				(groupedByCountry as Record<string, Array<simpleTEIMetadata>>)[country]!,
				(item: simpleTEIMetadata) => {
					return deepGet(item, "place.region") ?? "";
				},
			),
		);

		// Group by place
		for (const region in (groupedByCountry as groupedByPlace)[country]) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			(groupedByCountry as groupedByRegion)[country]![region] = orderByGroup(
				Object.groupBy(
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					(groupedByCountry as groupedByPlace)[country]![region]!,
					(item: simpleTEIMetadata) => {
						return deepGet(item, "place.settlement") ?? "";
					},
				),
			);

			// Group by content type
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			for (const place in (groupedByCountry as groupedByRegion)[country]![region]) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				(groupedByCountry as groupedItemType)[country]![region]![place] = Object.groupBy(
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					(groupedByCountry as groupedByRegion)[country]![region]![place]!,
					(item) => {
						return deepGet(item, "dataType") ?? "";
					},
				);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				for (const dataType in (groupedByCountry as groupedItemType)[country]![region]![place]!) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					(groupedByCountry as groupedItemType)[country]![region]![place]![dataType] = (
						groupedByCountry as groupedItemType
					)[country]![region]![place]![dataType]!.sort((a, b) => {
						return (deepGet<string>(a, "label") ?? "").localeCompare(deepGet(b, "label") ?? "");
					});
				}
			}
		}
	}

	return groupedByCountry as groupedItemType;
};
const groupedItems = getGroupedItems(props.params.dataTypes);
const openNewWindowFromAnchor = useAnchorClickHandler();
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const debugString = debug ? JSON.stringify(groupedItems, null, 2) : "";
</script>

<template>
	<div v-if="groupedItems" class="relative isolate grid h-full w-full overflow-auto">
		<div v-if="debug">
			<label for="debug">Debug</label>
			<br />
			<textarea
				id="debug"
				cols="25"
				rows="80"
				style="width: 1024px; height: 100px"
				:value="debugString"
			></textarea>
		</div>
		<div v-for="(itemsByRegion, country) in groupedItems" :key="country" class="p-2">
			<h2 v-if="Object.keys(groupedItems).length > 1" class="text-lg">{{ country }}</h2>
			<div v-for="(itemsByPlace, region) in itemsByRegion" :key="region" class="p-2 text-base">
				<h4 class="text-lg italic">{{ region }}</h4>
				<div v-for="(itemsBydataType, place) in itemsByPlace" :key="place" class="p-2">
					<h5 class="text-base font-bold">
						{{ place }}
					</h5>
					<div v-for="(items, dataType) in itemsBydataType as groupedByDataType" :key="dataType">
						<em v-if="params.dataTypes.length > 1" class="text-sm italic">
							{{ dataTypes[dataType]!.name }}
						</em>
						<ul v-for="item in items" :key="item.id">
							<li class="text-base">
								<a
									v-if="item.dataType !== 'CorpusText' || item.hasTEIw"
									class="text-primary underline"
									href="#"
									:data-target-type="dataTypes[dataType]!.targetType"
									:data-text-id="item.id"
									@click="openNewWindowFromAnchor"
								>
									{{ item.label }}
								</a>
								<span v-if="item.teiHeader.fileDesc.sourceDesc.recordingStmt">
									&nbsp; {{ item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording["@type"] }}
									<span v-if="item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.media">
										: {{ item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.media["@url"] }}
									</span>
									<span v-if="item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.p?.ref">
										:
										{{
											item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.p.ref["@target"]
										}}
									</span>
									<span v-if="item.teiHeader.profileDesc?.settingDesc?.setting?.placeName.$">
										:
										{{ item.teiHeader.profileDesc.settingDesc.setting.placeName.$ }}
									</span>
								</span>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
