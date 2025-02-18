<script setup lang="ts">
import type { Column } from "@tanstack/vue-table";
import { List } from "lucide-vue-next";
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

import Checkbox from "./ui/form/Checkbox.vue";

const { AND_OPERATOR, getCombinedFilterOption } = useAdvancedQueries();

const props = defineProps<{
	column: Column<unknown>;
}>();
const facets = toRef(
	computed(() => [...props.column.getFacetedUniqueValues()]?.sort((a, b) => b[1] - a[1])),
);
const selectedCombinedFilters = computed(
	() =>
		new Map(
			[
				...(props.column.getFilterValue()
					? (props.column.getFilterValue() as Map<string, number>).keys()
					: []),
			]
				.filter((key) => key.includes(AND_OPERATOR))
				.map((key) => [
					key,
					getCombinedFilterOption(
						props.column,
						props.column.getFacetedRowModel(),
						key.split(AND_OPERATOR),
					),
				]),
		),
);

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
					props.column.getFacetedRowModel(),
					filteredFormValues,
				);
			}
		} else if (
			!(filterSuggestion.value && formValues.items.includes(filterSuggestion.value?.combinedValue))
		) {
			filterSuggestion.value = null;
		}
	},
);

const { addColorVariant, buildFeatureValueId, setColor } = useColorsStore();
const { colors } = storeToRefs(useColorsStore());

const onSubmit = handleSubmit((values: { items: Array<string> }) => {
	if (values.items.length > 0) props.column.toggleVisibility(true);
	const allFilters = new Map(values.items.map((item) => [item, 1]));
	props.column.setFilterValue(allFilters);
	values.items.forEach((element) => {
		if (colors.value.has(buildFeatureValueId(props.column.id, element))) return;
		addColorVariant(props.column.id, element);
	});
	dialogOpen.value = false;
});

const onChange = (facet: string, checked: boolean) => {
	if (checked) {
		if (!colors.value.has(buildFeatureValueId(props.column.id, facet)))
			addColorVariant(props.column.id, facet);
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
			getCombinedFilterOption(
				props.column,
				props.column.getFacetedRowModel(),
				combinedValue.split(AND_OPERATOR),
			),
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
			if (colors.value.has(buildFeatureValueId(props.column.id, facet[0]))) return;
			addColorVariant(props.column.id, facet[0]);
		});
	}
}
</script>

