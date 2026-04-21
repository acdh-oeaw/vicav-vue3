<script setup lang="ts">
import type { Column, Table } from "@tanstack/vue-table";
import { Check } from "lucide-vue-next";
import { Field as FormField, useForm } from "vee-validate";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ensureFilterValueMap, FilterValueMap } from "@/utils/filter-value-map";

import type { SelectionEntry } from "./marker-selector.vue";

const { AND_OPERATOR, getCombinedFilterOption } = useAdvancedQueries();
const { syncGlobalAndColumnFilters } = useFilterParser();
const { getFacetsForId, getTaxonomyTree, featureValueTaxonomy } = useGeojsonStore();

const props = defineProps<{
	column: Column<unknown>;
	table: Table<unknown>;
	hideCheckbox?: boolean;
}>();

const rowData = computed(() => props.table.getCoreRowModel().flatRows);
const facets = toRef(
	computed(() => {
		return getFacetsForId(props.table, props.column.id);
	}),
);
const selectedCombinedFilters = computed(() => {
	return new Map(
		[
			...(props.column.getFilterValue()
				? (props.column.getFilterValue() as Map<string, number>).keys()
				: []),
		]
			.filter((key) => key.includes(AND_OPERATOR))
			.map((key) => [
				key,
				getCombinedFilterOption(props.column, rowData.value, key.split(AND_OPERATOR)),
			]),
	);
});

const {
	handleSubmit,
	setFieldValue,
	values: formValues,
} = useForm({
	initialValues: {
		items: [...((props.column.getFilterValue() as Map<string, unknown>) ?? new Map()).keys()],
	},
});

const dialogOpen = ref(false);
watch(
	() => dialogOpen.value,
	() => {
		if (!dialogOpen.value) return;
		const filters = [
			...((props.column.getFilterValue() as Map<string, unknown>) ?? new Map()).keys(),
		];
		setFieldValue("items", filters);
	},
	{ immediate: true },
);

watch(
	() => formValues.items,
	(newVal, oldVal) => {
		if (formValues.items.length > 1) {
			if (newVal.length > oldVal.length) {
				const filteredFormValues = formValues.items.filter((i) => !i.includes(AND_OPERATOR));
				if (
					selectedCombinedFilters.value.has(filteredFormValues.join(AND_OPERATOR)) ||
					filteredFormValues.length <= 1
				)
					return;
				filterSuggestion.value = getCombinedFilterOption(
					props.column,
					rowData.value,
					filteredFormValues,
				);
			}
		} else if (
			!(filterSuggestion.value && formValues.items.includes(filterSuggestion.value?.combinedValue))
		) {
			filterSuggestion.value = null;
		}
		computeMarkerData();
	},
);

const { buildFeatureValueId, addDefaultMarker, setMarker } = useMarkerStore();
const { markers } = storeToRefs(useMarkerStore());

const onSubmit = handleSubmit((values: { items: Array<string> }) => {
	if (values.items.length > 0) props.column.toggleVisibility(true);
	const existing = ensureFilterValueMap(props.column.getFilterValue());
	const allFilters = new FilterValueMap(
		values.items.map((item) => [item, 1]),
		existing.exclude,
	);
	props.column.setFilterValue(allFilters);
	values.items.forEach((element) => {
		if (!markers.value.has(buildFeatureValueId(props.column.id, element)))
			addDefaultMarker(props.column.id, element);
	});
	computeMarkerData();
	syncGlobalAndColumnFilters(props.table);
	dialogOpen.value = false;
});

const onChange = (facet: string, checked: boolean) => {
	if (checked) {
		if (!markers.value.has(buildFeatureValueId(props.column.id, facet)))
			addDefaultMarker(props.column.id, facet);
		computeMarkerData();
	}
	const taxonomyKey = featureValueTaxonomy.get(`${props.column.id}.${facet}`)?.taxonomy ?? "";
	let currentTree = taxonomyTree.value;
	for (const key of taxonomyKey.split(".")) {
		if (currentTree.has(key)) {
			if (getAllValuesSelected(currentTree.get(key)!))
				setFieldValue("items", formValues.items.concat([key]));
			else
				setFieldValue(
					"items",
					formValues.items.filter((i) => i !== key),
				);

			currentTree = currentTree.get(key)!.children;
		}
	}
};

