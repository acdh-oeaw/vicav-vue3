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
const utterancesWrapper = ref<HTMLDivElement>(null);
const utteranceElements = ref<Array<Element>>([]);
const currentPage = ref(1);
const api = useApiClient();
const scrollComplete = ref<boolean>(false);

const loadNextPage = async function () {
	let text: HttpResponse<CorpusText, string>;
	text = await api.vicav.getCorpusText(
		{
			id: props.params.textId,
			hits: props.params.hits,
			page: currentPage.value,
			size: 10,
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
		$state.loaded();
		if (text.data.utterances !== undefined && text.data.utterances.length < 10) {
			scrollComplete.value = true;
			$state.complete();
		}
	} catch (e) {
		if (e.status === 404 && e.error.detail.indexOf("does not have page") !== -1) {
			scrollComplete.value = true;
			$state.complete();
			return;
		}

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

const scrollParentToChild = function (parent, child) {
	// Where is the parent on page
	var parentRect = parent.getBoundingClientRect();
	// What can you see?
	var parentViewableArea = {
		height: parent.clientHeight,
		width: parent.clientWidth,
	};

	// Where is the child
	var childRect = child.getBoundingClientRect();
	// Is the child viewable?
	var isViewable =
		childRect.top >= parentRect.top &&
		childRect.bottom <= parentRect.top + parentViewableArea.height;
	// if you can't see the child try to scroll parent
	if (!isViewable) {
		// Should we scroll using top or bottom? Find the smaller ABS adjustment
		const scrollTop = childRect.top - parentRect.top;
		const scrollBot = childRect.bottom - parentRect.bottom;
		if (Math.abs(scrollTop) < Math.abs(scrollBot)) {
			// we're near the top of the list
			parent.scrollTop += scrollTop;
		} else {
			// we're near the bottom of the list
			parent.scrollTop += scrollBot;
		}
	}
};

onMounted(async () => {
	await getText();
	const u = utteranceElements.value.find((u) => u.id === props.params.u);
	const window = utterancesWrapper.value.parentElement;
	console.log(utterancesWrapper.value.parentElement);
	if (u !== undefined) scrollParentToChild(window, u);
});
</script>

<template>
	<!-- eslint-disable tailwindcss/no-custom-classname, vue/no-v-html -->
	<div :id="params.textId" ref="utterancesWrapper" class="p-4">
		<h2>{{ params.title }}</h2>
		<div
			v-for="u in utterances"
			:id="u.id"
			:key="u.id"
			ref="utteranceElements"
			class="corpus-utterance"
			v-html="u.content"
		/>
		<InfiniteLoading
			v-if="utterances.length > 0 && !scrollComplete"
			@infinite="handleInfiniteScroll"
		/>
	</div>
</template>

<style>
.u {
	@apply flex gap-2;

	.xml-id {
		@apply min-w-fit px-4 font-bold;
	}

	.speaker {
		@apply font-bold;
	}

	.content {
		.hit {
			@apply font-bold;
		}
	}
}
</style>
