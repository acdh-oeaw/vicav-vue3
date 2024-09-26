<!-- eslint-disable @typescript-eslint/sort-type-constituents -->
<script lang="ts" setup>
import type { DataListWindowItem, DataTypesEnum } from "@/types/global.d";
import type { simpleTEIMetadata } from "@/types/teiCorpus.d";

import dataTypes from "../config/dataTypes";

interface Props {
	params: DataListWindowItem["params"];
}

const debug = false;

const props = defineProps<Props>();

const { simpleItems /* rawItems */ } = useTEIHeaders();
// Four grouping levels: country, region, place, dataType
type groupedByDataType = Record<DataTypesEnum, Array<simpleTEIMetadata>>; //L4
type groupedByPlace = Record<string, groupedByDataType>; //L3
type groupedByRegion = Record<string, groupedByPlace>; //L2
type groupedByCountry = Record<string, groupedByRegion>; //L1

const groupedItems = getGroupedItems(
	simpleItems.value,
	["place.country", "place.region", "place.settlement", "dataType"],
	"dataType",
	props.params.dataTypes,
	"label",
	props.params.filterListBy,
) as groupedByCountry;
const openNewWindowFromAnchor = useAnchorClickHandler();

const debugString = debug ? JSON.stringify(groupedItems, null, 2) : "";
</script>

<template>
	<div v-if="groupedItems" class="relative isolate grid size-full overflow-auto">
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
				<h4 v-if="region !== ''" class="text-lg italic">{{ region }}</h4>
				<h4 v-else-if="Object.keys(itemsByRegion).length > 1" class="text-lg italic">
					Unspecified region
				</h4>
				<div v-for="(itemsBydataType, place) in itemsByPlace" :key="place" class="p-2">
					<h5 v-if="place !== ''" class="text-base font-bold">
						{{ place }}
					</h5>
					<h5 v-else class="text-base font-bold">Unspecified place</h5>
					<div v-for="(items, dataType) in itemsBydataType as groupedByDataType" :key="dataType">
						<em v-if="params.dataTypes.length > 1" class="text-sm italic">
							{{ dataTypes[dataType]!.name }}
						</em>
						<ul v-for="item in items" :key="item.id">
							<li class="text-base">
								<a
									v-if="item.dataType !== 'CorpusText' || item['@hasTEIw'] === 'true'"
									class="text-primary underline"
									:data-target-type="dataTypes[dataType].targetType"
									:data-text-id="item.id"
									href="#"
									@click="openNewWindowFromAnchor"
								>
									{{ item.label }}
								</a>
								<span v-else> {{ item.label }} </span>
								<span
									v-if="
										item.teiHeader.fileDesc.sourceDesc.recordingStmt &&
										(item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.media?.['@url'] ||
											item.teiHeader.fileDesc.sourceDesc.recordingStmt.recording.p?.ref)
									"
								>
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
