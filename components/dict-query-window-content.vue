<script setup lang="ts">
import type { DictQuerySchema } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof DictQuerySchema>["params"];
}>();
const { params } = toRefs(props);

defineEmits(["updateQueryParam"]);

const dictStore = useDictStore();
const { registry } = storeToRefs(dictStore);
await dictStore.suspense();
</script>

<template>
	<pre>params: {{ params }}</pre>
	<pre>dictionaries: {{ registry }}</pre>
</template>
