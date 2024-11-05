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
		.replace(/[-_]+(.)/g, (_, c) => " " + c.toUpperCase()); // First char after each -/_
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
		c.toggleVisibility(targetVisibility);
		if (!targetVisibility) c.setFilterValue([]);
	});
}

const isCollapsibleOpen = ref(columns.value.map(() => false));

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
				Columns
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="max-h-[350px] w-64 max-w-none overflow-y-auto">
			<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<div v-for="(group, idx) in columns" :key="group.id">
				<Collapsible v-slot="{ open }" v-model:open="isCollapsibleOpen[idx]">
					<CollapsibleTrigger class="flex w-full items-center gap-1 p-2 text-sm">
						<Button class="mr-2 p-2" variant="outline" @click.stop="toggleCategory(group)"
							><component
								:is="visibilityToIcon[getVisibilityState(group)]"
								class="size-4"
							></component
						></Button>
						<span>{{ titleCase(group.id) }}</span>
						<ChevronDown class="size-4" :class="open ? 'rotate-180' : ''"></ChevronDown>
					</CollapsibleTrigger>

					<CollapsibleContent class="">
						<DropdownMenuCheckboxItem
							v-for="column in group.columns"
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
							{{ column.columnDef.header }}
						</DropdownMenuCheckboxItem>
					</CollapsibleContent>
					<DropdownMenuSeparator />
				</Collapsible>
			</div>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
