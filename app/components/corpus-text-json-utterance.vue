<script setup lang="ts">
import { BookA } from "lucide-vue-next";

import type { Gap, Pc, Seg, W } from "@/lib/api-client";

const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

const props = defineProps<{
	utterance: {
		w?: W;
		pc?: Pc;
		gap?: Gap;
		seg?: Seg;
	};
	inlineAnnotation: boolean;
	inlineTranslation: boolean;
}>();

function renderUtterance(u: typeof props.utterance) {
	if (!u.w) return "";
	let renderedUtterance = u.w ? u.w["$"] : "";
	renderedUtterance +=
		u.w["@join"] === "right" && u.w["@rendition"] === "rend:dashAfter" ? "-" : "";
	renderedUtterance += u.w["@rendition"] === "rend:ellipsisAfter" ? "..." : "";
	renderedUtterance +=
		u.w["@join"] === "right" && u.w["@rendition"] === "rend:withBowBelow" ? "_" : "";
	renderedUtterance += u.w["@join"] === "right" ? "" : "\u00A0 ";
	return renderedUtterance;
}

function openDictWindow(u: typeof props.utterance) {
	if (!u.w) return;
	addWindow({
		targetType: "DictQuery",
		title: u.w["@lemmaRef"]?.replace("dict:", "") || "Dictionary Entry",
		params: {
			queryString: u.w["@lemmaRef"]?.replace("dict:", "") || "",
			textId: "dc_shawi_eng",
			queryParams: {
				id: u.w["@lemmaRef"]?.replace("dict:", "") || "",
			},
			isTextInputManual: false,
			isQueryVisible: false,
		},
	});
	return;
}
</script>

<template>
	<div v-if="props.utterance.w" class="u flex flex-col py-3">
		<TooltipProvider v-if="!inlineAnnotation" :delay-duration="0">
			<Tooltip>
				<TooltipTrigger @click="openDictWindow(props.utterance)">
					<div class="flex justify-center text-lg">
						{{ renderUtterance(props.utterance) }}
					</div>
				</TooltipTrigger>
				<TooltipContent class="bg-primary" side="bottom">
					<p>{{ props.utterance.w.pos }}&nbsp;</p>
					<p>{{ props.utterance.w["@msd"] }}&nbsp;</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
		<!-- eslint-disable vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/no-static-element-interactions -->
		<div
			v-if="inlineAnnotation"
			class="flex justify-center text-lg"
			@click="openDictWindow(props.utterance)"
		>
			{{ renderUtterance(props.utterance) }}
			<BookA
				v-if="inlineAnnotation && props.utterance.w['@lemmaRef']"
				class="size-3 text-gray-500"
			/>
		</div>
		<!-- eslint-enable -->
		<div class="flex justify-center text-xs text-gray-500"></div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w.pos }}&nbsp;
		</div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w["@msd"] }}&nbsp;
		</div>
	</div>
	<div v-if="props.utterance.pc" class="u flex flex-col text-lg">
		<div>{{ props.utterance.pc["$"] }}{{ "&nbsp;" }}</div>
	</div>
	<div v-if="props.utterance.gap" class="u flex flex-col text-lg">
		<div>
			{{
				props.utterance.gap["@rendition"] === "rend:ellipsisInSquareBrackets"
					? "&nbsp;[...]"
					: "&nbsp;"
			}}
		</div>
	</div>
	<div v-if="props.utterance.seg" class="flex flex-row">
		<CorpusTextJsonUtterance
			v-for="(uContent, index) in props.utterance.seg['$$']"
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
