<script lang="ts" setup>
import type { ExploreSamplesWindowItem } from "@/types/global.d";

interface Props {
	params: ExploreSamplesWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);
const content = ref(null);
const tooltip = ref(null);

const { simpleItems } = useTEIHeaders();

const filters = ["region", "place"];
const persons = params.value.person
	? params.value.person
	: simpleItems.value
			.filter((item) => {
				const filter_results = filters.map((key) => {
					if (params.value[key]) return params.value[key] === item.place[key];
				});
				return filter_results.includes(true);
			})
			.map((item) => item.person.name)
			.join(",");

const features = ref([]);
if (params.value.features) features.value = params.value.features.split(",");

const extractedParams = computed(() => {
	return {
		dataType: params.value.dataType,
		person: persons,
		features: features.value,
		word: params.value.word,
		translation: params.value.translation,
		comment: params.value.comment,
	};
});

const { data, isPending, isPlaceholderData } = useExploreSamplesResult(extractedParams);

const anchorRouter = useExploreSamplesClickHandler(features);

const { showTooltip, tooltipContent, handleHoverTooltip } = useHoverTooltipHandler(tooltip);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});
</script>

<template>
	<div
		class="relative isolate grid h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable vue/no-v-html,
			vuejs-accessibility/mouse-events-have-key-events,
			vuejs-accessibility/click-events-have-key-events,
			vuejs-accessibility/no-static-element-interactions -->
		<div
			v-if="data"
			ref="content"
			class="prose max-w-3xl p-8"
			@click="anchorRouter"
			@change="anchorRouter"
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
	@apply border border-solid border-primary bg-primary text-on-primary text-lg;
}

.tdFeaturesHeadRight {
	@apply align-top pr-[5px] border border-solid border-primary bg-primary text-on-primary text-lg text-right;
}

.tdFeaturesHeadLeft {
	@apply align-top w-[110px] pl-[3px] border border-solid border-primary bg-on-primary text-primary;
}

.iFeaturesTrans {
	@apply text-blue-600 text-xs;
}

.tdFeaturesRightSource {
	@apply align-top w-4/5 pl-[3px] border border-solid border-primary
bg-primary bg-opacity-30 text-[#7f960a];
}

.tdFeaturesRightTarget {
	@apply align-top w-4/5 pl-[3px]
border border-solid border-primary bg-on-primary text-[#a58103] italic;
}

a.word-search {
	@apply relative text-inherit no-underline;
}

.w,
.phr,
.pc {
	@apply text-inherit not-italic no-underline;
}

.w.sample-text-tooltip {
	@apply bg-yellow-200;
}

.w.highlight {
	@apply p-0 bg-inherit text-red-600;
}
</style>
