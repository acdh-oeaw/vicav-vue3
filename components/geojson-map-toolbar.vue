<script lang="ts" setup>
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
		.replace(/[-_]+(.)/g, (_, c) => " " + c.toUpperCase()); // First char after each -/_
}
const isCollapsibleOpen = ref(categories.value!.map(() => false));

const { colors, addColor } = useColorsStore();
</script>

<template>
	<div class="grid items-center border-b border-border bg-surface px-8 py-3 text-on-surface">
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-on-surface/75">
			<div v-for="(group, idx) in categories" :key="group.id">
				<DropdownMenu v-slot="{ open }" v-model:open="isCollapsibleOpen[idx]">
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
						<DropdownMenuCheckboxItem
							v-for="column in group.columns"
							:key="column.id"
							:checked="column.getIsVisible()"
							@select.prevent
							@update:checked="
								(value) => {
									column.toggleVisibility(!!value);
									column.setFilterValue([]);
									addColor({ id: column.id, colorCode: '#cccccc' });
								}
							"
						>
							<span class="flex-1">{{ column.columnDef.header }}</span>
							<label v-if="column.getIsVisible()" class="grow-0 basis-0 p-0">
								<input
									class="size-5"
									type="color"
									:value="colors[column.id]?.colorCode || '#cccccc'"
									@click.capture.stop
									@input="
										(event) => {
											//@ts-expect-error target.value not recognized
											addColor({ id: column.id, colorCode: event.target!.value });
										}
									"
								/>
								<span class="sr-only">Select color</span>
							</label>
						</DropdownMenuCheckboxItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	</div>
</template>
