<script setup lang="ts">
	import { computed } from 'vue'
	import { useAppDataStore } from '~~/store/appData'
	import { useWMStore, INewWindow, IWindow, IWindowType } from '~~/store/wm'
	import { VicavWinBox } from "./VicavWinBox.client"

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
		if (windowType === undefined) {
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
				top: WMStore.topMargin,
				index: 1000,
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

	const AppDataStore = useAppDataStore()

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
