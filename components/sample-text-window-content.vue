<script lang="ts" setup>
import type { SampleTextWindowItem } from "@/types/global.d";

interface Props {
	params: SampleTextWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);
const tooltip = ref(null);

const { data, isPending, isPlaceholderData } = useSampleTextById(params);
const openNewWindowFromAnchor = useAnchorClickHandler();
const { showTooltip, tooltipContent, handleHoverTooltip } = useHoverTooltipHandler(tooltip);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});
</script>

<template>
	<div
		class="relative isolate grid size-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
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
			class="prose max-w-3xl p-8"
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