<template>
	<Dialog :open="dialogOpen" @update:open="dialogOpen = false">
		<DialogTrigger @click.stop="dialogOpen = true">
			<List class="ml-2 size-4"></List>
			<span class="sr-only">Select feature values</span>
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
					<FormItem class="overflow-auto">
						<div
							v-if="selectedCombinedFilters.size > 0 || (filterSuggestion?.count ?? 0) > 0"
							class="relative rounded bg-secondary p-2.5"
						>
							<div class="relative -ml-1 -mt-2 mb-1 text-xs font-light">Combined filters</div>
							<FormField
								v-if="filterSuggestion && (filterSuggestion!.count ?? 0) > 0"
								v-slot="{ value, handleChange }"
								name="items"
								type="checkbox"
								:unchecked-value="false"
								:value="filterSuggestion?.combinedValue"
							>
								<FormItem class="flex flex-row items-start space-x-3 space-y-0">
									<FormControl class="my-1">
										<Checkbox
											:checked="value.includes(filterSuggestion?.combinedValue)"
											class="border-sky-300 data-[state=checked]:bg-sky-200"
											@update:checked="
												(checked) => {
													handleChange(checked);
													addCombinedFilter(filterSuggestion!.combinedValue, checked);
												}
											"
										/>
									</FormControl>
									<FormLabel class="w-auto py-0 font-normal">
										<span v-for="(fv, idx) in filterSuggestion?.filterValues" :key="fv"
											>{{ fv
											}}<span
												v-if="idx < filterSuggestion!.filterValues.length - 1"
												class="font-mono font-semibold"
												>&nbsp;and&nbsp;</span
											>
										</span>
										<Badge class="ml-2 border-neutral-300" variant="outline">{{
											filterSuggestion!.count
										}}</Badge>
									</FormLabel>
									<label
										v-if="
											colors.has(buildFeatureValueId(column.id, filterSuggestion!.combinedValue))
										"
										class="ml-3 flex grow-0 basis-0 items-center self-center p-0"
										@click.capture.stop
									>
										<div
											class="size-4 rounded"
											:style="{
												backgroundColor: `var(--${buildFeatureValueId(column.id, filterSuggestion!.combinedValue)})`,
												stroke: `var(--${buildFeatureValueId(column.id, filterSuggestion!.combinedValue)})`,
											}"
										></div>
										<input
											class="size-0"
											type="color"
											:value="
												colors.get(buildFeatureValueId(column.id, filterSuggestion!.combinedValue))
													?.colorCode || '#cccccc'
											"
											@click.capture.stop
											@input="
												(event) => {
													setColor({
														id: buildFeatureValueId(column.id, filterSuggestion!.combinedValue),

														//@ts-expect-error target.value not recognized
														colorCode: event.target!.value,
													});
												}
											"
										/>
										<span class="sr-only">Select color</span>
									</label>
								</FormItem>
							</FormField>
							<template
								v-for="facet in selectedCombinedFilters.values()"
								:key="facet.combinedValue"
							>
								<FormField
									v-slot="{ value, handleChange }"
									name="items"
									type="checkbox"
									:unchecked-value="false"
									:value="facet.combinedValue"
								>
									<FormItem class="flex flex-row items-start space-x-3 space-y-0">
										<FormControl class="my-1">
											<Checkbox
												:checked="value.includes(facet?.combinedValue)"
												class="border-sky-300 data-[state=checked]:bg-sky-200"
												@update:checked="
													(checked) => {
														handleChange(checked);
													}
												"
											/>
										</FormControl>
										<FormLabel class="w-auto py-0 font-normal">
											<span v-for="(fv, idx) in facet?.filterValues" :key="fv"
												>{{ fv
												}}<span
													v-if="idx < facet!.filterValues.length - 1"
													class="font-mono font-semibold"
													>&nbsp;and&nbsp;</span
												>
											</span>
											<Badge class="ml-2 border-neutral-300" variant="outline">{{
												facet!.count
											}}</Badge>
										</FormLabel>
										<label
											v-if="colors.has(buildFeatureValueId(column.id, facet!.combinedValue))"
											class="ml-3 flex grow-0 basis-0 items-center self-center p-0"
											@click.capture.stop
										>
											<div
												class="size-4 rounded"
												:style="{
													backgroundColor: `var(--${buildFeatureValueId(column.id, facet!.combinedValue)})`,
													stroke: `var(--${buildFeatureValueId(column.id, facet!.combinedValue)})`,
												}"
											></div>
											<input
												class="size-0"
												type="color"
												:value="
													colors.get(buildFeatureValueId(column.id, facet!.combinedValue))
														?.colorCode || '#cccccc'
												"
												@click.capture.stop
												@input="
													(event) => {
														setColor({
															id: buildFeatureValueId(column.id, facet!.combinedValue),

															//@ts-expect-error target.value not recognized
															colorCode: event.target!.value,
														});
													}
												"
											/>
											<span class="sr-only">Select color</span>
										</label>
									</FormItem>
								</FormField>
							</template>
						</div>
						<template v-for="facet in facets" :key="facet[0]">
							<FormField
								v-slot="{ value, handleChange }"
								name="items"
								type="checkbox"
								:unchecked-value="false"
								:value="facet[0]"
							>
								<FormItem class="flex flex-row items-start space-x-3 space-y-0">
									<FormControl class="my-1">
										<Checkbox
											:checked="value.includes(facet[0])"
											@update:checked="
												(checked) => {
													handleChange(checked);
													onChange(facet[0], checked);
												}
											"
										/>
									</FormControl>
									<FormLabel class="w-auto py-0 font-normal">
										<span>{{ facet[0] }}</span>
										<Badge class="ml-2" variant="outline">{{ facet[1] }}</Badge>
									</FormLabel>
									<label
										v-if="colors.has(buildFeatureValueId(column.id, facet[0]))"
										class="ml-3 flex grow-0 basis-0 items-center self-center p-0"
										@click.capture.stop
									>
										<div
											class="size-4 rounded"
											:style="{
												backgroundColor: `var(--${buildFeatureValueId(column.id, facet[0])})`,
												stroke: `var(--${buildFeatureValueId(column.id, facet[0])})`,
											}"
										></div>
										<input
											class="size-0"
											type="color"
											:value="
												colors.get(buildFeatureValueId(column.id, facet[0]))?.colorCode || '#cccccc'
											"
											@click.capture.stop
											@input="
												(event) => {
													setColor({
														id: buildFeatureValueId(column.id, facet[0]),

														//@ts-expect-error target.value not recognized
														colorCode: event.target!.value,
													});
												}
											"
										/>
										<span class="sr-only">Select color</span>
									</label>
								</FormItem>
							</FormField>
						</template>

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
