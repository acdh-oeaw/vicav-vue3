<script setup lang="ts">
import "v3-infinite-loading/lib/style.css"; //required if you're not going to override default slots

import { Play } from "lucide-vue-next";
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
	const window = utterancesWrapper.value?.parentElement?.parentElement;
	if (u !== undefined) scrollParentToChild(window!, u);
});

watch(utteranceElements.value, (value) => {
	if (value.length > 0) {
		value.forEach((u) => {
			const playButton = u.querySelector("a.play");
			const audio = u.querySelector("audio");
			if (playButton && audio) {
				playButton!.addEventListener("click", (_e) => audio!.play());
			}
		});
	}
});
</script>

<template>
	<div>
		<div v-if="params.showCitation">
			<Citation :header="teiHeader" type="entry" />
		</div>
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
					<th>Speakers:</th>
					<td>
						<span v-for="(person, index) in teiHeader?.person" :key="index">
							{{ person.name }} (age: {{ person.age }}, sex: {{ person.sex }})
							<span v-if="index < (teiHeader?.person.length || 1) - 1">, </span>
						</span>
					</td>
				</tr>
			</tbody>
		</table>
		<table>
			<tr
				v-for="u in utterances"
				:id="u.id"
				:key="u.id"
				ref="utteranceElements"
				class="corpus-utterance u table-row"
			>
				<td>
					<a v-if="u.audio" class="play mt-1"
						><Play class="size-4" /><span class="hidden">Play</span></a
					>
					<!-- eslint-disable-next-line vuejs-accessibility/media-has-caption -->
					<audio v-if="u.audio" hidden="hidden">
						<source :src="u.audio" />
					</audio>
				</td>
				<th class="min-w-fit px-3 font-bold">
					{{ u.id }}
				</th>
				<td class="table-cell" v-html="u.content"></td>
			</tr>
		</table>
		<InfiniteLoading v-if="!scrollComplete" @infinite="handleInfiniteScroll" />
	</div>
</template>

<style>
.u {
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
