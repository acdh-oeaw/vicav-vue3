import { computed } from "vue";

import type { simpleTEIMetadata } from "@/types/global";

import dataTypes from "../config/dataTypes";

interface teiSettlement {
	"@lang": string;
	$: string;
}

interface teiStringNode {
	$: string;
}

interface teiHeader {
	"@id": string;
	teiHeader: {
		fileDesc: { titleStmt: { title: teiStringNode } };
		profileDesc: {
			taxonomy: { category: { "@id": string; $: string } };
			particDesc: {
				person?: {
					"@sex": string;
					"@age": string;
					$: string;
				};
			};
			settingDesc: {
				place: {
					placeName?: teiStringNode;
					settlement?: { name: Array<teiSettlement> };
					region?: teiStringNode;
					country?: teiStringNode;
					location?: { geo: teiStringNode };
				};
			};
		};
	};
}

interface TEIs {
	"@id": string;
	TEIs: Array<teiHeader>;
}

type RawTEIItems = ComputedRef<Array<TEIs>>;

const extractMetadata: simpleTEIMetadata = function (item: teiHeader, dataType: string) {
	const place = item.teiHeader.profileDesc.settingDesc.place;
	const template = {
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
		label: "",
	};
	template.id = item["@id"];
	const dataTypeObject = Object.values(dataTypes).find(
		(dataTypeObject) => dataTypeObject.collection === dataType,
	);
	if (dataTypeObject) template.dataType = dataTypeObject.targetType;

	if (place.placeName) {
		template.place.name = place.placeName.$;
	} else if (place.settlement?.name) {
		const placeName = place.settlement.name.find((n) => n["@lang"] === "en");
		if (placeName) template.place.name = placeName.$;
	}

	if (place.region) {
		template.place.region = place.region.$;
	}

	if (place.country) {
		template.place.country = place.country.$;
	}

	const person = item.teiHeader.profileDesc.particDesc.person;

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

export function useTEIHeaders() {
	const { data: projectData } = useProjectInfo();

	const rawItems: RawTEIItems = computed(() => {
		return (
			projectData.value?.projectConfig?.staticData?.table
				? projectData.value.projectConfig.staticData.table
				: []
		) as Array<TEIs>;
	});

	const simpleItems: ComputedRef<Array<simpleTEIMetadata>> = computed(() => {
		return [].concat(
			...(rawItems.value.map((dataTypeTEIs: TEIs) => {
				return dataTypeTEIs.TEIs.map(
					(item: teiHeader) => extractMetadata(item, dataTypeTEIs["@id"]) as simpleTEIMetadata,
				);
			}) as Array<simpleTEIMetadata>),
		) as Array<simpleTEIMetadata>;
	});

	return {
		rawItems,
		simpleItems,
	};
}
