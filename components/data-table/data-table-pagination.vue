<script setup lang="ts">
import type { Table } from "@tanstack/vue-table";
import {
	ChevronFirstIcon,
	ChevronLastIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-vue-next";

interface DataTablePaginationProps {
	table: Table<never>;
}
defineProps<DataTablePaginationProps>();
</script>

<template>
	<div class="flex items-center justify-between px-2">
		<div class="flex items-center space-x-6 lg:space-x-8">
			<div class="flex items-center space-x-2">
				<p id="pagesizeSelect" class="text-sm font-medium">Pagesize:</p>
				<Select
					aria-labelledby="pagesizeSelect"
					:model-value="`${table.getState().pagination.pageSize}`"
					@update:model-value="table.setPageSize(parseInt($event))"
				>
					<SelectTrigger class="h-8 w-[70px]">
						<SelectValue :placeholder="`${table.getState().pagination.pageSize}`" />
					</SelectTrigger>
					<SelectContent class="bg-white">
						<SelectItem
							v-for="(pageSize, index) in [10, 20, 30, 40, 50] as Array<never>"
							:key="index"
							:value="`${pageSize}`"
						>
							{{ pageSize }}
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div class="flex w-[100px] items-center justify-center text-sm font-medium">
				Page {{ table.getState().pagination.pageIndex + 1 }} of
				{{ table.getPageCount() }}
			</div>
			<div class="flex items-center space-x-2">
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
		</div>
	</div>
</template>
