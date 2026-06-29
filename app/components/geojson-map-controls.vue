<script setup lang="ts">
import { Download, Settings } from "@lucide/vue";

interface Props {
	displayLabels?: "on" | "off" | "default";
}

const props = defineProps<Props>();

const emit = defineEmits<{
	(event: "update:displayLabels", value: "on" | "off" | "default"): void;
}>();

const { markerSettings } = storeToRefs(useMarkerStore());
const { exportNodeAsPng } = useHtmlToImageExport();
const fileFormat = ref("png");
const printLegend = ref(true);
const exportInProgress = ref(false);

const labelDisplaySelectValue = computed({
	get() {
		switch (props.displayLabels ?? "default") {
			case "on":
				return "always";
			case "off":
				return "never";
			default:
				return "on zoom";
		}
	},
	set(value: "always" | "never" | "on zoom") {
		if (value === "always") {
			emit("update:displayLabels", "on");
		} else if (value === "never") {
			emit("update:displayLabels", "off");
		} else {
			emit("update:displayLabels", "default");
		}
	},
});

function download() {
	let node = document.querySelector("[data-geo-map]");
	if (printLegend.value) {
		node = node?.parentElement ?? node;
		node?.querySelector("[data-geo-map-legend]")?.classList.remove("max-h-[50%]");
		node
			?.querySelectorAll("[data-feature-marker-selector]")
			.forEach((entry) => entry.classList.add("hidden"));
	}
	if (node != null) {
		exportInProgress.value = true;
		exportNodeAsPng(node as HTMLElement, fileFormat.value).then(() => {
			node
				.querySelectorAll("[data-feature-marker-selector]")
				.forEach((entry) => entry.classList.remove("hidden"));
			node?.querySelector("[data-geo-map-legend]")?.classList.add("max-h-[50%]");
			exportInProgress.value = false;
		});
	}
}
function downloadLegend() {
	const node = document.querySelector("[data-geo-map-legend]");
	if (node != null) {
		exportInProgress.value = true;
		node.classList.remove("bg-white/80", "absolute", "max-h-[50%]");
		node.classList.add("bg-white");
		node
			.querySelectorAll("[data-feature-marker-selector]")
			.forEach((entry) => entry.classList.add("hidden"));
		exportNodeAsPng(node as HTMLElement, fileFormat.value).then(() => {
			exportInProgress.value = false;
			node.classList.add("bg-white/80", "absolute", "max-h-[50%]");
			node.classList.remove("bg-white");
			node
				.querySelectorAll("[data-feature-marker-selector]")
				.forEach((entry) => entry.classList.remove("hidden"));
		});
	}
}
</script>

<template>
	<div class="flex flex-col justify-end gap-1 text-xs" :class="{ hidden: exportInProgress }">
		<Popover>
			<PopoverTrigger as-child
				><Button class="aspect-square border-0 p-2 shadow-lg" variant="outline"
					><span class="sr-only">Settings</span><Settings class="size-4"></Settings></Button
			></PopoverTrigger>
			<PopoverContent align="start" class="flex w-auto flex-col gap-1 bg-white" side="right">
				<span class="font-medium">Marker settings</span>

				<div class="mt-1 flex items-center gap-2">
					<span id="displayLabelsLabel" class="whitespace-nowrap">Show labels</span>
					<Select v-model="labelDisplaySelectValue" aria-labelledby="displayLabelsLabel">
						<SelectTrigger class="h-fit min-w-34 px-1 py-1 text-xs">
							<SelectValue placeholder="Select a label mode" />
						</SelectTrigger>
						<SelectContent class="bg-white">
							<SelectItem class="text-xs" value="always">always</SelectItem>
							<SelectItem class="text-xs" value="never">never</SelectItem>
							<SelectItem class="text-xs" value="on zoom">on zoom</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="my-0.5 w-full border-b-[1px]"></div>
				<label class="flex items-center justify-between gap-2"
					><span>Greyscale markers</span> <input v-model="markerSettings.greyscale" type="checkbox"
				/></label>
				<label class="flex items-center justify-between"
					><span>Marker size</span
					><input
						v-model="markerSettings.size"
						class="mr-[-1em] ml-1 w-[3em] text-right font-medium"
						min="1"
						type="number"
				/></label>
				<label class="flex items-center justify-between"
					><span>Stroke width</span
					><input
						v-model="markerSettings.strokeWidth"
						class="mr-[-1em] ml-1 w-[3em] text-right font-medium"
						min="1"
						type="number"
				/></label>
				<div class="my-0.5 w-full border-b-[1px]"></div>
				<label class="flex items-center justify-between gap-2"
					><span class="max-w-36">Show center points for single feature</span>
					<input v-model="markerSettings.showCenter" type="checkbox"
				/></label>
				<label class="flex items-center justify-between gap-2"
					><span>Show other feature values</span>
					<input v-model="markerSettings.showOtherFeatureValues" type="checkbox"
				/></label>
			</PopoverContent>
		</Popover>
		<Popover>
			<PopoverTrigger as-child
				><Button class="aspect-square border-0 p-2 shadow-lg" variant="outline"
					><span class="sr-only">Download</span><Download class="size-4"></Download></Button
			></PopoverTrigger>
			<PopoverContent align="start" class="flex w-auto flex-col gap-1 bg-white" side="right">
				<div class="mb-1 font-medium">Download settings</div>
				<div class="flex items-center gap-2">
					<span id="fileFormatLabel" class="whitespace-nowrap">Image format:</span>
					<Select v-model="fileFormat" aria-labelledby="fileFormatLabel">
						<SelectTrigger class="h-fit px-1 py-1 text-xs">
							<SelectValue placeholder="Select a file format" />
						</SelectTrigger>
						<SelectContent class="bg-white">
							<SelectItem
								v-for="entry in ['png', 'jpg', 'svg']"
								:key="entry"
								class="text-xs"
								:value="entry"
							>
								<span class="uppercase">{{ entry }}</span>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<label class="flex items-center justify-between gap-2"
					><span>Include legend</span> <input v-model="printLegend" type="checkbox"
				/></label>
				<Button class="mt-1 h-fit w-full py-1 text-xs" variant="outline" @click="download"
					><span>Download map</span></Button
				>
				<Button class="mt-1 h-fit w-full py-1 text-xs" variant="outline" @click="downloadLegend"
					><span>Download legend only</span></Button
				>
			</PopoverContent>
		</Popover>
	</div>
</template>
