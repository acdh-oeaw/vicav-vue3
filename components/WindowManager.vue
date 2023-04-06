<script setup lang="ts">
	import { computed } from 'vue'
	import { useWMStore, IWindowType, INewWindow } from '~~/store/wm'
	import WMap from './WMap.vue'
	import DictQuery from "./DictQuery.vue";

	const componentNames = [ 'WMap', 'DictQuery' ] // TODO: replace it with a computed list based on an internal reference similar to this.$options.components in OptionsAPI

	const windowTypes: IWindowType[] = [
		{
			id: 'map',
			title: 'Map',
			componentName: 'WMap',
		},
		{
			id: 'dict-query',
			title: 'Dictionary query',
			componentName: 'DictQuery',
		},
	]

	/*import { VicavWinBox } from "~/components/VicavWinBox.client";
	import { LMap, LMarker, LTileLayer, LFeatureGroup } from "@vue-leaflet/vue-leaflet";
	const options = {
		x: 500,
		y: 200
	}*/

    const WMStore = useWMStore()

	const newWindow = computed(() => WMStore.newWindow)
	watch(newWindow, (window) => {
		if (window != null) {
			NewWindow(window)
		}
	})
	function NewWindow(window: INewWindow) {
		let windowType: IWindowType|undefined = windowTypes.find(t => t.id == window.windowTypeId)
		if (!IsValidWindowType(windowType)) {
			return false
		}
		// TODO: add window to store state array
		// TODO: create computed array from store state array & do v-for on winbox elements
	}
	// IsValidWindow returns false if window data don't pass validation filters, true otherwise
	function IsValidWindowType(windowType: IWindowType|undefined) {
		if (
			windowType == undefined
			|| !windowTypes.map(w => w.id).includes(windowType.id)
		) {
			ConsoleWarning("Invalid window type", windowType as any)
			return false
		}
		if (!componentNames.includes(windowType.componentName)) {
			ConsoleWarning("Window type not implemented", windowType as any);
			return false;
		}
		return true;
	}
	function ConsoleWarning(text: string, data: Object) {
		console.warn("WindowManager:", text, data);
	}
</script>

<template>
	<div>
		<WMap />

		<!--VicavWinBox :options="options">
            <div>this is some test content</div>
        </VicavWinBox-->
	</div>
</template>
