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

const props = defineProps<{
	column: Column<unknown>;
}>();
const facets = computed(() =>
	[...props.column.getFacetedUniqueValues()]?.sort((a, b) => b[1] - a[1]),
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
		setFieldValue("items", [
			...((props.column.getFilterValue() as Map<string, unknown>) ?? new Map()).keys(),
		]);
	},
	{ immediate: true },
);

const { addColorVariant, buildFeatureValueId, setColor } = useColorsStore();
const { colors } = storeToRefs(useColorsStore());

const onSubmit = handleSubmit((values: { items: Array<string> }) => {
	if (values.items.length > 0) props.column.toggleVisibility(true);
	props.column.setFilterValue(new Map(values.items.map((item) => [item, 1])));
	values.items.forEach((element) => {
		if (colors.value.has(buildFeatureValueId(props.column.id, element))) return;
		addColorVariant(props.column.id, element);
	});
	dialogOpen.value = false;
});

const onChange = (facet: string, checked: boolean) => {
	if (checked) {
		if (colors.value.has(buildFeatureValueId(props.column.id, facet))) return;
		addColorVariant(props.column.id, facet);
	}
};

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
						<FormField
							v-for="facet in facets"
							:key="facet[0]"
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
									class="ml-3 flex grow-0 basis-0 items-center p-0"
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
						<FormMessage />
					</FormItem>
				</FormField>

				<DialogFooter>
					<Button type="submit" variant="default"> Save changes </Button>
				</DialogFooter>
				<!-- <div class="mt-4 flex justify-end">
					<Button type="submit"> Submit </Button>
				</div> -->
			</form>
			<!-- <div class="overflow-auto py-4 text-sm">
				<div v-for="facet in facets" :key="facet[0]" :checked="selectedValues.has(facet[0])">
					<span>{{ facet[0] }}</span>
					<Badge class="ml-2" variant="outline">{{ facet[1] }}</Badge>
				</div>
			</div> -->
			<!-- <DialogFooter>
				<Button type="submit"> Save changes </Button>
			</DialogFooter> -->
		</DialogContent>
	</Dialog>
</template>
