<script lang="ts" setup>
import type { ProfileWindowItem } from "@/types/global.d";

interface Props {
	params: ProfileWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);
const content = ref(null);

const { data, isPending, isPlaceholderData } = useProfileById(params);
const openNewWindowFromAnchor = useAnchorClickHandler();
const processImageGalleries = useImageGalleryProcessor(content);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});
watch(content, () => {
	processImageGalleries();
});
</script>

<template>
	<div
		class="relative isolate grid h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div
			v-if="data"
			ref="content"
			class="prose max-w-3xl p-8"
			@click="openNewWindowFromAnchor"
			v-html="data"
		/>

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
</template>

<style>
/* stylelint-disable selector-class-pattern */

.tbProfile {
	@apply border border-solid border-[#59533c];
}

.tdHead {
	@apply align-top w-[150px] pr-[5px] border-dotted border-primary border-b bg-primary text-on-primary text-right break-words;
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
	@apply mb-[10px];
}

.imgCaption {
	@apply pb-2 italic text-xs text-center;
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

	height: 450px;
}
</style>
