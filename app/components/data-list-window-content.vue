<!-- eslint-disable @typescript-eslint/sort-type-constituents -->
<script lang="ts" setup>
import { Volume2, VolumeX } from "@lucide/vue";

import CorpusTextDataList from "@/components/corpus-text-data-list.vue";
import FeatureDataList from "@/components/feature-data-list.vue";
import ProfileDataList from "@/components/profile-data-list.vue";
import SampleTextDataList from "@/components/sample-text-data-list.vue";
import dataTypes from "@/config/dataTypes.ts";
import { useDataListMapStore } from "@/stores/use-data-list-map-store.ts";
import { groupSimpleItems } from "@/stores/use-tei-headers-store.ts";
import { narrowScreenBreakpoint } from "@/stores/use-windows-store.ts";
import type { DataListWindowItem, DataTypesEnum } from "@/types/global.ts";
import { windowRootId } from "@/utils/constants.ts";

interface Props {
	params: DataListWindowItem["params"];
	windowId: string;
	title: string;
}

const debug = false;

const props = defineProps<Props>();
const emit = defineEmits<{
	"update:params": [params: DataListWindowItem["params"]];
}>();

const dataListMapStore = useDataListMapStore();
const windowsStore = useWindowsStore();
const specializedListType = computed(() => {
	if (props.params.dataTypes.length !== 1) return undefined;

	switch (props.params.dataTypes[0]) {
		case "CorpusText":
		case "Feature":
		case "Profile":
		case "SampleText":
			return props.params.dataTypes[0];
		default:
			return undefined;
	}
});

const openNewWindowFromAnchor = useAnchorClickHandler();

const listMapId = computed(() =>
	dataListMapStore.resolveDatasetId(
		props.params.mapSyncId ?? props.windowId,
		props.params,
		props.windowId,
	),
);
const dataset = computed(() =>
	dataListMapStore.attachList(
		props.params.mapSyncId ?? props.windowId,
		props.title,
		props.params,
		props.windowId,
	),
);

const filteredItems = computed(() => dataset.value.items.value);
const groupedItems = computed(() =>
	groupSimpleItems(filteredItems.value, { dataTypes: props.params.dataTypes }),
);
watch(
	() => props.params.mapEnabled,
	(enabled) => {
		if (enabled != null) dataListMapStore.setEnabled(listMapId.value, enabled);
	},
);
watch(
	() => props.title,
	(title) => {
		if (!dataListMapStore.records[listMapId.value]?.configured) dataset.value.title.value = title;
	},
);
watch(
	() => [
		dataset.value.definition.value.filterListBy,
		dataset.value.enabled.value,
		dataListMapStore.records[listMapId.value]?.listState,
		listMapId.value,
	],
	() => {
		syncSharedListParams();
		if (dataset.value.enabled.value) void nextTick(splitDataListAndMapWindows);
	},
	{ deep: true, immediate: true },
);

function syncSharedListParams(): void {
	const params = {
		...props.params,
		filterListBy: dataset.value.definition.value.filterListBy,
		mapSyncId: listMapId.value,
		mapEnabled: dataset.value.enabled.value,
		listState: dataListMapStore.records[listMapId.value]?.listState,
	};
	if (JSON.stringify(props.params) !== JSON.stringify(params)) emit("update:params", params);
}

function splitDataListAndMapWindows(): void {
	const viewport = document.getElementById(windowRootId)?.getBoundingClientRect();
	if (!viewport || viewport.width < narrowScreenBreakpoint) return;

	const windows = Array.from(windowsStore.registry.values());
	const map = windows.find(
		(window) => window.targetType === "WMap" && window.params.endpoint === "data_markers",
	);
	const lists = windows.filter((window) => window.targetType === "DataList");
	if (!map || lists.length === 0) return;

	const mapWidth = Math.floor(viewport.width / 2);
	const listWidth = viewport.width - mapWidth;
	map.winbox.resize(mapWidth, viewport.height).move(listWidth, 0);

	lists.forEach((list, index) => {
		const top = Math.floor((index * viewport.height) / lists.length);
		const bottom = Math.floor(((index + 1) * viewport.height) / lists.length);
		list.winbox.resize(listWidth, bottom - top).move(0, top);
	});
}

