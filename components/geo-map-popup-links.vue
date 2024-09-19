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
				:data-comment="marker.properties.params?.comment"
				:data-data-type="marker.properties.params?.dataType"
				:data-features="marker.properties.params?.features"
				:data-ids="marker.properties.params?.ids"
				:data-label="marker.properties.label"
				:data-target-type="marker.properties.targetType"
				:data-text-id="marker.properties.textId"
				:data-translation="marker.properties.params?.translation"
				:data-word="marker.properties.params?.word"
				href="/"
				@click.prevent.stop="openNewWindowFromAnchor"
				@keyup="openNewWindowFromAnchor"
			>
				{{ marker.properties.alt || marker.properties.label }}
			</a>
		</li>
	</ul>
</template>
