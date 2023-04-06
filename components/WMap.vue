<template>
	<div id="vv-map">
		<div id="vv-map-controls">Here come the map controls</div>
		<vicav-map @input="MapClick" />
	</div>
</template>

<script lang="ts">
import VicavMap from "./VicavMap.vue";

export default {
	components: { "vicav-map": VicavMap },
	methods: {
		MapClick(myDocumentXml: string) {
			console.log("[not implemented] MapClick", myDocumentXml);
		},
	},
};
</script>

<style lang="scss" scoped>
#vv-map {
	height: 100%;
	width: 100%;
	display: flex;
	flex-flow: column;
	align-items: stretch;
}
#vv-map-controls {
}
</style>
