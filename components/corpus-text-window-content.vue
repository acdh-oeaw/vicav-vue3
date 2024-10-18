<script setup lang="ts">
//@ts-expect-error no types available
import "v3-infinite-loading/lib/style.css"; //required if you're not going to override default slots

import InfiniteLoading from "v3-infinite-loading";
import type { StateHandler } from "v3-infinite-loading/lib/types";

import type { CorpusTextUtterances } from "@/lib/api-client";
import type { CorpusTextSchema, VicavHTTPError } from "@/types/global";

const props = defineProps<{
	params: Zod.infer<typeof CorpusTextSchema>["params"] & { label?: string };
}>();

const { simpleItems } = useTEIHeaders();
const utterances = ref<Array<CorpusTextUtterances>>([]);
const utterancesWrapper = ref<HTMLDivElement | null>(null);
const utteranceElements = ref<Array<Element>>([]);
const currentPage = ref(1);
const api = useApiClient();
const scrollComplete = ref<boolean>(false);
const teiHeader = simpleItems.value.find((header) => header.id === props.params.textId);
const loadNextPage = async function () {
	const text = await api.vicav.getCorpusText(
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
		const err = e as VicavHTTPError;
		if (err.status === 404 && err.error?.detail?.indexOf("does not have page") !== -1) {
			scrollComplete.value = true;
			$state.complete();
			return;
		}

		$state.error();
	}
};

const scrollParentToChild = function (parent: Element, child: Element) {
	// Where is the parent on page
	const parentRect = parent.getBoundingClientRect();
	// What can you see?
	const parentViewableArea = {
		height: parent.clientHeight,
		width: parent.clientWidth,
	};

	// Where is the child
	const childRect = child.getBoundingClientRect();
	// Is the child viewable?
	const isViewable =
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
	const u = utteranceElements.value.find((u) => u.id === props.params.u);
	const window = utterancesWrapper.value?.parentElement;
	if (u !== undefined) scrollParentToChild(window!, u);
});
</script>

<template>
	<!-- eslint-disable tailwindcss/no-custom-classname, vue/no-v-html -->
	<div :id="params.textId" ref="utterancesWrapper" class="p-4">
		<h2 class="m-3 text-lg">{{ props.params.label }}</h2>

		<table class="m-3 border border-gray-300">
			<thead>
				<tr></tr>
				<tr></tr>
			</thead>
			<tbody>
				<tr>
					<th>Contributed by:</th>
					<td>{{ teiHeader?.resp }}</td>
				</tr>
				<tr>
					<th>Speaker:</th>
					<td>
						{{ teiHeader?.person.name }} (age: {{ teiHeader?.person.age }}, sex:
						{{ teiHeader?.person.sex }})
					</td>
				</tr>
			</tbody>
		</table>
		<div
			v-for="u in utterances"
			:id="u.id"
			:key="u.id"
			ref="utteranceElements"
			class="corpus-utterance table-row"
			v-html="u.content"
		/>
		<InfiniteLoading v-if="!scrollComplete" @infinite="handleInfiniteScroll" />
	</div>
</template>

<style>
.u {
	@apply flex gap-2;

	.xml-id {
		@apply min-w-fit px-3 font-bold;
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
