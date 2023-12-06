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
