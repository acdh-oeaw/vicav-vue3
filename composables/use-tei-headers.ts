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
		fileDesc: {
			titleStmt: { titles: Array<teiStringNode> };
			publicationStmt: { idno?: teiStringNode };
		};
		profileDesc?: {
			taxonomy?: { category: { "@id": string; $: string } };
			particDesc?: {
				person?: {
					"@sex": string;
					"@age": string;
					$: string;
				};
			};
			settingDesc?: {
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
	"@hasTEIw": string;
}

interface TEIs {
	"@id": string;
	TEIs: Array<teiHeader>;
}

type RawTEIItems = ComputedRef<Array<TEIs | object>>;

const extractMetadata = function (item: teiHeader, dataType: string) {
	const place = item.teiHeader.profileDesc?.settingDesc?.place;
	const template = {
		id: "",
		place: {
			settlement: "",
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
		hasTEIw: false,
	} as simpleTEIMetadata;
	template.id = item["@id"]
		? item["@id"]
		: item.teiHeader.fileDesc.publicationStmt.idno?.$
			? item.teiHeader.fileDesc.publicationStmt.idno.$
			: "no_id";
	const dataTypeObject = Object.values(dataTypes).find(
		(dataTypeObject) => dataTypeObject.collection === dataType,
	);
	if (dataTypeObject) template.dataType = dataTypeObject.targetType;

	if (place?.placeName) {
		template.place.settlement = place.placeName.$;
	} else if (place?.settlement?.name) {
		const placeName = place.settlement.name.find((n) => n["@lang"] === "en");
		if (placeName) template.place.settlement = placeName.$;
	}

	if (place?.region) {
		template.place.region = place.region.$;
	}

	if (place?.country) {
		template.place.country = place.country.$;
	}

	const person = item.teiHeader.profileDesc?.particDesc?.person;

	if (person) {
		template.person.name = person.$;
		if (person["@sex"]) {
			template.person.sex = person["@sex"];
		}
		if (person["@age"]) {
			template.person.age = person["@age"];
		}
	}
	template.label = template.person.name
		? template.person.name
		: item.teiHeader.fileDesc.titleStmt.titles[0]?.$
			? item.teiHeader.fileDesc.titleStmt.titles[0]?.$
			: template.place.settlement;

	template.hasTEIw = item["@hasTEIw"] === "true";
	return template;
};

// Google Gemini Cloude Code suggestion
function isTEIs(item: TEIs | object): item is TEIs {
	return Object.prototype.hasOwnProperty.call(item, "TEIs");
}

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
		const data = rawItems.value
			// Google Gemini Cloude Code suggestion
			.filter(isTEIs)
			.map((dataTypeTEIs: TEIs) => {
				return dataTypeTEIs.TEIs.map((item: teiHeader) =>
					extractMetadata(item, dataTypeTEIs["@id"]),
				);
			});
		return ([] as Array<simpleTEIMetadata>).concat(...data);
	});

	return {
		rawItems,
		simpleItems,
	};
}
