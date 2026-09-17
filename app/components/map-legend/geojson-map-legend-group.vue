<script setup lang="ts">
import { Ungroup, X } from "@lucide/vue";
import {
	type DragChangeEvent,
	type MoveEvent,
	VueDraggableNext as Draggable,
} from "vue-draggable-next";

import {
	LEGEND_SORTABLE_GROUP,
	type LegendEntry,
	type LegendGroup,
	legendMemberKey,
	toGroupMember,
} from "./geojson-map-legend.context.ts";

interface Props {
	legendGroup: LegendGroup;
	dropTargetId: string | null;
}
const props = defineProps<Props>();

const emit = defineEmits<{
	dragMove: [dropTargetId: string | null];
	dragEnd: [];
}>();

const {
	addValueToFeatureValueGroup,
	dissolveFeatureValueGroup,
	removeValueFromFeatureValueGroup,
	renameFeatureValueGroup,
	setMarker,
} = useMarkerStore();
const { markers } = storeToRefs(useMarkerStore());

function isMarkerHidden(id: string) {
	return markers.value.get(id)?.hidden ?? false;
}

function onDragMove(event: MoveEvent<LegendEntry>) {
	// hovering the list the value came from is not a drop worth announcing
	emit("dragMove", event.to === event.from ? null : (event.to.dataset["legendDropTarget"] ?? null));
	return true;
}

function onChange(event: DragChangeEvent<LegendEntry>) {
	if (event.added)
		addValueToFeatureValueGroup(props.legendGroup.group.id, toGroupMember(event.added.element));
}

function onRename(event: Event) {
	renameFeatureValueGroup(props.legendGroup.group.id, (event.target as HTMLInputElement).value);
}
</script>

<template>
	<div
		class="my-1 rounded-sm border border-dashed border-muted p-1"
		:class="{
			'opacity-45': isMarkerHidden(legendGroup.group.id),
			'border-primary bg-primary/5': dropTargetId === legendGroup.group.id,
		}"
		:data-legend-group="legendGroup.group.id"
	>
		<div class="flex items-center gap-1.5">
			<MarkerSelector
				:icon-categories="['shapes']"
				:model-value="markers.get(legendGroup.group.id)!"
				:use-popover-portal="true"
				@update:model-value="(marker) => setMarker(marker)"
			></MarkerSelector>
			<input
				aria-label="Group name"
				class="w-full min-w-0 grow border-0 bg-transparent p-0 font-medium focus:outline-hidden"
				:value="legendGroup.group.label"
				@change="onRename($event)"
				@keydown.enter.prevent="($event.target as HTMLElement).blur()"
			/>
			<span class="shrink-0 text-on-muted">({{ legendGroup.rowCount }})</span>
			<button
				class="shrink-0 text-on-muted hover:text-black"
				data-legend-controls
				title="Ungroup"
				type="button"
				@click="dissolveFeatureValueGroup(legendGroup.group.id)"
			>
				<span class="sr-only">Ungroup {{ legendGroup.group.label }}</span>
				<Ungroup class="size-3.5"></Ungroup>
			</button>
		</div>
		<Draggable
			class="min-h-3"
			:data-legend-drop-target="legendGroup.group.id"
			:group="LEGEND_SORTABLE_GROUP"
			:list="[...legendGroup.entries]"
			:move="onDragMove"
			:sort="false"
			@change="onChange"
			@end="emit('dragEnd')"
		>
			<div
				v-for="entry in legendGroup.entries"
				:key="legendMemberKey(entry.columnId, entry.key)"
				class="ml-1 flex cursor-grab items-center gap-1"
				title="Drag out of the group to ungroup this value"
			>
				<LegendEntryLabel
					class="grow"
					:count="entry.count"
					:feature-label="legendGroup.crossFeature ? entry.featureLabel : undefined"
					:parts="entry.parts"
				/>
				<button
					class="shrink-0 text-on-muted hover:text-black"
					data-legend-controls
					title="Remove from group"
					type="button"
					@click="removeValueFromFeatureValueGroup(legendGroup.group.id, toGroupMember(entry))"
				>
					<span class="sr-only">Remove {{ entry.key }} from {{ legendGroup.group.label }}</span>
					<X class="size-3"></X>
				</button>
			</div>
		</Draggable>
	</div>
</template>
