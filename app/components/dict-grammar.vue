<script setup lang="ts">
import type { RenderedGrammarItem } from "@/utils/dict-entry-rendering";

const props = defineProps<{ items: Array<RenderedGrammarItem>; fallbackPartOfSpeech?: string }>();
const valid = computed(() => props.items.filter((item) => item.value && item.value !== "-"));
const isVerb = computed(
	() =>
		(
			valid.value.find((item) => item.label === "Part of speech")?.value ??
			props.fallbackPartOfSpeech
		)?.toLowerCase() === "verb",
);
const heading = computed(() =>
	valid.value
		.filter((item) => item.label === "Part of speech" || (item.label === "Class" && !isVerb.value))
		.map((item) => item.value)
		.join(", "),
);
const roots = computed(() =>
	valid.value.filter((item) => ["Syn root", "Dia root", "Root"].includes(item.label)),
);
const details = computed(() =>
	valid.value
		.filter(
			(item) =>
				(item.label === "Class" && isVerb.value) ||
				!["Part of speech", "Class", "Syn root", "Dia root", "Root"].includes(item.label),
		)
		.toSorted((a, b) => Number(b.label === "MSD") - Number(a.label === "MSD")),
);
</script>

<template>
	<span v-if="heading">{{ heading }}</span
	><template v-if="details.length">
		{{ " ("
		}}<template v-for="(item, index) in details" :key="index"
			><span v-if="index">, </span
			><span v-if="item.label === 'Class' && isVerb" class="text-xs text-gray-500 uppercase"
				>Form: </span
			><span v-if="item.label === 'Pattern'" class="text-xs text-gray-500 uppercase">Pattern: </span
			>{{ item.value }}</template
		>)</template
	><template v-for="(root, index) in roots" :key="index"
		><span v-if="index || heading || details.length">, </span
		><span v-if="root.label === 'Dia root'" class="text-xs text-gray-500 uppercase">Diachron: </span
		>{{ root.label === "Root" ? `${root.value} (Root)` : `√${root.value}` }}</template
	>
</template>
