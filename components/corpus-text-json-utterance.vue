<script setup lang="ts">
import type { Gap, Pc, Phr, W } from "@/lib/api-client";

const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

const props = defineProps<{
	utterance: {
		w?: W;
		pc?: Pc;
		gap?: Gap;
		phr?: Phr;
		seg?: Phr;
	};
	inlineAnnotation: boolean;
	inlineTranslation: boolean;
}>();
</script>

<template>
	<div v-if="props.utterance.w" class="flex flex-col u">
		<TooltipProvider v-if="!inlineAnnotation" :delay-duration="0">
			<Tooltip>
				<TooltipTrigger
					@click="
						addWindow({
							targetType: 'DictQuery',
							title: props.utterance.w['@lemmaRef']?.replace('dict:', '') || 'Dictionary Entry',
							params: {
								queryString: props.utterance.w['@lemmaRef']?.replace('dict:', '') || '',
								textId: 'dc_shawi_eng',
								queryParams: {
									id: props.utterance.w['@lemmaRef']?.replace('dict:', '') || '',
								},
							},
						})
					"
				>
					<div class="flex justify-center text-lg">
						{{ props.utterance.w["$"]
						}}{{
							props.utterance.w["@join"] === "right" &&
							props.utterance.w["@rendition"] === "rend:dashAfter"
								? "-"
								: ""
						}}{{ props.utterance.w["@rendition"] === "rend:ellipsisAfter" ? "...&nbsp;" : ""
						}}{{
							props.utterance.w["@join"] === "right" &&
							props.utterance.w["@rendition"] === "rend:withBowBelow"
								? "_"
								: ""
						}}
						{{ props.utterance.w["@join"] !== "right" ? "&nbsp;" : "" }}
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
			@click="
				addWindow({
					targetType: 'DictQuery',
					title: props.utterance.w['@lemmaRef']?.replace('dict:', '') || 'Dictionary Entry',
					params: {
						queryString: props.utterance.w['@lemmaRef']?.replace('dict:', '') || '',
						textId: 'dc_shawi_eng',
						queryParams: {
							id: props.utterance.w['@lemmaRef']?.replace('dict:', '') || '',
						},
					},
				})
			"
		>
			{{ props.utterance.w["$"]
			}}{{
				props.utterance.w["@join"] === "right" &&
				props.utterance.w["@rendition"] === "rend:dashAfter"
					? "-"
					: ""
			}}{{ props.utterance.w["@rendition"] === "rend:ellipsisAfter" ? "...&nbsp;" : ""
			}}{{
				props.utterance.w["@join"] === "right" &&
				props.utterance.w["@rendition"] === "rend:withBowBelow"
					? "_"
					: ""
			}}
		</div>
		<!-- eslint-enable -->
		<div
			v-if="inlineAnnotation && props.utterance.w['@lemmaRef']"
			class="flex justify-center text-xs text-gray-500"
		></div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w.pos }}&nbsp;
		</div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w["@msd"] }}&nbsp;
		</div>
	</div>
	<div v-if="props.utterance.pc" class="flex flex-col u text-lg">
		<div>{{ props.utterance.pc["$"] }}{{ "&nbsp;" }}</div>
	</div>
	<div v-if="props.utterance.gap" class="flex flex-col u text-lg">
		<div>
			{{
				props.utterance.gap["@rendition"] === "rend:ellipsisInSquareBrackets"
					? "&nbsp;[...]"
					: "&nbsp;"
			}}
		</div>
	</div>
	<div v-if="props.utterance.phr" class="flex flex-row">
		<CorpusTextJsonUtterance
			v-for="(uContent, index) in props.utterance.phr['$$']"
			:key="index"
			:inline-annotation="props.inlineAnnotation as boolean"
			:inline-translation="props.inlineTranslation as boolean"
			:utterance="uContent"
		></CorpusTextJsonUtterance>
		{{ "&nbsp;" }}
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
