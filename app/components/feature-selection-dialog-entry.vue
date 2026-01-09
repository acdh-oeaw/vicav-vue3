<script setup lang="ts">
import { Field as FormField } from "vee-validate";

import type { SelectionEntry } from "./marker-selector.vue";

const props = defineProps<{
	count?: number;
	label: string;
	taxonomyEntry?: TaxonomyTreeEntry;
	markerData: Record<string, SelectionEntry>;
	facets?: Array<[string, number]>;
	updateMarker: (props: SelectionEntry) => void;
}>();
const emit = defineEmits(["checked", "toggle-all"]);

const { getSortedTaxonomyFeatureValues, getSortedTaxonomyChildren } = useGeojsonStore();

const sortedChildren = computed(() => {
	return getSortedTaxonomyChildren(props.taxonomyEntry, props.facets);
});
const sortedFeatureValues = computed(() => {
	return getSortedTaxonomyFeatureValues(props.taxonomyEntry, props.facets);
});

const isHierarchyHeading = computed(() => props.taxonomyEntry != null);

function handleCheck(checked: boolean) {
	if (isHierarchyHeading.value) {
		emit("toggle-all", props.label, props.taxonomyEntry);
	} else {
		emit("checked", props.label, checked);
	}
}
</script>

<template>
	<FormField
		v-if="label != ''"
		v-slot="{ value, handleChange }"
		name="items"
		type="checkbox"
		:unchecked-value="false"
		:value="label"
	>
		<FormItem class="flex flex-row items-start space-y-0 space-x-3">
			<FormControl class="my-1">
				<Checkbox
					:checked="value.includes(label)"
					class="border-sky-300 data-[state=checked]:bg-sky-200"
					@update:checked="
						(checked) => {
							handleChange(checked);
							handleCheck(checked);
						}
					"
				/>
			</FormControl>
			<FormLabel class="w-auto py-0 font-normal">
				<slot />
				<Badge v-if="!isHierarchyHeading" class="ml-2 border-neutral-300" variant="outline">{{
					count
				}}</Badge>
			</FormLabel>
			<MarkerSelector
				v-if="value.includes(label) && !taxonomyEntry"
				:icon-categories="['shapes']"
				:model-value="markerData[label]!"
				@update:model-value="(props) => updateMarker(props)"
			></MarkerSelector>
		</FormItem>
	</FormField>
	<div v-if="isHierarchyHeading" :class="label != '' ? 'pl-6' : ''">
		<FeatureSelectionDialogEntry
			v-for="value in sortedFeatureValues"
			:key="value[0]"
			:count="value[1]"
			:facets="facets"
			:label="value[0]"
			:marker-data="markerData"
			:update-marker="updateMarker"
			@checked="(facetKey, checked) => emit('checked', facetKey, checked)"
			><span>{{ value[0] }}</span></FeatureSelectionDialogEntry
		>
		<FeatureSelectionDialogEntry
			v-for="[key, entry, childCount] in sortedChildren"
			:key="key"
			:count="childCount"
			:facets="facets"
			:label="key"
			:marker-data="markerData"
			:taxonomy-entry="entry"
			:update-marker="updateMarker"
			@checked="(facetKey, checked) => emit('checked', facetKey, checked)"
			@toggle-all="(key, tree) => emit('toggle-all', key, tree)"
			><span class="font-semibold">{{ entry.label ?? key }}</span></FeatureSelectionDialogEntry
		>
	</div>
</template>
