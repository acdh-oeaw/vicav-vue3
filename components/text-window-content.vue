<script lang="ts" setup>
interface Props {
	params: TextWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isPending, isPlaceholderData } = useTextById(params);
const onClick = useAnchorClickHandler();

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
		<div v-if="data" class="prose max-w-3xl p-8" @click="onClick" v-html="data" />

		<Centered v-if="isLoading">
			<LoadingIndicator />
		</Centered>
	</div>
</template>

<style>
/* stylelint-disable selector-class-pattern, color-no-hex, block-no-empty */
.tbHeader {
	width: 100%;
	margin: 0;
}

.imgIllustration {
	float: right;
	height: 100px;
	margin: 5px;
}

.aVicText {
	@apply text-primary;

	background-color: transparent;
	text-decoration: none !important;
	cursor: pointer;
}

.aVicText:hover {
	@apply bg-primary text-on-primary;

	cursor: pointer;
}

.info-block-wrap > .aVicText {
	color: #335175 !important;
}

.newsHeader {
	@apply bg-primary text-on-primary;

	padding-bottom: 5px;
	padding-left: 20px;
}

.newsItem {
	@apply bg-on-primary border-primary;

	margin-top: 2px;
	padding-top: 2px;
	padding-left: 5px;
	border: 0.5px dotted;
}

.dvContributor p {
	display: flex;
	flex-flow: row;
	justify-content: space-between;
	align-items: flex-start;
	padding: 10px 5px;
}

.dvContributor p span {
	flex-basis: 460px;
}

.dvContributor p img {
	width: 100px;
	height: 100px;
	padding: 5px;
	border-radius: 50%;
}

.tbQueryExamples {
	width: 100%;
	border-collapse: collapse;
}

.tdQuery {
	@apply bg-on-primary border-primary;

	vertical-align: top;
	padding-right: 5px;
	padding-left: 5px;
	border: 1px solid;
}

.tdCommentSpan {
}
</style>
