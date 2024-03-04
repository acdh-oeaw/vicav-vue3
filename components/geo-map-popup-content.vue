<script lang="ts" setup>
import type { Feature, Point } from "geojson";
import { ref, useAttrs } from "vue";

import type { MarkerProperties } from "@/components/geo-map.context";

const openNewWindowFromAnchor = useAnchorClickHandler();

const props = defineProps<{
	markers: Array<Feature<MarkerProperties, Point>>;
}>();
const attrs = useAttrs();

const $el = ref<HTMLElement>();

defineExpose({
	$el,
	id: attrs.id,
});
</script>

<template>
	<div ref="$el">
		<ul class="list-none">
			<li
				v-for="marker in props.markers"
				:key="marker.properties.targetType + '_' + marker.properties.textId"
			>
				<a
					href="/"
					:data-text-id="marker.properties.textId"
					:data-target-type="marker.properties.targetType"
					:data-label="marker.properties.label"
					@click="openNewWindowFromAnchor"
					@keyup="openNewWindowFromAnchor"
				>
					{{ marker.properties.label }}
				</a>
			</li>
		</ul>
	</div>
</template>

<style lang="scss" module></style>
