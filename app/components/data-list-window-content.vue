<!-- eslint-disable @typescript-eslint/sort-type-constituents -->
<script lang="ts" setup>
import { Volume2, VolumeX } from "lucide-vue-next";

import CorpusTextDataList from "@/components/corpus-text-data-list.vue";
import FeatureDataList from "@/components/feature-data-list.vue";
import SampleTextDataList from "@/components/sample-text-data-list.vue";
import dataTypes from "@/config/dataTypes.ts";
import {
	type SimpleMetadataAccessorKey,
	simpleMetadataAccessors,
	useTeiHeadersStore,
} from "@/stores/use-tei-headers-store.ts";
import type { DataListWindowItem, DataTypesEnum } from "@/types/global.ts";

interface Props {
	params: DataListWindowItem["params"];
}

const debug = false;

const props = defineProps<Props>();

const teiHeadersStore = useTeiHeadersStore();
const { simpleItems } = storeToRefs(teiHeadersStore);
const isCorpusTextList = computed(() => {
	return props.params.dataTypes.length === 1 && props.params.dataTypes[0] === "CorpusText";
});
const isFeatureList = computed(() => {
	return props.params.dataTypes.length === 1 && props.params.dataTypes[0] === "Feature";
});
const isSampleTextList = computed(() => {
	return props.params.dataTypes.length === 1 && props.params.dataTypes[0] === "SampleText";
});

function normalizeFilterListBy() {
	const filter = props.params.filterListBy;
	if (!filter) return undefined;
	if (!Object.hasOwn(simpleMetadataAccessors, filter.key)) return undefined;

	return filter as { key: SimpleMetadataAccessorKey; value: string };
}

const groupedItems = computed(() => {
	return teiHeadersStore.getGroupedSimpleItems({
		dataTypes: props.params.dataTypes,
		filterListBy: normalizeFilterListBy(),
	});
});
const openNewWindowFromAnchor = useAnchorClickHandler();

const debugString = computed(() => (debug ? JSON.stringify(groupedItems.value, null, 2) : ""));

function getDataTypeName(dataType: string): string {
	return dataTypes[dataType as DataTypesEnum]?.name ?? dataType;
}

function getTargetType(dataType: string): string {
	return dataTypes[dataType as DataTypesEnum]?.targetType ?? dataType;
}
</script>

<template>
	<CorpusTextDataList v-if="isCorpusTextList" :items="simpleItems" />
	<SampleTextDataList v-else-if="isSampleTextList" :items="simpleItems" />
	<FeatureDataList v-else-if="isFeatureList" :items="simpleItems" />
	<div v-else-if="groupedItems" class="relative isolate grid size-full overflow-auto">
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
			<h2 v-if="Object.keys(groupedItems).length > 1 && country !== ''" class="text-lg">
				{{ country }}
			</h2>
			<h2 v-else-if="Object.keys(groupedItems).length > 1" class="text-lg">Unspecified country</h2>
			<div v-for="(itemsByPlace, region) in itemsByRegion" :key="region" class="p-2 text-base">
				<h4 v-if="region !== ''" class="text-lg italic">
					{{ region }}
					<span v-if="Object.values(itemsByPlace).flat(2).length > 1"
						>({{ Object.values(itemsByPlace).flat(2).length }})</span
					>
				</h4>
				<h4 v-else-if="Object.keys(itemsByRegion).length > 1" class="text-lg italic">
					Unspecified region
				</h4>
				<div v-for="(itemsBydataType, place) in itemsByPlace" :key="place" class="p-2">
					<h5 v-if="place !== ''" class="text-base font-bold">
						{{ place.replace(/^zzz_/, "") }}
					</h5>
					<h5 v-else class="text-base font-bold">Unspecified place</h5>
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
