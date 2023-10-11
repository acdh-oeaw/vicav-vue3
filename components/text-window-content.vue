<script lang="ts" setup>
interface Props {
	params: TextWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isFetching } = useTextById(params);
const onClick = useAnchorClickHandler();
</script>

<template>
	<div
		class="relative isolate grid h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isFetching }"
	>
		<!-- eslint-disable-next-line vue/no-v-html, vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div v-if="data" class="prose max-w-3xl p-8" @click="onClick" v-html="data" />

		<Centered v-if="isFetching">
			<LoadingIndicator />
		</Centered>
	</div>
</template>

<style>
/* stylelint-disable-next-line selector-class-pattern */
.tbHeader {
	margin: 0;
}
</style>
