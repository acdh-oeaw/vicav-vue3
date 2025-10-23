<script lang="ts" setup>
import type { Column, Table } from "@tanstack/vue-table";
import { ChevronDown } from "lucide-vue-next";
import type Zod from "zod";

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

const { wibarabTriggers } = useWibarabTriggers();

const isMenuOpen = ref(categories.value!.map(() => false));
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
						<GeojsonMapToolbarItem
							v-for="column in group.columns"
							:key="column.id"
							:item="column as Column<unknown>"
							:table="table as Table<unknown>"
						/>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-on-surface/75">
			<MultiValueSearchbar
				v-if="table"
				:table="table as Table<unknown>"
				:triggers="wibarabTriggers"
			/>
		</div>
	</div>
</template>
