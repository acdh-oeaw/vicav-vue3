<script setup lang="ts">
import { Ellipsis } from "@lucide/vue";

import type { Seg, W } from "@/lib/api-client";

const props = defineProps<{
	token: W | Seg;
	compound?: boolean;
	actions: ReadonlyArray<"wordForm" | "dictionary" | "tokenId" | "lemma">;
}>();

const { addWindow } = useWindowsStore();
const lemmaRef = computed(() => props.token["@lemmaRef"]);
const words = computed(() => {
	function collect(token: W | Seg): Array<string> {
		if ("$" in token) return [token.$];
		return token.$$.flatMap((item) =>
			item.w ? collect(item.w) : item.seg ? collect(item.seg) : [],
		);
	}
	return collect(props.token);
});
const available = computed(() =>
	props.actions.some((action) =>
		action === "dictionary" || action === "lemma"
			? Boolean(lemmaRef.value)
			: action === "wordForm"
				? words.value.length > 0
				: Boolean(props.token["@id"]),
	),
);

function quote(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll('"', '\\"');
}

function search(queryString: string, label: string) {
	addWindow({
		targetType: "CorpusQuery",
		title: `Corpus search: ${label}`,
		params: { queryString, mode: "text" },
	} as Parameters<typeof addWindow>[0]);
}

function searchWordForm() {
	const query = words.value.map((word) => `[word="${quote(word)}"]`).join(" ");
	search(props.compound ? `${query} within <seg/>` : query, words.value.join(" "));
}

function searchId() {
	const id = quote(props.token["@id"]);
	search(props.compound ? `[] within <seg id="${id}"/>` : `[wid="${id}"]`, props.token["@id"]);
}

function searchLemma() {
	if (!lemmaRef.value) return;
	const ref = quote(lemmaRef.value);
	search(`[dict="${ref}"] | <seg lemmaRef="${ref}"/> containing []`, lemmaRef.value);
}

function openDictionary() {
	if (!lemmaRef.value) return;
	const id = getDictionaryEntryId(lemmaRef.value);
	addWindow({
		targetType: "DictQuery",
		title: id || "Dictionary Entry",
		params: {
			queryString: id,
			textId: "dc_shawi_eng",
			queryParams: { id },
			isTextInputManual: false,
			isQueryVisible: false,
		},
	});
}
</script>

<template>
	<DropdownMenu v-if="available">
		<DropdownMenuTrigger as-child>
			<button
				:aria-label="`Actions for ${compound ? 'compound' : 'word'} ${words.join(' ')}`"
				class="rounded-sm text-gray-500 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
				type="button"
				@click.stop
			>
				<Ellipsis aria-hidden="true" class="size-4" />
			</button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="start">
			<DropdownMenuItem v-if="actions.includes('wordForm') && words.length" @select="searchWordForm"
				>Search corpus by {{ compound ? "compound " : "" }}word form</DropdownMenuItem
			>
			<DropdownMenuItem v-if="actions.includes('dictionary') && lemmaRef" @select="openDictionary"
				>Open {{ compound ? "compound " : "" }}dictionary entry</DropdownMenuItem
			>
			<DropdownMenuItem v-if="actions.includes('lemma') && lemmaRef" @select="searchLemma"
				>Search corpus by dictionary entry</DropdownMenuItem
			>
			<DropdownMenuItem v-if="actions.includes('tokenId') && token['@id']" @select="searchId"
				>Search corpus by {{ compound ? "compound " : "" }}token ID</DropdownMenuItem
			>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
