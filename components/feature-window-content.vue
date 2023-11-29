<script lang="ts" setup>
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
/* stylelint-disable selector-class-pattern, color-no-hex, color-named, color-function-notation */

.tbFeatures {
	width: 90%;
	border: 1px solid rgb(89, 83, 60);
}

.tdFeaturesCom {
	background: #e7e2ca;
}

.tdFeaturesHead {
	border: 1px solid rgb(168, 93, 143);
	background: rgb(168, 93, 143);
	color: white;
	font-size: large;
}

.tdFeaturesHeadRight {
	vertical-align: top;
	padding-right: 5px;
	border: 1px solid rgb(168, 93, 143);
	background: rgb(168, 93, 143);
	color: white;
	font-size: large;
	text-align: right;
}

.tdFeaturesLeft {
	vertical-align: top;
	width: 110px;
	padding-left: 3px;
	border: 1px solid rgb(168, 93, 143);
	background: rgb(222, 222, 222);
	color: rgb(168, 93, 143);
}

.iFeaturesTrans {
	color: blue;
	font-size: small;
}

.tdFeaturesRightSource {
	vertical-align: top;
	width: 80%;
	padding-left: 3px;
	border: 1px solid rgb(168, 93, 143);
	color: #7f960a;
}

.tdFeaturesRightTarget {
	vertical-align: top;
	width: 80%;
	padding-left: 3px;
	border: 1px solid rgb(168, 93, 143);
	background: rgb(246, 236, 225);
	color: #a58103;
	font-style: italic;
}

/* Compare samples window */

a.word-search {
	color: inherit;
}

.w {
	color: inherit;
	font-style: normal;
}

.w.highlight {
	padding: 0;
	background: 0;
	color: red;
}
</style>