const filterSuggestion = ref<CombinedFilter | null>();

function addCombinedFilter(combinedValue: string, checked: boolean) {
	if (checked) {
		setFieldValue(
			"items",
			formValues.items
				.concat(combinedValue)
				.filter((i) => !combinedValue.split(AND_OPERATOR).includes(i)),
		);
		selectedCombinedFilters.value.set(
			combinedValue,
			getCombinedFilterOption(props.column, rowData.value, combinedValue.split(AND_OPERATOR)),
		);
		filterSuggestion.value = null;
	} else {
		setFieldValue(
			"items",
			formValues.items.filter((i) => i !== combinedValue),
		);
	}
}

const allValuesSelected = computed(() => {
	return facets.value.length === formValues.items.length;
});

function toggleAllValues() {
	if (allValuesSelected.value) {
		setFieldValue("items", []);
	} else {
		setFieldValue(
			"items",
			facets.value.map((facet) => facet[0]),
		);
		facets.value.forEach((facet) => {
			if (!markers.value.has(buildFeatureValueId(props.column.id, facet[0])))
				addDefaultMarker(props.column.id, facet[0]);
		});
		computeMarkerData();
	}
}
function getAllValuesSelected(tree: TaxonomyTreeEntry): boolean {
	return (
		(tree.featureValues.every((val) => formValues.items.includes(val)) &&
			[...(tree.children.entries() ?? [])].every(([_child, entry]) =>
				getAllValuesSelected(entry),
			)) ??
		false
	);
}
function toggleAllValuesUnderTaxonomy(key: string, tree: TaxonomyTreeEntry, targetVal?: boolean) {
	const selectValues = targetVal ?? !getAllValuesSelected(tree);
	const usedTree = tree;
	if (selectValues) setFieldValue("items", formValues.items.concat([key]));
	else
		setFieldValue(
			"items",
			formValues.items.filter((i) => i !== key),
		);
	usedTree.children.forEach((child, childKey) => {
		toggleAllValuesUnderTaxonomy(childKey, child, selectValues);
	});
	usedTree.featureValues.forEach((facet) => {
		if (!markers.value.has(buildFeatureValueId(props.column.id, facet)))
			addDefaultMarker(props.column.id, facet);
	});
	if (selectValues) setFieldValue("items", formValues.items.concat(usedTree.featureValues ?? []));
	else
		setFieldValue(
			"items",
			formValues.items.filter((i) => !usedTree.featureValues.includes(i)),
		);
	setFieldValue("items", [...new Set(formValues.items)]);
	computeMarkerData();
}
const markerData = ref<Record<string, SelectionEntry>>({});
function computeMarkerData() {
	const data: Record<string, SelectionEntry> = {};
	const ids = [filterSuggestion.value?.combinedValue]
		.concat([...selectedCombinedFilters.value.values()].flatMap((entry) => entry.combinedValue))
		.concat(facets.value.flatMap((entry) => entry[0]))
		.filter((id): id is string => id !== null);
	ids.forEach((entry: string) => {
		const id = buildFeatureValueId(props.column.id, entry);
		if (!markers.value.has(id)) {
			return;
		}

		data[entry] = {
			id,
			colorCode: markers.value.get(id)!.colorCode,
			icon: markers.value.get(id)!.icon,
			hidden: markers.value.get(id)!.hidden ?? false,
		};
	});
	markerData.value = data;
}

function updateMarker(markerSelection: SelectionEntry) {
	if (markerSelection.icon) {
		setMarker(markerSelection);
	}
	computeMarkerData();
}

onMounted(() => computeMarkerData());
onUpdated(() => computeMarkerData());

const taxonomyTree = computed(() =>
	getTaxonomyTree(
		props.column.id,
		facets.value.map((f) => f[0]),
	),
);

function deselectColumn() {
	props.column.toggleVisibility();
	setFieldValue("items", []);
	void onSubmit();
}
</script>

