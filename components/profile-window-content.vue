<script lang="ts" setup>
import type { ProfileWindowItem } from "@/types/global.d";

interface Props {
	params: ProfileWindowItem["params"];
}
const { simpleItems } = useTEIHeaders();

const props = defineProps<Props>();
const { params } = toRefs(props);
const queryParams = computed(() => {
	return { textId: params.value.textId };
});
const content = ref(null);

const { data, isPending, isPlaceholderData } = useProfileById(queryParams);
const openNewWindowFromAnchor = useAnchorClickHandler();
const processImageGalleries = useImageGalleryProcessor(content as unknown as Ref<HTMLDivElement>);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});
watch(content, () => {
	processImageGalleries();
});
const header = simpleItems.value.find((i) => i.id === params.value.textId);
</script>

<template>
	<div
		class="relative isolate grid size-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<div v-if="params.showCitation">
			<Citation :header="header" type="entry" />
		</div>
		<!-- eslint-disable vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div
			v-if="data"
			ref="content"
			class="prose max-w-3xl px-8"
			@click="openNewWindowFromAnchor"
			v-html="data"
		/>

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
</template>

<style>
@reference "@/styles/index.css";
/* stylelint-disable selector-class-pattern */
/* stylelint-disable selector-type-no-unknown */

.profileHeader img,
.figure img {
	@apply m-0;
}

.tbProfile {
	@apply border border-solid border-[#59533c] mt-0;
}

.tdHead {
	@apply align-top !w-[150px] pr-[5px] border-dotted border-primary border-b bg-primary text-on-primary text-right break-words;
}

.tdProfileTableRight {
	@apply align-top pl-[5px] border-dotted border-primary border-b bg-[#dedede] text-primary;
}

.aExplBar {
	@apply bg-transparent text-[#252771] no-underline cursor-pointer;
}

.aExplBar:hover {
	@apply underline cursor-pointer;
}

.aVicText {
	@apply bg-transparent text-primary no-underline cursor-pointer;
}

.aVicText:hover {
	@apply bg-primary text-on-primary cursor-pointer;
}

.info-block-wrap > .aVicText {
	@apply text-[#335175];
}

a:hover {
	@apply text-[#252771] underline;
}

.spTeiLink {
	@apply py-[5px] px-2 border-solid border-primary border rounded-[5px] font-medium text-xs transition-all duration-300 ease-in-out;
}

.spTeiLink:hover {
	@apply bg-primary text-on-primary no-underline;
}

.tbHeader {
	@apply w-full m-0;
}

.profileHeader {
	@apply flex gap-[3%] items-start;
}

.pNorm {
	@apply mb-4;
}

gallery + .pNorm {
	@apply my-6;
}

.pNorm:has(+ gallery) {
	@apply mb-6;
}

.imgCaption {
	@apply p-2 italic text-[0.85rem] text-center;
}

.h3ProfileTypology {
	@apply mt-4 mb-1 border-b-0 font-medium text-[1.2rem];
}

.h3Profile {
	@apply mt-4 mb-1 border-dotted border-primary border-b font-medium text-[1.2rem];
}

.dvImgProfile {
	@apply order-1;
}

.lg-container {
	@apply text-white;

	position: relative;
	height: 450px;
}

.pFigure,
.lg-container {
	@apply my-4;
}

.pFigure.fig-col-3 {
	@apply grid grid-cols-3 gap-2;
}

.pFigure.fig-col-4 {
	@apply grid grid-cols-4 gap-2;
}

.pFigure.fig-col-1 {
	@apply flex justify-center;
}

.pFigure .figure {
	@apply content-end flex flex-col flex-wrap gap-3 justify-start;
}

.grid .figure img {
	@apply aspect-square object-cover;
}

.lg-item .lg-sub-html {
	@apply bg-black/40;
}
</style>
