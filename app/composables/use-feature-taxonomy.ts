import { useGeojsonStore } from "@/stores/use-geojson-store.ts";

/**
 * A single feature, i.e. a leaf of the feature taxonomy. `id` is the `ft_*` key used as the column
 * id in the feature map/table and as the feature key in the query language.
 */
export interface FeatureTaxonomyFeature {
	id: string;
	label: string;
	count?: number;
}

/**
 * A category of the feature taxonomy. `path` is the dot separated category path as used in the
 * project config, e.g. `personal_pronouns.bound_pronouns`.
 */
export interface FeatureTaxonomyCategory {
	path: string;
	label: string;
	features: Array<FeatureTaxonomyFeature>;
	children: Array<FeatureTaxonomyCategory>;
}

export type FeatureHeading = Record<string, string | number | undefined>;

const FEATURE_KEY_PREFIX = "ft_";

export function getFeatureKey(heading: FeatureHeading): string | undefined {
	return Object.keys(heading).find((key) => key.startsWith(FEATURE_KEY_PREFIX));
}

function getDirectSubcategories(
	categories: Record<string, string>,
	path: string,
): Array<[string, string]> {
	return Object.entries(categories).filter(
		([categoryPath]) =>
			categoryPath.startsWith(path) && categoryPath.lastIndexOf(".") === path.length,
	);
}

function getFeaturesInCategory(
	headings: Array<FeatureHeading>,
	path: string,
): Array<FeatureTaxonomyFeature> {
	return headings
		.filter((heading) => heading.category === path)
		.map((heading) => {
			// Headings without a `ft_*` key are non-feature columns that were assigned a category
			// (currently only `country` in the feature map/table), which is keyed by its path.
			const id = getFeatureKey(heading) ?? path;

			return {
				id,
				label: String(heading[id] ?? id),
				count: typeof heading.count === "number" ? heading.count : undefined,
			};
		});
}

function buildCategory(
	path: string,
	label: string,
	categories: Record<string, string>,
	headings: Array<FeatureHeading>,
): FeatureTaxonomyCategory {
	return {
		path,
		label,
		features: getFeaturesInCategory(headings, path),
		children: getDirectSubcategories(categories, path)
			.map(([childPath, childLabel]) =>
				buildCategory(childPath, categories[childPath] ?? childLabel, categories, headings),
			)
			.filter((child) => child.features.length > 0 || child.children.length > 0),
	};
}

export function buildFeatureTaxonomyTree(
	categories: Record<string, string>,
	headings: Array<FeatureHeading>,
): Array<FeatureTaxonomyCategory> {
	const topLevelPaths = [...new Set(Object.keys(categories).map((path) => path.split(".")[0]!))];

	return topLevelPaths.map((path) =>
		buildCategory(path, categories[path] ?? path, categories, headings),
	);
}

export function countFeaturesInCategory(category: FeatureTaxonomyCategory): number {
	return (
		category.features.length +
		category.children.reduce((total, child) => total + countFeaturesInCategory(child), 0)
	);
}

export function useFeatureTaxonomy() {
	const geojsonStore = useGeojsonStore();

	const { data: projectData, isPending } = geojsonStore.loadGeojson();
	const { geojsonData } = storeToRefs(geojsonStore);

	const categories = computed<Record<string, string>>(() => {
		const categoryArray = projectData.value?.projectConfig?.staticData?.table?.[1] as
			| Array<Record<string, string>>
			| undefined;
		if (!categoryArray) return {};

		return Object.fromEntries(categoryArray.flatMap((entry) => Object.entries(entry)));
	});

	const headings = computed<Array<FeatureHeading>>(() => {
		return (geojsonData.value?.properties.column_headings ?? []) as Array<FeatureHeading>;
	});

	const taxonomy = computed(() => buildFeatureTaxonomyTree(categories.value, headings.value));

	return { taxonomy, categories, headings, isPending };
}
