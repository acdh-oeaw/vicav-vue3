<script lang="ts" setup>
import { debounce } from "@acdh-oeaw/lib";
import { ChevronDown, ChevronRight } from "@lucide/vue";

import {
	countFeaturesInCategory,
	type FeatureTaxonomyCategory,
	type FeatureTaxonomyFeature,
} from "@/composables/use-feature-taxonomy.ts";
import {
	type FeatureDescriptionListWindowItem,
	ListMapSchema,
	type WindowItem,
} from "@/types/global.ts";

interface Props {
	params: FeatureDescriptionListWindowItem["params"];
}

const props = defineProps<Props>();
const emit = defineEmits<{
	"update:params": [params: FeatureDescriptionListWindowItem["params"]];
}>();

const { taxonomy, isPending } = useFeatureTaxonomy();
const openOrUpdateWindow = useOpenOrUpdateWindow();

const globalFilter = ref(props.params.globalFilter ?? "");
const collapsed = ref<Set<string>>(new Set());

const emitParamsUpdate = debounce(() => {
	emit("update:params", {
		...props.params,
		globalFilter: globalFilter.value.length > 0 ? globalFilter.value : undefined,
	});
}, 150);

watch(globalFilter, () => {
	emitParamsUpdate();
});

function findCategory(
	categories: Array<FeatureTaxonomyCategory>,
	path: string,
): FeatureTaxonomyCategory | undefined {
	for (const category of categories) {
		if (category.path === path) return category;
		const match = findCategory(category.children, path);
		if (match) return match;
	}
	return undefined;
}

/** The categories the list is scoped to, i.e. all of them unless `taxonomyPath` is set. */
const scopedCategories = computed<Array<FeatureTaxonomyCategory>>(() => {
	if (props.params.taxonomyPath == null) return taxonomy.value;
	const scope = findCategory(taxonomy.value, props.params.taxonomyPath);

	return scope ? [scope] : [];
});

/** Ancestors of the scoped category, so one can navigate back up the taxonomy. */
const breadcrumb = computed<Array<FeatureTaxonomyCategory>>(() => {
	const path = props.params.taxonomyPath;
	if (path == null) return [];
	const segments = path.split(".");

	return segments
		.slice(0, -1)
		.map((_segment, index) => findCategory(taxonomy.value, segments.slice(0, index + 1).join(".")))
		.filter((category): category is FeatureTaxonomyCategory => category != null);
});

function matches(value: string, query: string): boolean {
	return value.toLocaleLowerCase().includes(query);
}

function filterCategory(
	category: FeatureTaxonomyCategory,
	query: string,
): FeatureTaxonomyCategory | null {
	// A matching category keeps all of its contents, so one can filter by a parent category.
	if (matches(category.label, query) || matches(category.path, query)) return category;

	const features = category.features.filter(
		(feature) => matches(feature.label, query) || matches(feature.id, query),
	);
	const children = category.children
		.map((child) => filterCategory(child, query))
		.filter((child): child is FeatureTaxonomyCategory => child != null);

	if (features.length === 0 && children.length === 0) return null;

	return { ...category, features, children };
}

const filteredCategories = computed<Array<FeatureTaxonomyCategory>>(() => {
	const query = globalFilter.value.trim().toLocaleLowerCase();
	if (query.length === 0) return scopedCategories.value;

	return scopedCategories.value
		.map((category) => filterCategory(category, query))
		.filter((category): category is FeatureTaxonomyCategory => category != null);
});

const isFiltering = computed(() => globalFilter.value.trim().length > 0);

interface CategoryRow {
	kind: "category";
	key: string;
	depth: number;
	category: FeatureTaxonomyCategory;
	featureCount: number;
	isExpanded: boolean;
}

interface FeatureRow {
	kind: "feature";
	key: string;
	depth: number;
	feature: FeatureTaxonomyFeature;
}

type DisplayRow = CategoryRow | FeatureRow;

function isExpanded(path: string): boolean {
	// While filtering everything is expanded, so matches deeper in the tree stay visible.
	return isFiltering.value || !collapsed.value.has(path);
}

