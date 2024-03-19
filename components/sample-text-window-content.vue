<script lang="ts" setup>
import type { SampleTextWindowItem } from "@/types/global.d";

interface Props {
	params: SampleTextWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isPending, isPlaceholderData } = useSampleTextById(params);
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

<style scoped>
.w,
.pc {
	@apply text-inherit not-italic no-underline;
}

.w.sample-text-tooltip {
	@apply bg-yellow-200;
}
</style>
