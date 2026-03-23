<script lang="ts" setup>
import type { Cell, Column, Row } from "@tanstack/vue-table";

import type { LocationWindowItem } from "@/types/global.ts";
import type { simpleTEIMetadata } from "@/types/teiCorpus";

interface Props {
	params: LocationWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const row = computed(() => {
	return params.value as unknown as Row<unknown>;
});

const rowOriginal = computed(() => {
	return row.value.original as PatchedFeatureType;
});

const allCells = computed(() => {
	return (row.value.getAllCells as () => Array<Cell<unknown, Array<PatchedFeatureType>>>)();
});

const columns = computed(() => {
	return allCells.value
		.filter((cell) => cell.getValue() && (cell.getValue() as Array<PatchedFeatureType>).length > 0)
		.map((cell) => ({ cell, column: cell.column as Column<PatchedFeatureType> }));
});

const citation = computed(() => {
	const author: Array<unknown> = [];
	const place = rowOriginal.value.properties.name;
	return {
		author,
		title: `${place}`,
	} as simpleTEIMetadata;
});

function getHighlightedValues(col: Column<PatchedFeatureType, unknown>) {
	return [...((col.getFilterValue() as Map<string, unknown>)?.keys() ?? [])];
}

function getNonFeatureValue(col: (typeof columns.value)[0]) {
	const value = rowOriginal.value.properties[col.column.columnDef.id!];
	if (!value || typeof value === "string") return value;
	return (value as unknown as Array<Record<string, string>>).map((entry) => entry.name).join(" / ");
}
</script>

<template>
	<div class="relative isolate grid size-full overflow-auto">
		<div v-if="params.showCitation">
			<Citation :header="citation" type="entry" />
		</div>
		<Table>
			<TableBody>
				<TableRow v-for="col in columns" :key="col.column.id">
					<TableCell class="capitalize">{{ col.column.columnDef.header }}</TableCell>
					<TableCell>
						<GeojsonTablePropertyCell
							v-if="typeof rowOriginal.properties[col.column.columnDef.id!] !== 'string'"
							:column="col.column"
							:full-entry="rowOriginal.properties"
							:highlighted-values="getHighlightedValues(col.column)"
							:value="rowOriginal.properties[col.column.columnDef.id!]"
						></GeojsonTablePropertyCell>
						<span v-else class="font-light">{{ getNonFeatureValue(col) }}</span>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</div>
</template>
