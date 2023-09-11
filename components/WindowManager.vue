<script setup lang="ts">
	import { computed } from 'vue'
	import { useWMStore, INewWindow, IWindow, IWindowType } from '~~/store/wm'
	import { VicavWinBox } from "./VicavWinBox.client"

	const WMStore = useWMStore()
	const windowList = computed(() => WMStore.windowList)
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
	}

	const newWindow = computed(() => WMStore.newWindow)
	watch(newWindow, (window) => {
		if (window != null) {
			NewWindow(window)
		}
	})
	function NewWindow(newWindow: INewWindow) {
		let windowType = windowTypes[newWindow.windowTypeId as keyof typeof windowTypes]
		if (windowType === undefined) {
			ConsoleWarning("Window type undefined", newWindow)
			return false
		}
		if (typeof windowType.component === "string") {
			ConsoleWarning("Window type '" + windowType + "' was not resolved", newWindow)
			return false
		}

		console.log(newWindow)

		var window: IWindow = {
			id: newWindow.id,
			ref: null,
			type: windowType as IWindowType,
			winBoxOptions: {
				class: 'wb-vicav',
				title: newWindow.title,
				top: WMStore.topMargin,
				class: [ 'no-min', 'no-max', 'no-full', 'no-resize', 'no-move'],
			},
			params: newWindow.params,
		}

		WMStore.AddWindowToList(window)
	}
	function ConsoleWarning(text: string, data: Object) {
		console.warn("WindowManager:", text, data);
	}

	function RegisterWindowRef(i: number, ref: any) {
		WMStore.RegisterWindowRef(i, ref)
	}

	function RemoveWindowRef(i: number, ref: any) {
		WMStore.RemoveWindowRef(i, ref)
	}

	function RegisterClientSize() {
		// warning: WMStore.topMargin must already be set by the MenuBar component's onmounted event handler
		WMStore.RegisterClientSize(document.documentElement.clientWidth, document.documentElement.clientHeight - WMStore.topMargin)
	}

	onMounted(() =>{
		RegisterClientSize()
		window.addEventListener('resize', RegisterClientSize, true)
	})
</script>

<template>
	<div>
		<VicavWinBox
			v-for="(window, i) in windowList"
			:key="window.id?.toString()"
			:options="window.winBoxOptions"
			@open="RegisterWindowRef(i, $event)"
			@close="RemoveWindowRef(i, $event)"
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
		padding: 20px;
		background-color: #fff;
	}
</style>