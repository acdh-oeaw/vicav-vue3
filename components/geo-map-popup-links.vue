<script lang="ts" setup>
import type { Feature, Point } from "geojson";

import type { MarkerProperties } from "@/components/geo-map.context";

const openNewWindowFromAnchor = useMarkerClickHandler();

const props = defineProps<{
	markers: Array<Feature<Point, MarkerProperties>>;
}>();
</script>

<template>
	<ul class="list-none">
		<li
			v-for="marker in props.markers"
			:key="marker.properties.targetType + '_' + marker.properties.textId"
		>
			<a href="/" @click.prevent.stop="openNewWindowFromAnchor(marker)">
				{{ marker.properties.alt || marker.properties.label }}
			</a>
		</li>
	</ul>
</template>
