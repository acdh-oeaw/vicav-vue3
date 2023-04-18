<script setup lang="ts">
	import { computed } from 'vue'
	import { useWMStore, INewWindow, IWindowType, IWindow, EComponentName } from '~~/store/wm'
	import { VicavWinBox } from "./VicavWinBox.client";
	import WMap from './WMap.vue'
	import DictQuery from "./DictQuery.vue";

	const windowTypes: IWindowType[] = [
		{
			id: 'map',
			title: 'Map',
			componentName: EComponentName.WMap,
		},
		{
			id: 'dict-query',
			title: 'Dictionary query',
			componentName: EComponentName.DictQuery,
		},
	]

	/*import { VicavWinBox } from "~/components/VicavWinBox.client";
	import { LMap, LMarker, LTileLayer, LFeatureGroup } from "@vue-leaflet/vue-leaflet";
	const options = {
		x: 500,
		y: 200
	}*/

    const WMStore = useWMStore()
	const windowList = computed(() => WMStore.windowList)

	const newWindow = computed(() => WMStore.newWindow)
	watch(newWindow, (window) => {
		if (window != null) {
			NewWindow(window)
		}
	})
	function NewWindow(newWindow: INewWindow) {
		let windowType: IWindowType|undefined = windowTypes.find(t => t.id == newWindow.windowTypeId)
		if (windowType == undefined) {
			ConsoleWarning("Window type undefined", newWindow)
			return false
		}
		if (!IsValidWindowType(windowType)) {
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
	// IsValidWindow returns false if window data don't pass validation filters, true otherwise
	function IsValidWindowType(windowType: IWindowType) {
		if (!windowTypes.map(w => w.id).includes(windowType.id)) {
			ConsoleWarning("Invalid window type", windowType as any)
			return false
		}
		return true;
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
			<component
				:is="window.type.componentName"
				></component>
		</VicavWinBox>

		<!--VicavWinBox :options="options">
            <div>this is some test content</div>
        </VicavWinBox-->
	</div>
</template>
