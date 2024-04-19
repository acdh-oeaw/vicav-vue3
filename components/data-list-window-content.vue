<script lang="ts" setup>
import type { DataListWindowItem } from "@/types/global.d";

import contentTypes from "../config/contentTypes";

interface Props {
	params: DataListWindowItem["params"];
}

interface teiSettlement {
	"@lang": string;
	$: string;
}

interface teiHeader {
	"@id": string;
	teiHeader: {
		fileDesc: { titleStmt: { title: { $: string } } };
		profileDesc: {
			taxonomy: { category: { "@id": string; $: string } };
		};
		particDesc: {
			person: {
				"@sex": string;
				"@age": string;
				$: string;
			};
		};
		settingDesc: {
			place: {
				settlement: Array<teiSettlement>;
				region: { $: string };
				country: { $: string };
				location: { geo: { $: string } };
			};
		};
	};
}

interface TEIs {
	"@id": string;
	TEIs: Array<teiHeader>;
}

const props = defineProps<Props>();
const { data: projectData } = useProjectInfo();

const rawItems: ComputedRef<Array<TEIs>> = computed(() => {
	return projectData.value?.projectConfig?.staticData?.table?.filter((v) => {
		const contentType = Object.values(contentTypes).find((c) => c.collection === v["@id"]);
		return props.params.dataTypes.includes(contentType.targetType);
	}) as Array<TEIs>;
});

const groupedItems: ComputedRef<Record<string, Array<TEIs>>> = computed(() => {
	// Group by country
	const collectedItems = [].concat(...rawItems.value.map((el) => el.TEIs));
	console.log(collectedItems.length);
	let groupedByCountry = Object.groupBy(collectedItems, (item) => {
		return item.teiHeader.profileDesc.settingDesc.place.country.$;
	});
	// Group by region
	for (const country in groupedByCountry) {
		groupedByCountry[country] = Object.groupBy(groupedByCountry[country], (item) => {
			return item.teiHeader.profileDesc.settingDesc.place.region.$;
		});

		// Group by place
		for (const region in groupedByCountry[country]) {
			groupedByCountry[country][region] = Object.groupBy(
				groupedByCountry[country][region],
				(item) => {
					return item.teiHeader.profileDesc.settingDesc.place.settlement.name.$;
				},
			);

			// Group by content type
			for (const place in groupedByCountry[country][region]) {
				groupedByCountry[country][region][place] = Object.groupBy(
					groupedByCountry[country][region][place],
					(item) => {
						return item.teiHeader.profileDesc.taxonomy.categories[0]["@id"];
					},
				);

				for (const contentType in groupedByCountry[country][region][place]) {
					groupedByCountry[country][region][place][contentType] = groupedByCountry[country][region][
						place
					][contentType].sort((a, b) => {
						if (a.teiHeader.profileDesc.particDesc?.person) {
							return a.teiHeader.profileDesc.particDesc.person.$.localeCompare(
								b.teiHeader.profileDesc.particDesc.person.$,
							);
						} else {
							return a.teiHeader.profileDesc.settingDesc.place.settlement.name.$.localeCompare(
								b.teiHeader.profileDesc.settingDesc.place.settlement.name.$,
							);
						}
					});
				}
			}
		}
	}

	return groupedByCountry;
});

const openNewWindowFromAnchor = useAnchorClickHandler();
</script>

<template>
	<div v-if="groupedItems" class="relative isolate grid h-full w-full overflow-auto">
		<div v-for="(itemsByRegion, country) in groupedItems" :key="country" class="p-2">
			<h2 v-if="groupedItems.values?.length > 1" class="text-lg">{{ country }}</h2>
			<div v-for="(itemsByPlace, region) in itemsByRegion" :key="region" class="p-2 text-base">
				<h4 class="text-lg italic">{{ region }}</h4>
				<div v-for="(itemsByContentType, place) in itemsByPlace" :key="place" class="p-2">
					<h5 class="text-base font-bold">
						{{ place }}
					</h5>
					<div v-for="(items, contentType) in itemsByContentType" :key="contentType">
						<em v-if="params.dataTypes.length > 1" class="text-sm italic">
							{{ contentType }}
						</em>
						<ul v-for="item in items" :key="item['@id']">
							<li class="text-base">
								<a
									class="text-primary underline"
									href="#"
									:data-target-type="contentTypes[contentType].targetType"
									:data-text-id="item['@id']"
									@click="openNewWindowFromAnchor"
								>
									<span v-if="item.teiHeader.profileDesc.particDesc?.person">
										{{ item.teiHeader.profileDesc.particDesc.person.$ }}
									</span>
									<span v-else>
										{{ item.teiHeader.profileDesc.settingDesc.place.settlement.name.$ }}
									</span>
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
