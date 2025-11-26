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
		class="mt-1 ml-1 flex flex-col justify-end gap-1 text-xs"
		:class="{ hidden: exportInProgress }"
	>
		<Popover>
			<PopoverTrigger as-child
				><Button class="p-2" variant="outline"
					><span class="sr-only">Settings</span><Settings class="size-4"></Settings></Button
			></PopoverTrigger>
			<PopoverContent align="start" class="flex w-auto flex-col gap-1 bg-white" side="right">
				<span class="font-medium">Marker settings</span>

				<label class="flex items-center justify-between gap-2"
					><span>Greyscale markers</span> <input v-model="markerSettings.greyscale" type="checkbox"
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
				><Button class="px-2 py-2" variant="outline"
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
					><span>Download</span></Button
				>
			</PopoverContent>
		</Popover>
	</div>
</template>