const debugString = computed(() => (debug ? JSON.stringify(groupedItems.value, null, 2) : ""));

function updateListState(listState: DataListWindowItem["params"]["listState"]) {
	const record = dataListMapStore.records[listMapId.value];
	if (record && JSON.stringify(record.listState) !== JSON.stringify(listState))
		record.listState = listState;
	syncSharedListParams();
}

function getDataTypeName(dataType: string): string {
	return dataTypes[dataType as DataTypesEnum]?.name ?? dataType;
}

function getTargetType(dataType: string): string {
	return dataTypes[dataType as DataTypesEnum]?.targetType ?? dataType;
}

function countItemsByPlace(itemsByPlace: Record<string, Record<string, Array<unknown>>>): number {
	return Object.values(itemsByPlace).flat(2).length;
}

function hierarchyLevelClass(level: string | number): string {
	return level === "" ? "" : "p-2";
}
</script>

<template>
	<CorpusTextDataList
		v-if="specializedListType === 'CorpusText'"
		:key="listMapId"
		:dataset-id="listMapId"
		:items="filteredItems"
		:list-state="params.listState"
		@update:list-state="updateListState"
	/>
	<SampleTextDataList
		v-else-if="specializedListType === 'SampleText'"
		:key="listMapId"
		:dataset-id="listMapId"
		:items="filteredItems"
		:list-state="params.listState"
		@update:list-state="updateListState"
	/>
	<FeatureDataList
		v-else-if="specializedListType === 'Feature'"
		:key="listMapId"
		:dataset-id="listMapId"
		:items="filteredItems"
		:list-state="params.listState"
		@update:list-state="updateListState"
	/>
	<ProfileDataList
		v-else-if="specializedListType === 'Profile'"
		:key="listMapId"
		:dataset-id="listMapId"
		:items="filteredItems"
		:list-state="params.listState"
		@update:list-state="updateListState"
	/>
	<div v-else-if="groupedItems" class="relative isolate grid size-full overflow-auto">
		<div v-if="debug">
			<label for="debug">Debug</label>
			<br />
			<textarea
				id="debug"
				class="h-[100px] w-[1024px]"
				cols="25"
				rows="80"
				:value="debugString"
			></textarea>
		</div>
		<div
			v-for="(itemsByRegion, country) in groupedItems"
			:key="country"
			:class="hierarchyLevelClass(country)"
		>
			<h2 v-if="country !== ''" class="text-lg">
				{{ country }}
			</h2>
			<div
				v-for="(itemsByPlace, region) in itemsByRegion"
				:key="region"
				class="text-base"
				:class="hierarchyLevelClass(region)"
			>
				<h4 v-if="region !== ''" class="text-lg italic">
					{{ region }}
					<span v-if="countItemsByPlace(itemsByPlace) > 1"
						>({{ countItemsByPlace(itemsByPlace) }})</span
					>
				</h4>
				<div
					v-for="(itemsBydataType, place) in itemsByPlace"
					:key="place"
					:class="hierarchyLevelClass(place)"
				>
					<h5 v-if="place !== ''" class="text-base font-bold">
						{{ place.replace(/^zzz_/, "") }}
					</h5>
					<div v-for="(items, dataType) in itemsBydataType" :key="dataType">
						<em v-if="params.dataTypes.length > 1" class="text-sm italic">
							{{ getDataTypeName(dataType) }}
						</em>
						<ul v-for="item in items" :key="item.id">
							<li class="flex text-base">
								<a
									v-if="item.dataType !== 'CorpusText' || item['@hasTEIw'] === 'true'"
									class="text-primary underline"
									:data-target-type="getTargetType(dataType)"
									:data-text-id="item.id"
									href="#"
									@click="openNewWindowFromAnchor"
								>
									{{ item.label }}
								</a>
								<span v-else> {{ item.label }} </span>
								<span> &nbsp; </span>
								<span v-if="item.dataType !== 'Feature' && item.dataType !== 'Profile'">
									<span
										v-if="item.audioAvailability === 'free'"
										title="Audio recording is publicly available"
									>
										<Volume2 class="mx-2 mt-0.5 size-5" />
									</span>
									<span v-else title="Audio recording is restricted">
										<VolumeX class="mx-2 mt-0.5 size-5" />
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
