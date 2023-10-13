<script setup lang="ts">
	import { computed, ConcreteComponent, ComputedOptions, MethodOptions } from 'vue'
	import { useWMStore, windowTypes } from '~~/store/wm'
	import { VicavWinBox } from "./VicavWinBox.client"

	const wmStore = useWMStore()
	const windowList = computed(() => wmStore.windowList)

	/* nuxt cannot resolve components from variables in setup, see https://github.com/nuxt/nuxt/issues/14036 */
	/* otherwise this block could be deleted and only window.type be passed on to the component in the :is */
	type ContentComponents = {[key: string]: string | ConcreteComponent<{}, any, any, ComputedOptions, MethodOptions>}
	const contentComponents: ContentComponents = {
		Text: resolveComponent('Text'),
		WMap: resolveComponent('WMap'),
		DictQuery: resolveComponent('DictQuery'),
		DictEntry: resolveComponent('DictQuery'),
	}

	function registerWindowRef(i: number, ref: any) {
		wmStore.registerWindowRef(i, ref)
	}

	function removeWindowRef(i: number, ref: any) {
		wmStore.removeWindowRef(i, ref)
	}

	function registerClientSize() {
		wmStore.registerClientSize(document.documentElement.clientWidth, document.documentElement.clientHeight)
	}

	onMounted(() =>{
		registerClientSize()
		window.addEventListener('resize', registerClientSize, true)
	})
</script>

<template>
	<div>
		<VicavWinBox
			v-for="(window, i) in windowList"
			:key="window.id?.toString()"
			:options="window.winBoxOptions"
			@open="registerWindowRef(i, $event)"
			@close="removeWindowRef(i, $event)"
		>
			<component
				:is="contentComponents[window.type]"
				:params="window.params"
			/>
		</VicavWinBox>
	</div>
</template>

<style>
	.wb-vicav {
		background-color: rgb(168, 93, 143);
		margin: 5px; /* must be in sync with windowMarginPx in WMStore */
		box-shadow: 0 0 28px rgba(0,0,0,.22),0 0 10px rgba(0,0,0,.76);
	}
	.wb-vicav .wb-header {
		height: 25px;
		line-height: 25px;
	}
	.wb-vicav .wb-min { background-size: 10px auto; }
	.wb-vicav .wb-max { background-size: 12px auto; }
	.wb-vicav .wb-full { background-size: 11px auto; }
	.wb-vicav .wb-close { background-size: 11px auto; }
	.wb-vicav .wb-control * { width: 22px; }
	.wb-vicav .wb-body {
		top: 25px;
		margin: 0;
		/* padding: */ /* each content type should set the padding itself; standard is 20px */
		background-color: #fff;
	}

	.vicav-cover-page .wb-body {
    	background-color: rgb(252, 244, 216);
	}
</style>