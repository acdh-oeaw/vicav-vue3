<script setup lang="ts">
import TableCell from "./TableCell.vue";
import TableRow from "./TableRow.vue";

const props = withDefaults(
	defineProps<{
		colspan?: number;
	}>(),
	{
		colspan: 1,
	},
);
</script>

<template>
	<TableRow>
		<TableCell
			class="text-foreground whitespace-nowrap p-4 align-middle text-sm"
			:class="$attrs.class"
			v-bind="props"
		>
			<div class="flex items-center justify-center py-10">
				<slot />
			</div>
		</TableCell>
	</TableRow>
</template>
