<script lang="ts" setup>
import type { ExploreSamplesWindowItem } from "@/types/global.d";

interface Props {
	params: ExploreSamplesWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);
const content: Ref<HTMLElement | undefined> = ref();
const tooltip: Ref<HTMLElement | null> = ref(null);

const { simpleItems } = useTEIHeaders();

const filters: Array<"region" | "settlement"> = ["region", "settlement"];
const ids = computed(() => {
	return params.value.ids
		? params.value.ids
		: simpleItems.value
				.filter((item) => params.value.dataType === item.dataType)
				.filter((item) => {
					if (!params.value.region && !params.value.place) return true;
					const filter_results = filters.map((key) => {
						if (params.value[key]) return params.value[key] === item.place[key];
						return null;
					});
					return filter_results.includes(true);
				})
				.filter((item) => {
					if (params.value.person) {
						return params.value.person === item.person.name;
					} else return true;
				})
				.map((item) => item.id)
				.join(",");
});

const features: Ref<Array<string>> = ref([]);
const page: Ref<number> = ref(1);

watch(params, (value) => {
	if (value.features) features.value = value.features.split(",");
	if (value.page) page.value = value.page;
});

const extractedParams = computed(() => {
	return {
		dataType: params.value.dataType,
		ids: ids.value,
		features: features.value.join(","),
		word: params.value.word,
		translation: params.value.translation,
		comment: params.value.comment,
		page: page.value,
	};
});

const { data, isPending, isPlaceholderData } = useExploreSamplesResult(extractedParams);

const anchorRouter = useExploreSamplesClickHandler(features, page);

const { showTooltip, tooltipContent, handleHoverTooltip } = useHoverTooltipHandler(tooltip);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});
const { findWindowByTypeAndParam } = useWindowsStore();

watch(page, () => {
	const window = findWindowByTypeAndParam("ExploreSamples", "ids", ids.value);
	(window! as ExploreSamplesWindowItem).params.page = page.value;
});

watch(isLoading, () => {
	if (content.value) content.value.scrollTop = 0;
});
</script>

<template>
	<div
		class="relative isolate grid size-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable vue/no-v-html,
			vuejs-accessibility/mouse-events-have-key-events,
			vuejs-accessibility/click-events-have-key-events,
			vuejs-accessibility/no-static-element-interactions -->
		<div
			v-if="!isPending"
			ref="content"
			class="prose max-w-3xl p-8"
			@click="anchorRouter"
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
	@apply align-top w-[110px] pl-[3px] border border-solid border-primary bg-on-primary text-header;
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

	a.show-sentence {
		@apply pr-2;
	}

	.spSentence {
		@apply inline;
	}
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

.sentences-nav input {
	@apply w-7 border-gray-400 rounded-lg  p-1 m-2 border shadow;
}

.sentences-nav a {
	@apply p-2 leading-9 align-middle;
}
</style>