<template>
	<Dialog :open="dialogOpen" @update:open="dialogOpen = false">
		<DialogTrigger
			class="grid w-full items-center justify-between gap-2 px-2 py-1 text-left text-sm hover:bg-accent"
			:class="hideCheckbox ? 'grid-cols-[1fr_auto]' : 'grid-cols-[auto_1fr_auto]'"
			v-bind="$attrs"
			@click.stop="dialogOpen = true"
		>
			<Button
				v-if="column.getIsVisible() && !hideCheckbox"
				class="size-4 border-0 p-0"
				variant="outline"
				@click.stop="deselectColumn"
			>
				<Check class="size-full"></Check>
				<span class="sr-only">Deselect feature</span>
			</Button>
			<div v-else-if="!hideCheckbox" class="size-4"></div>

			<span>{{ column.columnDef.header }}</span>
			<div @click.stop>
				<MarkerSelector
					v-if="column.getIsVisible()"
					:icon-categories="['shapes']"
					:model-value="markers.get(column.id)!"
					:type="['icon']"
					:use-popover-modal="true"
					@update:model-value="(props) => updateMarker(props)"
				></MarkerSelector>
			</div>
		</DialogTrigger>
		<DialogContent class="sm:max-w-[425px]">
			<form class="grid grid-rows-[auto_1fr_auto] gap-4 sm:max-h-[90vh]" @submit="onSubmit">
				<DialogHeader>
					<DialogTitle>Select feature values for {{ column.columnDef.header }}</DialogTitle>
					<DialogDescription>
						Select feature values that should be visible as map markers. Click 'Save changes' when
						you are done.
					</DialogDescription>
				</DialogHeader>

				<FormField class="overflow-auto" name="items">
					<Button class="ml-auto w-fit" type="button" variant="outline" @click="toggleAllValues"
						>{{ allValuesSelected ? "Deselect" : "Select" }} all values</Button
					>
					<FormItem class="-mt-px overflow-auto">
						<div
							v-if="selectedCombinedFilters.size > 0 || (filterSuggestion?.count ?? 0) > 0"
							class="sticky top-0 -mt-px rounded bg-secondary p-2.5"
						>
							<div class="relative -mt-2 mb-1 -ml-1 text-xs font-light">Combined filters</div>
							<FeatureSelectionDialogEntry
								v-if="filterSuggestion && (filterSuggestion!.count ?? 0) > 0"
								:count="filterSuggestion!.count"
								:label="filterSuggestion?.combinedValue"
								:marker-data="markerData"
								:update-marker="updateMarker"
								@checked="
									(checked) => {
										onChange(filterSuggestion!.combinedValue, checked);
										addCombinedFilter(filterSuggestion!.combinedValue, checked);
									}
								"
							>
								<span v-for="(fv, idx) in filterSuggestion?.filterValues" :key="fv"
									>{{ fv
									}}<span
										v-if="idx < filterSuggestion!.filterValues.length - 1"
										class="font-mono font-semibold"
										>&nbsp;and&nbsp;</span
									>
								</span>
							</FeatureSelectionDialogEntry>

							<!-- Selected combined Feature Values ("X and Y") -->
							<template
								v-for="facet in selectedCombinedFilters.values()"
								:key="facet.combinedValue"
							>
								<FeatureSelectionDialogEntry
									:count="facet.count"
									:label="facet.combinedValue"
									:marker-data="markerData"
									:update-marker="updateMarker"
								>
									<span v-for="(fv, idx) in facet?.filterValues" :key="fv"
										>{{ fv
										}}<span
											v-if="idx < facet!.filterValues.length - 1"
											class="font-mono font-semibold"
											>&nbsp;and&nbsp;</span
										>
									</span></FeatureSelectionDialogEntry
								>
							</template>
						</div>

						<!-- Regular Feature Values -->
						<div class="mt-1 ml-2.5">
							<template v-for="[key, entry] in taxonomyTree.entries()" :key="key">
								<FeatureSelectionDialogEntry
									:facets="facets"
									:label="entry.label ?? ''"
									:marker-data="markerData"
									:taxonomy-entry="entry"
									:update-marker="updateMarker"
									@checked="(facetKey, checked) => onChange(facetKey, checked)"
									@toggle-all="(key, tree) => toggleAllValuesUnderTaxonomy(key, tree)"
								>
									<span class="font-semibold">{{ entry.label }}</span>
								</FeatureSelectionDialogEntry>
							</template>
						</div>
						<FormMessage />
					</FormItem>
				</FormField>

				<DialogFooter>
					<Button type="submit" variant="default"> Save changes </Button>
				</DialogFooter>
			</form>
		</DialogContent>
	</Dialog>
</template>
