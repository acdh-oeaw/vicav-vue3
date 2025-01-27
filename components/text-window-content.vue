<script lang="ts" setup>
import type { TextWindowItem } from "@/types/global.d";

interface Props {
	params: TextWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);
const queryParams = computed(() => {
	return {
		textId: params.value.textId,
	};
});
const { data, isPending, isPlaceholderData } = useTextById(queryParams);
const openNewWindowFromAnchor = useAnchorClickHandler();

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});
</script>

<template>
	<div
		class="relative isolate grid size-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<div v-if="params.showCitation">
			<Citation type="software" />
		</div>
		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div v-if="data" class="prose max-w-3xl p-8" @click="openNewWindowFromAnchor" v-html="data" />

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
</template>

<style>
/* stylelint-disable selector-class-pattern, block-no-empty */
.tbHeader {
	@apply w-full m-0;
}

.imgIllustration {
	@apply float-right h-[100px] m-[5px];
}

.aVicText {
	@apply text-primary bg-transparent no-underline cursor-pointer;
}

.aVicText:hover {
	@apply bg-primary text-on-primary cursor-pointer;
}

.info-block-wrap > .aVicText {
	@apply text-[#335175];
}

.newsHeader {
	@apply bg-primary text-on-primary pb-[5px] pl-5;
}

.newsItem {
	@apply bg-on-primary border-primary mt-0.5 pt-0.5 pl-[5px] border-dotted border;
}

.dvContributor p {
	@apply flex flex-row justify-between items-start py-2.5 px-[5px];
}

.dvContributor p span {
	@apply basis-[460px];
}

.dvContributor p img {
	@apply w-[100px] h-[100px] p-[5px] rounded-[50%];
}

.tbQueryExamples {
	@apply w-full border-collapse;
}

.tdQuery {
	@apply bg-on-primary border-primary border-solid border align-top pr-[5px] pl-[5px];
}

.tdCommentSpan {
}
</style>
