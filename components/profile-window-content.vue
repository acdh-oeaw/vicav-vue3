<script lang="ts" setup>
interface Props {
	params: ProfileWindowItem["params"];
}

const props = defineProps<Props>();
const { params } = toRefs(props);

const { data, isPending, isPlaceholderData } = useProfileById(params);
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
/* stylelint-disable selector-class-pattern, color-no-hex, color-named */

.tbProfile {
	border: 1px solid rgb(89 83 60);
}

.tdHead {
	vertical-align: top;
	width: 150px;
	padding-right: 5px;
	border-bottom: 0.5px dotted rgb(221 157 199);
	background: rgb(168 93 143);
	color: #fff;
	text-align: right;
	word-wrap: break-word;
}

.tdProfileTableRight {
	vertical-align: top;
	padding-left: 5px;
	border-bottom: 0.5px dotted rgb(168 93 143);
	background: rgb(222 222 222);
	color: rgb(168 93 143);
}

.aExplBar {
	background-color: transparent;
	color: #252771 !important;
	text-decoration: none;
	cursor: pointer;
}

.aExplBar:hover {
	text-decoration: underline;
	cursor: pointer;
}

.aVicText {
	background-color: transparent;
	color: rgb(168 93 143) !important;
	text-decoration: none !important;
	cursor: pointer;
}

.aVicText:hover {
	/* color: white !important; */
	background-color: rgb(168 93 143);
	color: white !important;
	cursor: pointer;
}

.info-block-wrap > .aVicText {
	color: #335175 !important;
}

a:hover {
	color: #252771;
	text-decoration: underline;
}

.spTeiLink {
	padding: 5px 8px;
	border: 1px solid rgb(168 93 143);
	border-radius: 5px;
	font-weight: 500;
	font-size: 12px;
	transition: all 0.3s ease;
}

.spTeiLink:hover {
	background-color: #a85c8e;
	color: white;
	text-decoration: none;
}

.tbHeader {
	width: 100%;
	margin: 0;
}

.profileHeader {
	display: flex;
	gap: 3%;
	align-items: flex-start;
}

.pNorm {
	margin-bottom: 10px;
}

.imgCaption {
	padding-bottom: 8px;
	font-style: italic;
	font-size: 12px;
	text-align: center;
}

.h3ProfileTypology {
	margin-top: 1rem;
	margin-bottom: 0.2rem;
	border-bottom: none;
	font-weight: 500;
	font-size: 1.2rem;
}

.h3Profile {
	margin-top: 1rem;
	margin-bottom: 0.2rem;
	border-bottom: 1px dotted rgb(168 93 143);
	font-weight: 500;
	font-size: 1.2rem;
}

.dvImgProfile {
	order: 1;
}
</style>
