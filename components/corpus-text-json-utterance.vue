<script setup lang="ts">
import { BookA } from "lucide-vue-next";

import type { Gap, Pc, Phr, W } from "@/lib/api-client";
import { Button } from "#components";

const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

const props = defineProps<{
	utterance: {
		w?: W;
		pc?: Pc;
		gap?: Gap;
		phr?: Phr;
	};
	inlineAnnotation: boolean;
	inlineTranslation: boolean;
}>();
</script>

<template>
	<div v-if="props.utterance.w" class="flex flex-col u">
		<TooltipProvider v-if="!inlineAnnotation" :delay-duration="0">
			<Tooltip>
				<TooltipTrigger>
					<div class="flex justify-center text-lg">
						{{ props.utterance.w["$"]
						}}{{
							props.utterance.w["@join"] === "right" &&
							props.utterance.w["@rendition"] === "rend:dashAfter"
								? "-"
								: "&nbsp;"
						}}
					</div>
				</TooltipTrigger>
				<TooltipContent class="bg-primary" side="bottom">
					<p>{{ props.utterance.w.pos }}&nbsp;</p>
					<p>{{ props.utterance.w["@msd"] }}&nbsp;</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
		<div v-if="inlineAnnotation" class="flex justify-center text-lg">
			{{ props.utterance.w["$"]
			}}{{
				props.utterance.w["@join"] === "right" &&
				props.utterance.w["@rendition"] === "rend:dashAfter"
					? "-"
					: "&nbsp;"
			}}
		</div>
		<div
			v-if="inlineAnnotation && props.utterance.w['@lemmaRef']"
			class="flex justify-center text-xs text-gray-500"
		>
			<Button
				size="icon"
				variant="secondary"
				@click="
					addWindow({
						targetType: 'DictQuery',
						title: props.utterance.w['@lemmaRef'].replace('dict:', ''),
						params: {
							queryString: props.utterance.w['@lemmaRef'].replace('dict:', ''),
							textId: 'dc_shawi_eng',
							queryParams: {
								id: props.utterance.w['@lemmaRef'].replace('dict:', ''),
							},
						},
					})
				"
			>
				<BookA />
			</Button>
		</div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w.pos }}&nbsp;
		</div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w["@msd"] }}&nbsp;
		</div>
	</div>
	<div v-if="props.utterance.pc" class="flex flex-col u text-lg">
		<div>{{ props.utterance.pc["$"] }}</div>
	</div>
	<div v-if="props.utterance.phr" class="flex flex-row">
		<CorpusTextJsonUtterance
			v-for="(uContent, index) in props.utterance.phr['$$']"
			:key="index"
			:inline-annotation="props.inlineAnnotation as boolean"
			:inline-translation="props.inlineTranslation as boolean"
			:utterance="uContent"
		></CorpusTextJsonUtterance>
	</div>
</template>

<style scoped>
@reference "@/styles/index.css";

.u {
	@apply hover:bg-primary/70 transition duration-300 ease-in-out hover:font-bold;
}
</style>
