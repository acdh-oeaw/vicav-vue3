<script setup lang="ts">
import { MapPin } from "@lucide/vue";

import {
	formatLocation,
	type RenderedBibliographyReference,
	type RenderedForm,
} from "@/utils/dict-entry-rendering";

const props = defineProps<{
	form: RenderedForm;
	references: Array<RenderedBibliographyReference>;
	badgeClass: string;
	entryPartOfSpeech?: string;
}>();
const orthography = computed(() => props.form.orthographies.find((item) => !item.isMissing));
</script>

<template>
	<span
		v-if="orthography?.text"
		class="font-bold italic"
		:title="orthography.lang ? `Language: ${orthography.lang}` : undefined"
		>{{ orthography.text }}</span
	>
	<span v-if="form.grammar.length"
		><DictGrammar :fallback-part-of-speech="entryPartOfSpeech" :items="form.grammar"
	/></span>
	<span v-for="(location, index) in form.locations" :key="index" :class="badgeClass"
		><MapPin class="size-4 text-gray-400" />{{ formatLocation(location) }}</span
	>
	<DictSourceAction v-for="(reference, index) in references" :key="index" :reference="reference" />
</template>
