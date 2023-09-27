<script lang="ts" setup>
interface Props {
	params: TextWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isFetching } = useTextById(params);
</script>

<template>
	<div
		class="relative isolate grid h-full w-full overflow-auto"
		:class="{ 'opacity-50 grayscale': isFetching }"
	>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div v-if="data" class="prose max-w-3xl p-8" v-html="data" />

		<Centered v-if="isFetching">
			<LoadingIndicator />
		</Centered>
	</div>
</template>
