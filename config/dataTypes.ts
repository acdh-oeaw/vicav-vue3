import type { DataTypes } from "../types/global.d";

const types: DataTypes = {
	Feature: {
		name: "linguistic feature list",
		targetType: "Feature",
		categoryId: "featurelist",
		collection: "vicav_lingfeatures",
		explore_xslt: "cross_features_02.xslt",
	},
	Profile: {
		name: "linguistic profile",
		targetType: "Profile",
		categoryId: "profile",
		collection: "vicav_profiles",
	},
	SampleText: {
		name: "sample text",
		targetType: "SampleText",
		categoryId: "sampletext",
		collection: "vicav_samples",
		explore_xslt: "cross_samples_01.xslt",
	},
	CorpusText: {
		name: "corpus text",
		targetType: "CorpusText",
		categoryId: "corpustext",
		collection: "vicav_corpus",
	},
} as const;
export default types;
