<script setup lang="ts">
import type { Table } from "@tanstack/vue-table";
import {
	ChevronFirstIcon,
	ChevronLastIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
} from "lucide-vue-next";

import type { FeatureType } from "@/types/global.d";

interface DataTablePaginationProps {
	table: Table<FeatureType>;
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
					@update:model-value="table.setPageSize"
				>
					<SelectTrigger class="h-8 w-[70px]">
						<SelectValue :placeholder="`${table.getState().pagination.pageSize}`" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem
							v-for="(pageSize, index) in [10, 20, 30, 40, 50]"
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
					variant="outline"
					size="icon"
					class="hidden h-8 w-8 p-0 lg:flex"
					:disabled="!table.getCanPreviousPage()"
					@click="table.setPageIndex(0)"
				>
					<span class="sr-only">Go to first page</span>
					<ChevronFirstIcon class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8 p-0"
					:disabled="!table.getCanPreviousPage()"
					@click="table.previousPage()"
				>
					<span class="sr-only">Go to previous page</span>
					<ChevronLeftIcon class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="h-8 w-8 p-0"
					:disabled="!table.getCanNextPage()"
					@click="table.nextPage()"
				>
					<span class="sr-only">Go to next page</span>
					<ChevronRightIcon class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					class="hidden h-8 w-8 p-0 lg:flex"
					:disabled="!table.getCanNextPage()"
					@click="table.setPageIndex(table.getPageCount() - 1)"
				>
					<span class="sr-only">Go to last page</span>
					<ChevronLastIcon class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</div>
</template>
