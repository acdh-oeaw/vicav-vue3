<script lang="ts" setup>
import { useTEIHeaders } from "@/composables/use-tei-headers";
import type { DataListWindowItem } from "@/types/global.d";

import dataTypes from "../config/dataTypes";

interface Props {
	params: DataListWindowItem["params"];
}

const props = defineProps<Props>();

const { simpleItems } = useTEIHeaders();
// Four grouping levels: country, region, place, dataType
type groupedItemType = Record<string, groupedByRegion>;
type groupedByDataType = Record<string, Array<simpleTEIMetadata>>;
type groupedByPlace = Record<string, groupedByDataType>;
type groupedByRegion = Record<string, groupedByPlace>;
type GroupedTypes = groupedByDataType | groupedByPlace | groupedByRegion;

const orderByGroup = function (unordered: GroupedTypes) {
	return Object.keys(unordered)
		.sort()
		.reduce((obj: Record<string, GroupedTypes>, key: string) => {
			obj[key] = unordered[key];
			return obj;
		}, {});
};

const getGroupedItems: ComputedRef<groupedItemType> = function (dataTypesFilter: Array<string>) {
	// Group by country
	const collectedItems = simpleItems.value
		.filter((item) => {
			return dataTypesFilter.includes(item.dataType);
		})
		.sort((a, b) => {
			return a.label.localeCompare(b.label);
		});

	const groupedByCountry = Object.groupBy(collectedItems, (item: simpleTEIMetadata) => {
		return item.place.country;
	});

	// Group by region
	for (const country in groupedByCountry) {
		if (groupedByCountry[country]) {
			groupedByCountry[country] = orderByGroup(
				Object.groupBy(groupedByCountry[country], (item: simpleTEIMetadata) => {
					return item.place.region;
				}),
			);
		}

		// Group by place
		for (const region in groupedByCountry[country]) {
			groupedByCountry[country][region] = orderByGroup(
				Object.groupBy(groupedByCountry[country][region], (item: simpleTEIMetadata) => {
					return item.place.name;
				}),
			);

			// Group by content type
			for (const place in groupedByCountry[country][region]) {
				groupedByCountry[country][region][place] = Object.groupBy(
					groupedByCountry[country][region][place],
					(item) => {
						return item.dataType;
					},
				);

				for (const dataType in groupedByCountry[country][region][place]) {
					groupedByCountry[country][region][place][dataType] = groupedByCountry[country][region][
						place
					][dataType].sort((a, b) => {
						return a.label.localeCompare(b.label);
					});
				}
			}
		}
	}

	return groupedByCountry;
};
const groupedItems = getGroupedItems(props.params.dataTypes);
const openNewWindowFromAnchor = useAnchorClickHandler();
</script>

<template>
	<div v-if="groupedItems" class="relative isolate grid h-full w-full overflow-auto">
		<div v-for="(itemsByRegion, country) in groupedItems" :key="country" class="p-2">
			<h2 v-if="groupedItems.values?.length > 1" class="text-lg">{{ country }}</h2>
			<div v-for="(itemsByPlace, region) in itemsByRegion" :key="region" class="p-2 text-base">
				<h4 class="text-lg italic">{{ region }}</h4>
				<div v-for="(itemsBydataType, place) in itemsByPlace" :key="place" class="p-2">
					<h5 class="text-base font-bold">
						{{ place }}
					</h5>
					<div v-for="(items, dataType) in itemsBydataType" :key="dataType">
						<em v-if="params.dataTypes.length > 1" class="text-sm italic">
							{{ dataTypes[dataType].name }}
						</em>
						<ul v-for="item in items" :key="item.id">
							<li class="text-base">
								<a
									class="text-primary underline"
									href="#"
									:data-target-type="dataTypes[dataType].targetType"
									:data-text-id="item.id"
									@click="openNewWindowFromAnchor"
								>
									{{ item.label }}
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
