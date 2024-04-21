<script lang="ts" setup>
import type { DataListWindowItem } from "@/types/global.d";

import dataTypes from "../config/dataTypes";

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

interface simpleTEIMetadata {
	id: string;
	label: string;
	dataType: string;
	place: {
		settlement: string;
		country: string;
		region: string;
	};
	person: {
		name: string;
		sex: string;
		age: string;
	};
}

const props = defineProps<Props>();
const { data: projectData } = useProjectInfo();

const rawItems: ComputedRef<Array<TEIs>> = computed(() => {
	return projectData.value?.projectConfig?.staticData?.table?.filter((v) => {
		const dataType = Object.values(dataTypes).find((c) => c.collection === v["@id"]);
		return props.params.dataTypes.includes(dataType.targetType);
	}) as Array<TEIs>;
});

const extractMetadata = function (item: teiHeader) {
	const place = item.teiHeader.profileDesc.settingDesc?.place;
	let template = {
		id: "",
		place: {
			name: "",
			region: "",
			country: "",
		},
		person: {
			name: "",
			age: "",
			sex: "",
		},
		dataType: "",
	};
	template.id = item["@id"];
	template.dataType = item.teiHeader.profileDesc.taxonomy.categories[0]["@id"];

	if (place.placeName) {
		template.place.name = place.placeName;
	} else if (place.settlement) {
		template.place.name = place.settlement.name.find((n) => n["@lang"] === "en").$;
	}

	if (place.region) {
		template.place.region = place.region.$;
	}

	if (place.country) {
		template.place.country = place.country.$;
	}

	const person = item.teiHeader.profileDesc.particDesc?.person;

	if (person) {
		template.person.name = person.$;
		if (person["@sex"]) {
			template.person.sex = person["@sex"];
		}
		if (person["@age"]) {
			template.person.age = person["@age"];
		}
	}
	template.label = template.person.name ? template.person.name : template.place.name;

	return template;
};

// Four grouping levels: country, region, place, dataType
type groupedItemType = Record<
	string,
	Record<string, Record<string, Record<string, Array<simpleTEIMetadata>>>>
>;

const groupedItems: ComputedRef<groupedItemType> = computed(() => {
	// Group by country
	const collectedItems = []
		.concat(...rawItems.value.map((el) => el.TEIs))
		.map(extractMetadata) as Array<simpleTEIMetadata>;

	let groupedByCountry = Object.groupBy(collectedItems, (item) => {
		return item.place.country;
	});
	// Group by region
	for (const country in groupedByCountry) {
		groupedByCountry[country] = Object.groupBy(groupedByCountry[country], (item) => {
			return item.place.region;
		});

		// Group by place
		for (const region in groupedByCountry[country]) {
			groupedByCountry[country][region] = Object.groupBy(
				groupedByCountry[country][region],
				(item) => {
					return item.place.name;
				},
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
});

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
