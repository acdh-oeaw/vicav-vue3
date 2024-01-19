<script lang="ts" setup>
import type { FeatureWindowItem } from "@/types/global.d";

interface Props {
	params: FeatureWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isPending, isPlaceholderData } = useFeatureById(params);
const openNewWindowFromAnchor = useAnchorClickHandler();

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});
</script>

<template>
	<div
		class="relative isolate grid h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div v-if="data" class="prose max-w-3xl p-8" @click="openNewWindowFromAnchor" v-html="data" />

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
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
	@apply align-top pr-[5px] border border-solid border-primary text-on-primary text-lg text-right;
}

.tdFeaturesLeft {
	@apply align-top w-[110px] pl-[3px] border border-solid border-primary bg-on-primary text-primary;
}

.iFeaturesTrans {
	@apply text-blue-600 text-xs;
}

.tdFeaturesRightSource {
	@apply align-top w-4/5 pl-[3px] border border-solid border-primary bg-[#a85d8f] text-[#7f960a];
}

.tdFeaturesRightTarget {
	@apply align-top w-4/5 pl-[3px] border border-solid border-primary bg-on-primary text-[#a58103] italic;
}

a.word-search {
	@apply text-inherit;
}

.w {
	@apply text-inherit not-italic;
}

.w.highlight {
	@apply p-0 bg-inherit text-red-600;
}
</style>
