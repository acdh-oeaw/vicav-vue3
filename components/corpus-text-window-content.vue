<script setup lang="ts">
import "v3-infinite-loading/lib/style.css"; //required if you're not going to override default slots

import InfiniteLoading from "v3-infinite-loading";
import type { StateHandler } from "v3-infinite-loading/lib/types";

import type { CorpusText, CorpusTextUtterances, HttpResponse } from "@/lib/api-client";
import type { CorpusTextSchema } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof CorpusTextSchema>["params"];
}>();

const utterances = ref<Array<CorpusTextUtterances>>([]);
const utteranceElements = ref<Array<Element>>([]);
const currentPage = ref(1);
const api = useApiClient();

const loadNextPage = async function () {
	let text: HttpResponse<CorpusText, string>;
	text = await api.vicav.getCorpusText(
		{
			id: props.params.textId,
			hits: props.params.hits,
			page: currentPage.value,
		},
		{ headers: { Accept: "application/json" } },
	);
	if (text.data.utterances !== undefined) {
		utterances.value = utterances.value.concat(text.data.utterances);
		currentPage.value = currentPage.value + 1;
	}
	return text;
};

const handleInfiniteScroll = async function ($state: StateHandler) {
	try {
		const text = await loadNextPage();
		currentPage.value = currentPage.value + 1;
		$state.loaded();
		if (text.data.utterances !== undefined && text.data.utterances.length < 10) $state.complete();
	} catch (e) {
		$state.error();
	}
};

const getText = async function () {
	let text;
	do {
		text = await loadNextPage();
	} while (
		text.data.utterances !== undefined &&
		text.data.utterances.filter((u) => u.id === props.params.u).length === 0 &&
		text.data.utterances.length !== 0
	);
};

onMounted(async () => {
	await getText();
	const u = utteranceElements.value.find((u) => u.id === props.params.u);
	if (u !== undefined) u.scrollIntoView({ behavior: "smooth" });
});
</script>

<template>
	<!-- eslint-disable tailwindcss/no-custom-classname, vue/no-v-html -->
	<div :id="params.textId" class="p-4">
		<h2>{{ params.textId }}</h2>
		<div
			v-for="u in utterances"
			:id="u.id"
			:key="u.id"
			ref="utteranceElements"
			class="corpus-utterance"
			v-html="u.content"
		/>
		<InfiniteLoading @infinite="handleInfiniteScroll" />
	</div>
</template>

<style>
.u {
	display: flex;

	.xml-id {
		min-width: fit-content;
		padding: 0 20px;
		font-weight: 700;
	}

	.speaker {
		padding: 20px;
		font-weight: 700;
	}

	.content {
		.hit {
			font-weight: 700;
		}
	}
}
</style>
