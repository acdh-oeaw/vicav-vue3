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
	<div v-if="hasPagination" class="flex items-center justify-between px-2">
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
			</div>
			<div class="flex items-center space-x-2 text-sm font-medium">
				<template v-if="pageSelect">
					<label for="pageSelect">Page</label>
					<Select
						aria-labelledby="pageSelect"
						:model-value="`${table.getState().pagination.pageIndex + 1}`"
						@update:model-value="table.setPageIndex(parseInt($event) - 1)"
					>
						<SelectTrigger id="pageSelect" class="h-8 w-17.5">
							<SelectValue :placeholder="`${table.getState().pagination.pageIndex + 1}`" />
						</SelectTrigger>
						<SelectContent class="bg-white" :side="openToSide">
							<SelectItem v-for="page in table.getPageCount()" :key="page" :value="`${page}`">
								{{ page }}
							</SelectItem>
						</SelectContent>
					</Select>
					<span>of {{ table.getPageCount() }}</span>
				</template>
				<template v-else>
					<span
						>Page {{ table.getState().pagination.pageIndex + 1 }} of
						{{ table.getPageCount() }}</span
					>
				</template>
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
