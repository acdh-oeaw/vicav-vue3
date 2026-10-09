import dataTypes from "@/config/dataTypes.ts";
import type { DataListWindowItem, SimpleMetadataListState } from "@/types/global.ts";

export interface MapDatasetConfig {
	id: string;
	title: string;
	dataTypes: DataListWindowItem["params"]["dataTypes"];
	filterListBy?: DataListWindowItem["params"]["filterListBy"];
	color: string;
	defaultFacets?: SimpleMetadataListState["facets"];
}

// Increment when changing dataset definitions or defaults to invalidate older SSR snapshots.
export const mapDatasetRegistryVersion = 2;

export const mapDatasetColors = [
	"#b91c1c",
	"#0369a1",
	"#15803d",
	"#7e22ce",
	"#b45309",
	"#0f766e",
] as const;

export const mapDatasets: Array<MapDatasetConfig> = [
	{
		id: "configured:corpus",
		title: dataTypes.CorpusText.contentTypeHeading,
		dataTypes: ["CorpusText"],
		color: mapDatasetColors[0],
		defaultFacets: { "@hasTEIw": ["true"] },
	},
	{
		id: "configured:samples",
		title: dataTypes.SampleText.contentTypeHeading,
		dataTypes: ["SampleText"],
		color: mapDatasetColors[1],
	},
	{
		id: "configured:features",
		title: dataTypes.Feature.contentTypeHeading,
		dataTypes: ["Feature"],
		color: mapDatasetColors[2],
	},
	{
		id: "configured:profiles",
		title: dataTypes.Profile.contentTypeHeading,
		dataTypes: ["Profile"],
		color: mapDatasetColors[3],
	},
];
