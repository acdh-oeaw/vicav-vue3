<script lang="ts" setup>
import type { Column } from "@tanstack/vue-table";
import { ChevronDown } from "lucide-vue-next";

import { useColorsStore } from "@/stores/use-colors-store";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { GeojsonMapSchema } from "@/types/global.d";

interface Props {
	params: Zod.infer<typeof GeojsonMapSchema>["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);

const table = computed(() => tables.value.get(params.value.url));

const categories = computed(() => {
	return table.value?.getAllColumns().filter((column) => column.getCanHide());
});
function titleCase(s: string) {
	return s
		.replace(/^[-_]*(.)/, (_, c) => c.toUpperCase()) // Initial char (after -/_)
		.replace(/[-_]+(.)/g, (_, c) => ` ${c.toUpperCase()}`); // First char after each -/_
}
const isMenuOpen = ref(categories.value!.map(() => false));
const isCollapsibleOpen = ref(
	Object.fromEntries(
		categories.value!.map((category) => [category.id, category.columns.map(() => false)]),
	),
);

const { colors, setColor } = useColorsStore();
</script>

<template>
	<div class="grid items-center border-b border-border bg-surface px-8 py-3 text-on-surface">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-on-surface/75">
			<div v-for="(group, catIdx) in categories" :key="group.id">
				<DropdownMenu v-slot="{ open }" v-model:open="isMenuOpen[catIdx]">
					<DropdownMenuTrigger class="flex w-full items-center gap-1 p-2 text-sm">
						<span>{{ titleCase(group.id) }}</span>
						<Badge
							v-if="group.getLeafColumns().filter((c) => c.getIsVisible()).length"
							variant="outline"
							>{{ group.getLeafColumns().filter((c) => c.getIsVisible()).length }}</Badge
						>

						<ChevronDown class="size-4" :class="open ? 'rotate-180' : ''"></ChevronDown>
					</DropdownMenuTrigger>

					<DropdownMenuContent class="">
						<Collapsible
							v-for="(subcategory, subcatIdx) in group.columns"
							:key="subcategory.id"
							v-slot="{ open: subcatOpen }"
							v-model:open="isCollapsibleOpen[group.id]![subcatIdx]"
						>
							<CollapsibleTrigger
								class="flex w-full items-center justify-between gap-1 p-2 text-left text-sm"
							>
								<div>
									<span>{{ titleCase(subcategory.id) }}</span>
									<Badge
										v-if="
											subcategory.columns.length > 0 &&
											subcategory.getLeafColumns().filter((c) => c.getIsVisible()).length
										"
										class="ml-2"
										variant="outline"
										>{{
											subcategory.getLeafColumns().filter((c) => c.getIsVisible()).length
										}}</Badge
									>
								</div>

								<ChevronDown
									class="size-4 shrink-0 grow-0"
									:class="subcatOpen ? 'rotate-180' : ''"
								></ChevronDown>
							</CollapsibleTrigger>

							<CollapsibleContent class="">
								<DropdownMenuCheckboxItem
									v-for="column in subcategory.columns"
									:key="column.id"
									:checked="column.getIsVisible()"
									@select.prevent
									@update:checked="
										(value) => {
											column.toggleVisibility(!!value);
											column.setFilterValue([]);
										}
									"
								>
									<span class="flex-1">{{ column.columnDef.header }}</span>

									<label
										v-if="
											column.getIsVisible() &&
											(!column.getIsFiltered() ||
												(column.getFilterValue() as Array<string>).length <= 0)
										"
										class="ml-3 flex grow-0 basis-0 items-center p-0"
										@click.capture.stop
									>
										<div
											class="size-4 rounded"
											:style="{
												backgroundColor: `var(--${column.id})`,
												stroke: `var(--${column.id})`,
											}"
										></div>
										<input
											class="size-0"
											type="color"
											:value="colors.get(column.id)?.colorCode || '#cccccc'"
											@click.capture.stop
											@input="
												(event) => {
													//@ts-expect-error target.value not recognized
													setColor({ id: column.id, colorCode: event.target!.value });
												}
											"
										/>
										<span class="sr-only">Select color</span>
									</label>
									<FeatureSelectionDialog :column="column as Column<unknown>" />
								</DropdownMenuCheckboxItem>
							</CollapsibleContent>
						</Collapsible>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	</div>
</template>
