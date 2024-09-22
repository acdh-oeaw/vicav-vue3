import type { DataTypes } from "@/types/global";

const types: DataTypes = {
	Feature: {
		name: "linguistic feature list",
		targetType: "Feature",
		categoryId: "featurelist",
		collection: "vicav_lingfeatures",
		explore_xslt: "cross_features_02.xslt",
		contentTypeHeading: "Feature lists",
	},
	Profile: {
		name: "linguistic profile",
		targetType: "Profile",
		categoryId: "profile",
		collection: "vicav_profiles",
		contentTypeHeading: "Profiles",
	},
	SampleText: {
		name: "sample text",
		targetType: "SampleText",
		categoryId: "sampletext",
		collection: "vicav_samples",
		explore_xslt: "cross_samples_01.xslt",
		contentTypeHeading: "Sample texts",
	},
	CorpusText: {
		name: "corpus text",
		targetType: "CorpusText",
		categoryId: "corpustext",
		collection: "vicav_corpus",
		contentTypeHeading: "Corpus texts",
	},
	Text: {
		name: "meta text",
		targetType: "Text",
		categoryId: "text",
		collection: "vicav_texts",
		contentTypeHeading: "Texts",
	},
} as const;
export default types;
