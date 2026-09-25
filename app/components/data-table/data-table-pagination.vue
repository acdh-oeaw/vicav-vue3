<script setup lang="ts">
import { ChevronFirstIcon, ChevronLastIcon, ChevronLeftIcon, ChevronRightIcon } from "@lucide/vue";
import type { Table } from "@tanstack/vue-table";

interface DataTablePaginationProps {
	table: Table<never>;
	openToSide?: "top" | "right" | "bottom" | "left";
	pageSelect?: boolean;
}

const props = defineProps<DataTablePaginationProps>();

const hasPagination = computed(() => props.table.options.getPaginationRowModel != null);
</script>

<template>
	<div
		v-if="hasPagination"
		class="flex items-center gap-1 px-1 text-sm font-medium whitespace-nowrap"
	>
		<span id="pagesizeSelect" class="sr-only">Rows per page</span>
		<Select
			aria-labelledby="pagesizeSelect"
			:model-value="`${table.getState().pagination.pageSize}`"
			@update:model-value="table.setPageSize(parseInt($event))"
		>
			<SelectTrigger class="h-8 w-14 px-2" title="Rows per page">
				<SelectValue :placeholder="`${table.getState().pagination.pageSize}`" />
			</SelectTrigger>
			<SelectContent class="bg-white" :side="openToSide">
				<SelectItem
					v-for="(pageSize, index) in [10, 20, 30, 40, 50] as Array<never>"
					:key="index"
					:value="`${pageSize}`"
				>
					{{ pageSize }}
				</SelectItem>
			</SelectContent>
		</Select>
		<Button
			class="hidden size-8 p-0 lg:flex"
			:disabled="!table.getCanPreviousPage()"
			size="icon"
			variant="outline"
			@click="table.setPageIndex(0)"
		>
			<span class="sr-only">Go to first page</span>
			<ChevronFirstIcon class="size-4" />
		</Button>
		<Button
			class="size-8 p-0"
			:disabled="!table.getCanPreviousPage()"
			size="icon"
			variant="outline"
			@click="table.previousPage()"
		>
			<span class="sr-only">Go to previous page</span>
			<ChevronLeftIcon class="size-4" />
		</Button>
		<template v-if="pageSelect">
			<span id="pageSelect" class="sr-only">Page</span>
			<Select
				aria-labelledby="pageSelect"
				:model-value="`${table.getState().pagination.pageIndex + 1}`"
				@update:model-value="table.setPageIndex(parseInt($event) - 1)"
			>
				<SelectTrigger class="h-8 w-14 px-2" title="Page">
					<SelectValue :placeholder="`${table.getState().pagination.pageIndex + 1}`" />
				</SelectTrigger>
				<SelectContent class="bg-white" :side="openToSide">
					<SelectItem v-for="page in table.getPageCount()" :key="page" :value="`${page}`">
						{{ page }}
					</SelectItem>
				</SelectContent>
			</Select>
			<span>/ {{ table.getPageCount() }}</span>
		</template>
		<span v-else class="px-1">
			{{ table.getState().pagination.pageIndex + 1 }} / {{ table.getPageCount() }}
		</span>
		<Button
			class="size-8 p-0"
			:disabled="!table.getCanNextPage()"
			size="icon"
			variant="outline"
			@click="table.nextPage()"
		>
			<span class="sr-only">Go to next page</span>
			<ChevronRightIcon class="size-4" />
		</Button>
		<Button
			class="hidden size-8 p-0 lg:flex"
			:disabled="!table.getCanNextPage()"
			size="icon"
			variant="outline"
			@click="table.setPageIndex(table.getPageCount() - 1)"
		>
			<span class="sr-only">Go to last page</span>
			<ChevronLastIcon class="size-4" />
		</Button>
	</div>
</template>
