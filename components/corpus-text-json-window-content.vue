<script setup lang="ts">
import type { CorpusTextJSONSchema } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof CorpusTextJSONSchema>["params"] & { label?: string };
}>();
</script>

<template>
	<div>{{ props }}</div>
</template>
