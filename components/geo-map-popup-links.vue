<script lang="ts" setup>
import type { Feature, Point } from "geojson";

import type { MarkerProperties } from "@/components/geo-map.context";

const openNewWindowFromAnchor = useAnchorClickHandler();

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
			<a
				href="/"
				:data-text-id="marker.properties.textId"
				:data-target-type="marker.properties.targetType"
				:data-data-type="marker.properties.params?.dataType"
				:data-ids="marker.properties.params?.ids"
				:data-features="marker.properties.params?.features"
				:data-word="marker.properties.params?.word"
				:data-comment="marker.properties.params?.comment"
				:data-translation="marker.properties.params?.translation"
				:data-label="marker.properties.label"
				@click.prevent.stop="openNewWindowFromAnchor"
				@keyup="openNewWindowFromAnchor"
			>
				{{ marker.properties.alt || marker.properties.label }}
			</a>
		</li>
	</ul>
</template>
