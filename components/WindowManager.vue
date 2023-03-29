<script setup lang="ts">
	/*import { VicavWinBox } from "~/components/VicavWinBox.client";
	import { LMap, LMarker, LTileLayer, LFeatureGroup } from "@vue-leaflet/vue-leaflet";
	const options = {
		x: 500,
		y: 200
	}*/

	import { useWMStore } from '~~/store/wm';
    const WMStore = useWMStore()

	console.log('This is the window manager logging')
</script>

<template>
	<div>
		This is the window manager

		<!--VicavWinBox :options="options">
            <div>this is some test content</div>
        </VicavWinBox-->
	</div>
</template>
