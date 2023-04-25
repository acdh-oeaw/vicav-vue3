<script setup lang="ts">
	import { computed } from 'vue'
	import { useWMStore, INewWindow, IWindow, windowTypes } from '~~/store/wm'
	import { VicavWinBox } from "./VicavWinBox.client"

    const WMStore = useWMStore()
	const windowList = computed(() => WMStore.windowList)

	const newWindow = computed(() => WMStore.newWindow)
	watch(newWindow, (window) => {
		if (window != null) {
			NewWindow(window)
		}
	})
	function NewWindow(newWindow: INewWindow) {
		let windowType = windowTypes[newWindow.windowTypeId as keyof typeof windowTypes]
		if (windowType == undefined) {
			ConsoleWarning("Window type undefined", newWindow)
			return false
		}
		var window: IWindow = {
			id: null,
			ref: null,
			type: windowType,
			winBoxOptions: {
				title: windowType.title,
				top: 35,
				index: 10000,
			}
		}

		WMStore.AddWindowToList(window)
	}
	function ConsoleWarning(text: string, data: Object) {
		console.warn("WindowManager:", text, data);
	}
</script>

<template>
	<div>
		<VicavWinBox
			v-for="(window, i) in windowList"
			:key="i"
			:options="window.winBoxOptions"
			>
			{{ typeof window.type.component }} {{ window.type.component }}
			<component
				:is="window.type.component"
				></component>
		</VicavWinBox>

	</div>
</template>
