<script setup lang="ts">
import type { Column, Table } from "@tanstack/vue-table";
import { ChevronDown, LayoutList, ListChecks, ListTodo, TableProperties } from "lucide-vue-next";
import type { Component } from "vue";

const props = defineProps<{
	table: Table<never>;
}>();

const columns = computed(() => props.table.getAllColumns().filter((column) => column.getCanHide()));

// Source: https://stackoverflow.com/a/64489760
function titleCase(s: string) {
	return s
		.replace(/^[-_]*(.)/, (_, c) => c.toUpperCase()) // Initial char (after -/_)
		.replace(/[-_]+(.)/g, (_, c) => ` ${c.toUpperCase()}`); // First char after each -/_
}

type visibilityState = "ALL_VISIBLE" | "SOME_VISIBLE" | "NONE_VISIBLE";
function getVisibilityState(category: Column<never>) {
	const currentState: visibilityState = category.columns.every((c) => c.getIsVisible())
		? "ALL_VISIBLE"
		: category.columns.some((c) => c.getIsVisible())
			? "SOME_VISIBLE"
			: "NONE_VISIBLE";
	return currentState;
}

function toggleCategory(category: Column<never>) {
	let targetVisibility = true;
	switch (getVisibilityState(category)) {
		case "ALL_VISIBLE":
			targetVisibility = false;
			break;
		default:
			targetVisibility = true;
	}
	category.columns.forEach((c) => {
		if (c.getIsVisible() !== targetVisibility) {
			c.setFilterValue(new Map());
			c.toggleVisibility(targetVisibility);
		}
	});
}
function getAllColumnsVisibilityState() {
	if (props.table.getIsAllColumnsVisible()) return "ALL_VISIBLE";

	const visibleColumns = props.table.getVisibleLeafColumns();
	const hidableColumns = props.table.getAllLeafColumns().filter((c) => !c.getCanHide());
	return visibleColumns.length > hidableColumns.length ? "SOME_VISIBLE" : "NONE_VISIBLE";
}
function toggleAllCategories() {
	let targetVisibility = true;
	switch (getAllColumnsVisibilityState()) {
		case "ALL_VISIBLE":
			targetVisibility = false;
			break;
		default:
			targetVisibility = true;
	}

	if (!targetVisibility) props.table.resetColumnFilters(true);
	props.table.toggleAllColumnsVisible(targetVisibility);
}

const isCollapsibleOpen = ref(columns.value.map(() => false));
const isSubCollapsibleOpen = ref(
	Object.fromEntries(
		columns.value!.map((category) => [category.id, category.columns.map(() => false)]),
	),
);

const visibilityToIcon: Record<visibilityState, Component> = {
	ALL_VISIBLE: ListChecks,
	SOME_VISIBLE: ListTodo,
	NONE_VISIBLE: LayoutList,
};
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button class="ml-auto hidden h-8 lg:flex" size="sm" variant="outline">
				<TableProperties class="mr-2 size-4" />
				Features
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="max-h-[350px] w-72 max-w-none overflow-y-auto">
			<DropdownMenuLabel class="flex items-center justify-between"
				><span>Select features</span
				><Button class="ml-2 h-8" size="sm" variant="outline" @click.stop="toggleAllCategories()"
					><component
						:is="visibilityToIcon[getAllColumnsVisibilityState()]"
						class="mr-2 size-4 align-middle"
					></component
					><span class="align-middle">{{
						getAllColumnsVisibilityState() === "ALL_VISIBLE" ? "Deselect all" : "Select all"
					}}</span></Button
				></DropdownMenuLabel
			>
			<DropdownMenuSeparator />
			<div v-for="(category, idx) in columns" :key="category.id">
				<Collapsible v-slot="{ open }" v-model:open="isCollapsibleOpen[idx]">
					<CollapsibleTrigger class="flex w-full items-center justify-between gap-1 p-2 text-sm">
						<span>{{ titleCase(category.id) }}</span>
						<ChevronDown class="size-4" :class="open ? 'rotate-180' : ''"></ChevronDown>
					</CollapsibleTrigger>

					<CollapsibleContent class="">
						<Collapsible
							v-for="(subcategory, subcatIdx) in category.columns"
							:key="subcategory.id"
							v-slot="{ open: subcatOpen }"
							v-model:open="isSubCollapsibleOpen[category.id]![subcatIdx]"
						>
							<CollapsibleTrigger class="flex w-full items-center gap-1 p-2 text-left text-sm">
								<Button class="mr-2 p-2" variant="outline" @click.stop="toggleCategory(subcategory)"
									><component
										:is="visibilityToIcon[getVisibilityState(subcategory)]"
										class="size-4"
									></component
								></Button>
								<span>{{ titleCase(subcategory.id) }}</span>
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
											column.setFilterValue(new Map());
										}
									"
								>
									{{ column.columnDef.header }}
								</DropdownMenuCheckboxItem>
							</CollapsibleContent>
						</Collapsible>
					</CollapsibleContent>
					<DropdownMenuSeparator />
				</Collapsible>
			</div>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
