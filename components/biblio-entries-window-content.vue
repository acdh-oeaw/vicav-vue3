<script lang="ts" setup>
interface Props {
	params: BibliographyEntriesWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isPending, isPlaceholderData } = useBiblioTeiQuery(params);

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
		<div v-if="data" class="prose max-w-3xl p-8" v-html="data" />

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
</template>

<style>
/* stylelint-disable selector-class-pattern, block-no-empty */
.dvStats {
	@apply mb-[5px] pb-[5px] pl-[5px] border border-solid border-primary bg-primary text-on-primary font-bold;
}

.spQueryText {
	@apply text-gray-200 italic;
}

.dvAuthor {
	@apply block border-t border-dotted border-primary;
}

.dvBiblBlock {
	@apply block ml-5 pb-2.5;
}

.imgBiblItem {
	@apply inline max-w-full m-0 border-none pr-1.5 align-middle box-border;
}

.dvBibBook,
.dvBibBookSection,
.dvBibArticle,
.dvThesis {
}

.dvBibArticle .fa-book,
.dvBibBook .fa-file-text,
.dvBibBookSection .fa-file-text {
	@apply block;
}
</style>
