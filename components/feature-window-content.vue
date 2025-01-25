<script lang="ts" setup>
import type { FeatureWindowItem } from "@/types/global.d";

const { simpleItems } = useTEIHeaders();

interface Props {
	params: FeatureWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);
const tooltip: Ref<HTMLElement | null> = ref(null);
const { data: config } = useProjectInfo();

const { data, isPending, isPlaceholderData } = useFeatureById(params);
const openNewWindowFromAnchor = useAnchorClickHandler();
const { showTooltip, tooltipContent, handleHoverTooltip } = useHoverTooltipHandler(tooltip);
const header = simpleItems.value.find((i) => i.id === params.value.textId);
const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const author = computed(() => {
	console.log(header);
	return header?.author;
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
		<Citation
			:author="author"
			:container-title="config?.projectConfig?.title"
			:editor="config?.projectConfig?.editors"
			:title="`${header.label} - ${header?.person.at(0).name}`"
			type="entry"
			:url="config?.projectConfig?.baseURIPublic"
		></Citation>

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

		<div
			v-show="showTooltip"
			ref="tooltip"
			class="absolute left-0 top-5 z-50 w-[200px] bg-white p-2 shadow-md"
			v-html="tooltipContent"
		></div>
	</div>
</template>

<style>
/* stylelint-disable selector-class-pattern */

.tbFeatures {
	@apply w-11/12 border border-solid border-[#59533c];
}

.tdFeaturesCom {
	@apply bg-[#e7e2ca];
}

.tdFeaturesHead {
	@apply border border-solid border-primary text-primary text-lg;
}

.tdFeaturesHeadRight {
	@apply align-top pr-[5px] border border-solid border-primary text-primary text-lg text-right;
}

.tdFeaturesLeft {
	@apply align-top w-[110px] pl-[3px] border border-solid border-primary text-primary;
}

.iFeaturesTrans {
	@apply text-blue-600 text-xs;
}

.tdFeaturesRightSource {
	@apply align-top w-4/5 pl-[3px] border border-solid border-primary bg-primary bg-opacity-30 text-[#7f960a];
}

.tdFeaturesRightTarget {
	@apply align-top w-4/5 pl-[3px] border border-solid border-primary bg-on-primary italic;
}

a.word-search {
	@apply relative text-inherit no-underline;
}

.w,
.phr,
.pc {
	@apply text-inherit not-italic no-underline font-normal text-base text-secondary;
}

.w.sample-text-tooltip {
	@apply bg-yellow-200;
}

.w.highlight {
	@apply p-0 bg-inherit text-red-600;
}
</style>
