<script setup lang="ts">
import { Download, Settings } from "lucide-vue-next";

const { markerSettings } = storeToRefs(useMarkerStore());
const { exportNodeAsPng } = useHtmlToImageExport();
const fileFormat = ref("png");
const printLegend = ref(true);
const exportInProgress = ref(false);
function download() {
	let node = document.querySelector("[data-geo-map]");
	if (printLegend.value) node = node?.parentElement ?? node;
	if (node != null) {
		exportInProgress.value = true;
		exportNodeAsPng(node as HTMLElement, fileFormat.value).then(
			() => (exportInProgress.value = false),
		);
	}
}
</script>

<template>
	<div
		class="ml-1 mt-1 flex flex-col gap-1 justify-end text-xs"
		:class="{ hidden: exportInProgress }"
	>
		<Popover>
			<PopoverTrigger as-child
				><Button class="p-2" variant="outline"
					><span class="sr-only">Settings</span><Settings class="size-4"></Settings></Button
			></PopoverTrigger>
			<PopoverContent align="start" class="bg-white w-auto flex flex-col gap-1" side="right">
				<span class="font-medium">Marker settings</span>

				<label class="flex justify-between items-center gap-2"
					><span>Greyscale markers</span> <input v-model="markerSettings.greyscale" type="checkbox"
				/></label>
				<label class="flex justify-between items-center"
					><span>Stroke width</span
					><input
						v-model="markerSettings.strokeWidth"
						class="w-[3em] ml-1 font-medium text-right mr-[-1em]"
						min="1"
						type="number"
				/></label>
				<div class="w-full my-0.5 border-b-[1px]"></div>
				<label class="flex justify-between items-center gap-2"
					><span class="max-w-36">Show center points for single feature</span>
					<input v-model="markerSettings.showCenter" type="checkbox"
				/></label>
				<label class="flex justify-between items-center gap-2"
					><span>Show other feature values</span>
					<input v-model="markerSettings.showOtherFeatureValues" type="checkbox"
				/></label>
			</PopoverContent>
		</Popover>
		<Popover>
			<PopoverTrigger as-child
				><Button class="px-2 py-2" variant="outline"
					><span class="sr-only">Download</span><Download class="size-4"></Download></Button
			></PopoverTrigger>
			<PopoverContent align="start" class="bg-white w-auto flex flex-col gap-1" side="right">
				<div class="font-medium mb-1">Download settings</div>
				<div class="flex gap-2 items-center">
					<span id="fileFormatLabel" class="whitespace-nowrap">Image format:</span>
					<Select v-model="fileFormat" aria-labelledby="fileFormatLabel">
						<SelectTrigger class="px-1 py-1 h-fit text-xs">
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
				<label class="flex justify-between items-center gap-2"
					><span>Include legend</span> <input v-model="printLegend" type="checkbox"
				/></label>
				<Button class="text-xs w-full h-fit mt-1 py-1" variant="outline" @click="download"
					><span>Download</span></Button
				>
			</PopoverContent>
		</Popover>
	</div>
</template>
