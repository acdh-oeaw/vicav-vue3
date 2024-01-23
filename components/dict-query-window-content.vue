<script setup lang="ts">
import type { DictQuerySchema } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof DictQuerySchema>["params"];
}>();
const { params } = toRefs(props);
</script>

<template>
	<pre>{{ params }}</pre>
</template>
