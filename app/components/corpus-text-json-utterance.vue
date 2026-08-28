<script setup lang="ts">
import { BookA } from "@lucide/vue";

import type { Gap, Pc, Seg, W } from "@/lib/api-client";

const windowsStore = useWindowsStore();
const { addWindow } = windowsStore;

const props = withDefaults(
	defineProps<{
		utterance: {
			w?: W;
			pc?: Pc;
			gap?: Gap;
			seg?: Seg;
		};
		inlineLemmaAnnotation: boolean;
		inlineLinguisticAnnotation: boolean;
		highlight?: boolean;
		hits?: string;
	}>(),
	{
		highlight: false,
	},
);

function renderUtterance(u: typeof props.utterance) {
	if (!u.w) return "";
	let renderedUtterance = u.w["$"];
	renderedUtterance +=
		u.w["@join"] === "right" && u.w["@rendition"] === "rend:dashAfter" ? "-" : "";
	renderedUtterance += u.w["@rendition"] === "rend:ellipsisAfter" ? "..." : "";
	renderedUtterance +=
		u.w["@join"] === "right" && u.w["@rendition"] === "rend:withBowBelow" ? "_" : "";
	renderedUtterance += u.w["@join"] === "right" ? "" : "\u00A0 ";
	return renderedUtterance;
}

function openDictWindow(lemmaRef: string) {
	const dictionaryEntryId = getDictionaryEntryId(lemmaRef);
	addWindow({
		targetType: "DictQuery",
		title: dictionaryEntryId || "Dictionary Entry",
		params: {
			queryString: dictionaryEntryId,
			textId: "dc_shawi_eng",
			queryParams: {
				id: dictionaryEntryId,
			},
			isTextInputManual: false,
			isQueryVisible: false,
		},
	});
}

const wordAnnotations = computed(() => extractCorpusAnnotations(props.utterance.w));
const segmentAnnotations = computed(() => extractCorpusAnnotations(props.utterance.seg));
const wordIsHit = computed(() => {
	return (
		props.utterance.w?.["@id"] === props.hits ||
		(props.highlight && props.hits == null && props.utterance.w != null)
	);
});
const segmentIsHit = computed(() => {
	return (
		props.utterance.seg?.["@id"] === props.hits ||
		(props.highlight && props.hits == null && props.utterance.seg != null)
	);
});
</script>

<template>
	<div
		v-if="props.utterance.w"
		:id="props.utterance.w['@id']"
		class="u flex flex-col items-center"
		:class="{ 'text-primary': wordIsHit }"
		:data-highlight-scope="wordIsHit ? 'word' : undefined"
	>
		<div class="flex items-start justify-center text-lg">
			<span>{{ renderUtterance(props.utterance) }}</span>
			<button
				v-if="inlineLemmaAnnotation && wordAnnotations.lemmaRef"
				:aria-label="`Open dictionary entry ${getDictionaryEntryId(wordAnnotations.lemmaRef)}`"
				class="rounded-sm text-gray-500 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
				type="button"
				@click.stop="openDictWindow(wordAnnotations.lemmaRef)"
			>
				<BookA aria-hidden="true" class="size-3" />
			</button>
		</div>
		<div
			v-for="annotation in inlineLinguisticAnnotation ? wordAnnotations.linguistic : []"
			:key="annotation.label"
			class="flex justify-center text-xs text-gray-500"
		>
			<span class="sr-only">{{ annotation.label }}:</span>
			{{ annotation.values.join(", ") }}&nbsp;
		</div>
	</div>
	<div v-if="props.utterance.pc" class="u flex flex-col text-lg">
		<div>{{ props.utterance.pc["$"] }}{{ "&nbsp;" }}</div>
	</div>
	<div v-if="props.utterance.gap" class="u flex flex-col py-3 text-lg">
		<div>
			{{
				props.utterance.gap["@rendition"] === "rend:ellipsisInSquareBrackets"
					? "&nbsp;[...]"
					: "&nbsp;"
			}}
		</div>
	</div>
	<div
		v-if="props.utterance.seg"
		:id="props.utterance.seg['@id']"
		class="flex flex-col items-center rounded-xs border-b-2 border-dotted border-gray-400 bg-gray-100/60"
		:class="{ 'border-primary bg-primary/15': segmentIsHit }"
		:data-compound-id="props.utterance.seg['@id']"
		:data-highlight-scope="segmentIsHit ? 'segment' : undefined"
	>
		<div
			v-if="
				(inlineLemmaAnnotation && segmentAnnotations.lemmaRef) ||
				(inlineLinguisticAnnotation && segmentAnnotations.linguistic.length > 0)
			"
			class="flex min-h-3 items-center justify-center gap-1 text-xs text-gray-500"
		>
			<button
				v-if="inlineLemmaAnnotation && segmentAnnotations.lemmaRef"
				:aria-label="`Open compound dictionary entry ${getDictionaryEntryId(segmentAnnotations.lemmaRef)}`"
				class="rounded-sm hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
				type="button"
				@click.stop="openDictWindow(segmentAnnotations.lemmaRef)"
			>
				<BookA aria-hidden="true" class="size-3" />
			</button>
			<span
				v-for="annotation in inlineLinguisticAnnotation ? segmentAnnotations.linguistic : []"
				:key="annotation.label"
			>
				<span class="sr-only">{{ annotation.label }}:</span>
				{{ annotation.values.join(", ") }}
			</span>
		</div>
		<div class="flex flex-row">
			<CorpusTextJsonUtterance
				v-for="(uContent, index) in props.utterance.seg['$$']"
				:key="uContent.w?.['@id'] ?? uContent.seg?.['@id'] ?? index"
				:hits="props.hits"
				:inline-lemma-annotation="props.inlineLemmaAnnotation"
				:inline-linguistic-annotation="props.inlineLinguisticAnnotation"
				:utterance="uContent"
			></CorpusTextJsonUtterance>
		</div>
	</div>
</template>

<style scoped>
@reference "@/styles/index.css";

.u {
	@apply hover:bg-primary/70 transition duration-300 ease-in-out hover:font-bold;
}
</style>
