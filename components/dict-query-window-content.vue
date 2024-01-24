<script setup lang="ts">
import type { DictQuerySchema } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof DictQuerySchema>["params"];
}>();
const { params } = toRefs(props);

defineEmits(["updateQueryParam"]);

const dictStore = useDictStore();
await dictStore.suspense();
const myDict = dictStore.getDictById(params.value.textId);
</script>

<template>
	<div
		v-if="!!myDict"
		class="relative isolate h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': !!myDict }"
	>
		dbName: {{ myDict?.id }}
	</div>
	<div v-else>Error: Dictionary {{ params.textId }} could not be loaded.</div>
</template>
