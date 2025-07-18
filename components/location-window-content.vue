<script lang="ts" setup>
import type { Cell, Column, Row } from "@tanstack/vue-table";

import type { LocationWindowItem } from "@/types/global.d";
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
							v-if="col.column.columnDef.header !== 'Name'"
							:column="col.column"
							:full-entry="rowOriginal.properties"
							:highlighted-values="[]"
							:value="rowOriginal.properties[col.column.columnDef.id!]"
						></GeojsonTablePropertyCell>
						<span v-else class="font-light">{{
							rowOriginal.properties[col.column.columnDef.id!]
						}}</span>
					</TableCell>
				</TableRow>
			</TableBody>
		</Table>
	</div>
</template>
