<script lang="ts" setup>
import type { SampleTextWindowItem } from "@/types/global.d";
import type { simpleTEIMetadata } from "@/types/teiCorpus.d";

interface Props {
	params: SampleTextWindowItem["params"];
}
const { simpleItems } = useTEIHeaders();

const props = defineProps<Props>();
const { params } = toRefs(props);
const tooltip = ref(null);
const queryParams = computed(() => {
	return { textId: params.value.textId };
});
const { data, isPending, isPlaceholderData } = useSampleTextById(queryParams);
const openNewWindowFromAnchor = useAnchorClickHandler();
const { showTooltip, tooltipContent, handleHoverTooltip } = useHoverTooltipHandler(tooltip);
const header = simpleItems.value.find((i: simpleTEIMetadata) => i.id === params.value.textId);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const content: Ref<HTMLDivElement | null> = ref(null);

watch(content, () => {
	if (content.value) {
		const playButton = content.value.querySelector("a.play");
		const stopButton = content.value.querySelector("a.stop");
		const audio = content.value.querySelector("audio");

		if (!playButton) return;

		playButton!.addEventListener("click", () => {
			audio!.play();
			playButton?.classList.add("hidden");
			stopButton?.classList.remove("hidden");
		});
		audio!.addEventListener("ended", () => {
			stopButton?.classList.add("hidden");
			playButton?.classList.remove("hidden");
		});
		stopButton!.addEventListener("click", () => {
			audio!.pause();
			stopButton?.classList.add("hidden");
			playButton?.classList.remove("hidden");
		});
	}
});
</script>

<template>
	<div
		class="relative isolate grid size-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<div v-if="params.showCitation">
			<Citation :header="header" type="entry" />
		</div>
		<!-- eslint-disable vue/no-v-html,
			vuejs-accessibility/mouse-events-have-key-events,
			vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->

		<div
			v-show="showTooltip"
			ref="tooltip"
			class="absolute left-0 top-5 z-50 w-[200px] bg-white p-2 shadow-md"
			v-html="tooltipContent"
		></div>
		<div
			v-if="data"
			ref="content"
			class="prose max-w-3xl px-8"
			@click="openNewWindowFromAnchor"
			@mouseover="handleHoverTooltip"
			v-html="data"
		/>

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
</template>

<style>
a > svg {
	@apply self-center;
}
/* stylelint-disable selector-class-pattern */
a.word-search {
	@apply text-inherit no-underline;
}

.w,
.pc {
	@apply text-inherit not-italic;
}

.w.sample-text-tooltip {
	@apply bg-yellow-200;
}

.spSentence {
	@apply block;
}
</style>
