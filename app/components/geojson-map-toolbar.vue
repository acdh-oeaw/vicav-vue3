<script lang="ts" setup>
import type { Column, Table } from "@tanstack/vue-table";
import { ChevronDown, Info } from "lucide-vue-next";
import type Zod from "zod";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { GeojsonMapSchema } from "@/types/global.ts";

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

const searchbar = useTemplateRef("searchbar");
const { addMetaFilter } = useFilterParser();
const { metaInfo } = useWibarabTriggers();
const isMetaMenuOpen = ref([...metaInfo.value.keys()].map(() => false));
function addMetaFilterToQuery(key: string, val: string) {
	if (!searchbar.value) return;
	searchbar.value.value = addMetaFilter(searchbar.value.value, key, val);
	searchbar.value?.submitSearch();
}
</script>

<template>
	<div class="grid items-center border-b border-border bg-surface px-0 py-2 text-on-surface">
		<div class="mb-1 flex flex-wrap items-center gap-y-1 px-2 font-medium text-neutral-700">
			<div v-for="(group, catIdx) in categories?.slice(0, -2)" :key="group.id">
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

					<DropdownMenuContent class="max-h-[var(--radix-dropdown-menu-content-available-height)]">
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
		<div
			class="flex flex-wrap items-center gap-y-1 bg-muted px-2 py-1 font-medium text-neutral-700"
		>
			<div v-for="group in categories?.slice(-2)" :key="group.id" class="inline-block">
				<FeatureSelectionDialog
					v-for="column in group.columns"
					:key="column.id"
					class="transition hover:text-black"
					:column="column as Column<unknown>"
					:hide-checkbox="true"
					:table="table as Table<unknown>"
				/>
			</div>
			<DropdownMenu v-slot="{ open }">
				<DropdownMenuTrigger class="inline-flex items-center gap-1 p-2 text-sm">
					<span class="hover:text-black">Metadata filters</span>

					<TooltipProvider :delay-duration="100">
						<Tooltip>
							<TooltipTrigger class="transition hover:text-black">
								<Info class="size-4"></Info>
								<span class="sr-only">Info</span>
							</TooltipTrigger>
							<TooltipContent class="max-w-60 bg-white text-sm">
								<span>These filters are only applied to the features in the query.</span>
							</TooltipContent>
						</Tooltip></TooltipProvider
					>
					<ChevronDown class="size-4" :class="open ? 'rotate-180' : ''"></ChevronDown>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					class="inline-block max-h-[var(--radix-dropdown-menu-content-available-height)] w-52"
				>
					<Collapsible
						v-for="([key, val], idx) in metaInfo"
						:key="key"
						v-model:open="isMetaMenuOpen[idx]"
					>
						<CollapsibleTrigger class="flex w-full items-center gap-1 p-2 text-sm">
							<span class="capitalize">{{ key }}</span>
							<ChevronDown
								class="size-4"
								:class="isMetaMenuOpen[idx] ? 'rotate-180' : ''"
							></ChevronDown>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<Button
								v-for="entry in val.toSorted((a, b) =>
									a.displayValue?.localeCompare(b.displayValue),
								)"
								:key="entry.value"
								class="h-auto w-full justify-start p-1 pl-4 text-start text-sm font-normal whitespace-normal"
								variant="ghost"
								@click="() => addMetaFilterToQuery(key, entry.value)"
								>{{ entry.displayValue ?? entry.value }}</Button
							>
						</CollapsibleContent>
					</Collapsible>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
		<div
			class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 overflow-x-clip overflow-y-visible px-2 text-sm font-medium text-neutral-700"
		>
			<MultiValueSearchbar
				v-if="table"
				ref="searchbar"
				:table="table as Table<unknown>"
				:triggers="wibarabTriggers"
			/>
		</div>
	</div>
</template>
