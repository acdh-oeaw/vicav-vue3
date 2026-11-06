<script setup lang="ts">
import type { Gap, Pc, Seg, Vocal, W } from "@/lib/api-client";

const props = withDefaults(
	defineProps<{
		utterance: {
			w?: W;
			pc?: Pc;
			gap?: Gap;
			seg?: Seg;
			vocal?: Vocal;
		};
		inlineLinguisticAnnotation: boolean;
		highlight?: boolean;
		hits?: string | ReadonlyArray<string>;
		menuActions?: ReadonlyArray<"wordForm" | "dictionary" | "lemma">;
	}>(),
	{
		highlight: false,
		menuActions: () => ["wordForm", "dictionary", "lemma"],
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

const wordAnnotations = computed(() => extractCorpusAnnotations(props.utterance.w));
const segmentAnnotations = computed(() => extractCorpusAnnotations(props.utterance.seg));
const hitIds = computed(
	() => new Set(typeof props.hits === "string" ? [props.hits] : (props.hits ?? [])),
);
const wordIsHit = computed(() => {
	return (
		(props.utterance.w != null && hitIds.value.has(props.utterance.w["@id"])) ||
		(props.highlight && props.hits == null && props.utterance.w != null)
	);
});
const segmentIsHit = computed(() => {
	return (
		(props.utterance.seg != null && hitIds.value.has(props.utterance.seg["@id"])) ||
		(props.highlight && props.hits == null && props.utterance.seg != null)
	);
});
</script>

<template>
	<div
		v-if="props.utterance.w"
		:id="props.utterance.w['@id']"
		class="u flex shrink-0 flex-col items-center whitespace-nowrap"
		:class="{ 'text-primary': wordIsHit }"
		:data-highlight-scope="wordIsHit ? 'word' : undefined"
	>
		<div class="flex items-start justify-center text-lg">
			<CorpusTokenMenu :actions="props.menuActions" :token="props.utterance.w">
				{{ renderUtterance(props.utterance) }}
			</CorpusTokenMenu>
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
	<div v-if="props.utterance.pc" class="u flex shrink-0 flex-col text-lg whitespace-nowrap">
		<div>{{ props.utterance.pc["$"] }}{{ "&nbsp;" }}</div>
	</div>
	<div v-if="props.utterance.vocal?.desc.$" class="u shrink-0 text-lg italic">
		[{{ props.utterance.vocal.desc.$ }}]&nbsp;
	</div>
	<div v-if="props.utterance.gap" class="u flex shrink-0 flex-col py-3 text-lg whitespace-nowrap">
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
		class="relative flex shrink-0 flex-col items-center rounded-xs border-b-2 border-dotted border-gray-400 bg-gray-100/60 whitespace-nowrap"
		:class="{ 'border-primary bg-primary/15': segmentIsHit }"
		:data-compound-id="props.utterance.seg['@id']"
		:data-highlight-scope="segmentIsHit ? 'segment' : undefined"
	>
		<CorpusTokenMenu :actions="props.menuActions" compound :token="props.utterance.seg">
			<div class="flex flex-row">
				<CorpusTextJsonUtterance
					v-for="(uContent, index) in props.utterance.seg['$$']"
					:key="uContent.w?.['@id'] ?? uContent.seg?.['@id'] ?? index"
					:hits="props.hits"
					:inline-linguistic-annotation="props.inlineLinguisticAnnotation"
					:menu-actions="props.menuActions"
					:utterance="uContent"
				></CorpusTextJsonUtterance>
			</div>
			<div
				v-if="
					props.menuActions.length ||
					(inlineLinguisticAnnotation && segmentAnnotations.linguistic.length > 0)
				"
				class="mt-0.5 flex min-h-3 items-center justify-center gap-1 bg-gray-100/90 text-xs text-gray-500"
			>
				<span
					v-for="annotation in inlineLinguisticAnnotation ? segmentAnnotations.linguistic : []"
					:key="annotation.label"
				>
					<span class="sr-only">{{ annotation.label }}:</span>
					{{ annotation.values.join(", ") }}
				</span>
			</div>
		</CorpusTokenMenu>
	</div>
</template>

<style scoped>
@reference "@/styles/index.css";

.u {
	@apply hover:bg-primary/70 transition duration-300 ease-in-out hover:font-bold;
}
</style>