function flattenCategories(
	categories: Array<FeatureTaxonomyCategory>,
	depth = 0,
): Array<DisplayRow> {
	return categories.flatMap((category) => {
		const expanded = isExpanded(category.path);
		const row: CategoryRow = {
			kind: "category",
			key: category.path,
			depth,
			category,
			featureCount: countFeaturesInCategory(category),
			isExpanded: expanded,
		};
		if (!expanded) return [row];

		return [
			row,
			...category.features.map(
				(feature): FeatureRow => ({
					kind: "feature",
					key: `${category.path}/${feature.id}`,
					depth: depth + 1,
					feature,
				}),
			),
			...flattenCategories(category.children, depth + 1),
		];
	});
}

const displayRows = computed(() => flattenCategories(filteredCategories.value));

const featureCount = computed(() =>
	filteredCategories.value.reduce(
		(total, category) => total + countFeaturesInCategory(category),
		0,
	),
);

function toggleCategory(path: string) {
	const next = new Set(collapsed.value);
	if (next.has(path)) next.delete(path);
	else next.add(path);
	collapsed.value = next;
}

function openCategory(category: FeatureTaxonomyCategory) {
	emit("update:params", { ...props.params, taxonomyPath: category.path });
}

function openAllCategories() {
	emit("update:params", { ...props.params, taxonomyPath: undefined });
}

/**
 * Opens the feature map/table filtered to this feature. Once the feature description documents are
 * available in the backend (see #411), this should open the description instead.
 */
function openFeature(feature: FeatureTaxonomyFeature) {
	openOrUpdateWindow(
		{
			targetType: "ListMap",
			params: { queryString: `${feature.id}:ANY` },
		} as unknown as WindowItem,
		feature.label,
		ListMapSchema.shape.params,
		"queryString",
		true,
	);
}
</script>

<template>
	<div class="grid size-full grid-rows-[auto_1fr] overflow-hidden">
		<div class="flex flex-wrap items-center justify-between gap-2 p-2">
			<div class="flex flex-wrap items-center gap-2">
				<label class="text-sm font-medium whitespace-nowrap" for="feature-description-search">
					Search:
				</label>
				<input
					id="feature-description-search"
					v-model="globalFilter"
					class="h-8 w-56 rounded-md border border-input px-2"
					type="search"
				/>
			</div>
			<div class="text-sm">{{ featureCount }} features</div>
		</div>

		<div class="relative isolate overflow-auto p-2">
			<Centered v-if="isPending">
				<LoadingIndicator />
			</Centered>
			<template v-else>
				<nav v-if="params.taxonomyPath" class="mb-2 flex flex-wrap items-center gap-1 text-sm">
					<button class="text-primary underline" type="button" @click="openAllCategories">
						All features
					</button>
					<template v-for="category in breadcrumb" :key="category.path">
						<span aria-hidden="true">&rsaquo;</span>
						<button class="text-primary underline" type="button" @click="openCategory(category)">
							{{ category.label }}
						</button>
					</template>
				</nav>

				<div v-if="displayRows.length === 0" class="p-4 text-center text-sm">No results.</div>
				<ul v-else>
					<li
						v-for="row in displayRows"
						:key="row.key"
						class="py-0.5 text-base"
						:style="{ marginLeft: `${row.depth * 1.25}rem` }"
					>
						<div v-if="row.kind === 'category'" class="flex items-center gap-2">
							<button
								:aria-expanded="row.isExpanded"
								class="inline-flex items-center gap-2 py-1 font-semibold"
								type="button"
								@click="toggleCategory(row.category.path)"
							>
								<ChevronDown v-if="row.isExpanded" class="size-4" />
								<ChevronRight v-else class="size-4" />
								<span>{{ row.category.label }}</span>
								<span class="text-sm font-normal">({{ row.featureCount }})</span>
							</button>
							<button
								class="text-sm text-primary underline"
								type="button"
								@click="openCategory(row.category)"
							>
								Show only this category
							</button>
						</div>
						<div v-else class="flex items-center">
							<a class="text-primary underline" href="#" @click.prevent="openFeature(row.feature)">
								{{ row.feature.label }}
							</a>
							<span class="ml-2 text-sm text-muted-foreground">({{ row.feature.id }})</span>
							<span v-if="row.feature.count != null" class="ml-2 text-sm text-muted-foreground">
								{{ row.feature.count }} observations
							</span>
						</div>
					</li>
				</ul>
			</template>
		</div>
	</div>
</template>
