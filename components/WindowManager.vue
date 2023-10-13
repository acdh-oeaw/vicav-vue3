<script setup lang="ts">
	import { computed } from 'vue'
	import { useWMStore, INewWindow, IWindow, IWindowType } from '~~/store/wm'
	import { VicavWinBox } from "./VicavWinBox.client"

	const wmStore = useWMStore()
	const windowList = computed(() => wmStore.windowList)
	const windowTypes = {
		Text: {
			component: resolveComponent('Text'),
		} as IWindowType,
		WMap: {
			component: resolveComponent('WMap'),
		} as IWindowType,
		DictQuery: {
			component: resolveComponent('DictQuery'),
		} as IWindowType,
		DictEntry: {
			component: resolveComponent('DictEntry'),
		} as IWindowType,
	}

	const newWindow = computed(() => wmStore.newWindow)
	watch(newWindow, (window) => {
		if (window != null) {
			createNewWindow(window)
		}
	})
	function createNewWindow(newWindow: INewWindow) {
		let windowType = windowTypes[newWindow.windowTypeId as keyof typeof windowTypes]
		if (windowType === undefined) {
			consoleWarning("Window type undefined", newWindow)
			return false
		}
		if (typeof windowType.component === "string") {
			consoleWarning("Window type '" + windowType + "' was not resolved", newWindow)
			return false
		}

		let windowClasses = [ 'wb-vicav', 'no-min', 'no-max', 'no-full', 'no-resize', 'no-move']
		if (!!newWindow.params?.customClass) {
			windowClasses.push(newWindow.params.customClass)
		}
		let window: IWindow = {
			id: newWindow.id,
			ref: null,
			type: windowType as IWindowType,
			winBoxOptions: {
				title: '[' + newWindow.windowTypeId + '] ' + newWindow.title,
				top: wmStore.topMargin,
				class: windowClasses,
			},
			params: newWindow.params,
		}

		wmStore.addWindowToList(window)
	}
	function consoleWarning(text: string, data: Object) {
		console.warn("WindowManager:", text, data);
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
				:is="{...window.type.component}"
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