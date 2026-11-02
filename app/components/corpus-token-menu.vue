<script setup lang="ts">
import type { Seg, W } from "@/lib/api-client";

const props = defineProps<{
	token: W | Seg;
	compound?: boolean;
	actions: ReadonlyArray<"wordForm" | "dictionary" | "lemma">;
}>();

const { addWindow } = useWindowsStore();
const menuId = useId();
const openMenuId = useState<string | null>("open-corpus-token-menu", () => null);
const isOpen = computed(() => openMenuId.value === menuId);

function setOpen(open: boolean) {
	if (open) openMenuId.value = menuId;
	else if (isOpen.value) openMenuId.value = null;
}

onUnmounted(() => {
	if (isOpen.value) openMenuId.value = null;
});

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
			: words.value.length > 0,
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
	<DropdownMenu v-if="available" :open="isOpen" @update:open="setOpen">
		<DropdownMenuTrigger as-child>
			<component
				:is="compound ? 'div' : 'button'"
				:aria-label="`Actions for ${compound ? 'compound' : 'word'} ${words.join(' ')}`"
				class="cursor-pointer rounded-sm hover:bg-primary/30 focus-visible:outline-2 focus-visible:outline-primary"
				:role="compound ? 'button' : undefined"
				:tabindex="compound ? 0 : undefined"
				:type="compound ? undefined : 'button'"
				@click.stop
				@keydown.stop
				@pointerdown.stop
			>
				<slot />
			</component>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="start" class="whitespace-nowrap">
			<DropdownMenuItem v-if="actions.includes('wordForm') && words.length" @select="searchWordForm"
				>Search corpus by {{ compound ? "compound " : "" }}word form</DropdownMenuItem
			>
			<DropdownMenuItem v-if="actions.includes('dictionary') && lemmaRef" @select="openDictionary"
				>Open {{ compound ? "compound " : "" }}dictionary entry</DropdownMenuItem
			>
			<DropdownMenuItem v-if="actions.includes('lemma') && lemmaRef" @select="searchLemma"
				>Search corpus by dictionary entry</DropdownMenuItem
			>
		</DropdownMenuContent>
	</DropdownMenu>
	<slot v-else />
</template>
