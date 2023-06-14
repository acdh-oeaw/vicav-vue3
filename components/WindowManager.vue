<script setup lang="ts">
	import { computed } from 'vue'
	import { useWMStore, INewWindow, IWindow, IWindowType } from '~~/store/wm'
	import { VicavWinBox } from "./VicavWinBox.client"

	const windowRefList = ref([])
  	const WMStore = useWMStore()
	const windowList = computed(() => WMStore.windowList)
	const windowTypes = {
		DisplayHtml: {
			title: 'Display HTML Content',
			component: resolveComponent('DisplayHtml'),
		},
		WMap: {
			title: 'Map',
			component: resolveComponent('WMap'),
		} as IWindowType,
		DictQuery: {
			title: 'Dictionary query',
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
		if (windowType == undefined) {
			ConsoleWarning("Window type undefined", newWindow)
			return false
		}
		if (typeof windowType.component === "string") {
			ConsoleWarning("Window type '" + windowType + "' was not resolved", newWindow)
			return false
		}

		var window: IWindow = {
			id: newWindow.id,
			ref: null,
			type: windowType as IWindowType,
			winBoxOptions: {
				title: windowType.title,
				top: 35,
				index: 10000,
			},
			params: newWindow.params,
		}

		WMStore.AddWindowToList(window)
	}
	function ConsoleWarning(text: string, data: Object) {
		console.warn("WindowManager:", text, data);
	}

	function RegisterWindowRef(i: number, ref: HTMLElement) {
		WMStore.RegisterWindowRef(i, ref)
	}

	function CloseWindow(windowIndex: number) {
		WMStore.Close(windowIndex)
	}
</script>

<template>
	<div>
		<VicavWinBox
			v-for="(window, i) in windowList"
			ref="windowRefList"
			:key="i"
			:options="window.winBoxOptions"
			@open="RegisterWindowRef(i, $event)"
			@close="CloseWindow(i)"
		>
			<component
				:is="{...window.type.component}"
				:params="window.params"
			/>
		</VicavWinBox>

	</div>
</template>
