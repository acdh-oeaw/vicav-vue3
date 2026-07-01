<script setup lang="ts">
import {
	BookA,
	BookOpen,
	Braces,
	CircleAlert,
	Code,
	MapPin,
	MessageSquareQuote,
	Search,
} from "@lucide/vue";

import type { RestVLEEntry } from "@/lib/api-client";
import { QueryString, type WindowItem } from "@/types/global.ts";
import {
	formatLocation,
	normalizeEntry,
	type RenderedDictEntry,
	type RenderedForm,
	type RenderedGrammarItem,
	type RenderedLocation,
	type RenderedText,
} from "@/utils/dict-entry-rendering";

const props = withDefaults(
	defineProps<{
		entry: RestVLEEntry;
		dictId?: string | number;
		debug?: boolean;
		expanded?: boolean;
	}>(),
	{
		debug: false,
		expanded: false,
	},
);

const e = computed(() => normalizeEntry(props.entry));
const env = useRuntimeConfig();
const openOrUpdateWindow = useOpenOrUpdateWindow();

const compactBadgeClass =
	"inline-flex min-h-6 items-center gap-1 rounded-full border border-gray-300 bg-white/90 px-1.5 text-sm leading-none text-gray-900 shadow-xs";

const bibliographyById = computed(() => {
	return new Map(e.value.bibliography.map((item) => [item.id, item.label]));
});

const headerForms = computed(() => {
	return e.value.lemmaForms.concat(e.value.variantForms);
});

const compactGrammar = computed(() => {
	const values = {
		partOfSpeech: findGrammarValue(e.value.grammar, "Part of speech"),
		class: findGrammarValue(e.value.grammar, "Class"),
		synRoot: findGrammarValue(e.value.grammar, "Syn root"),
		diaRoot: findGrammarValue(e.value.grammar, "Dia root"),
	};
	const roots = [
		formatRootGrammar(values.synRoot, "synRoot"),
		formatRootGrammar(values.diaRoot, "diaRoot"),
	].filter(Boolean);

	return [values.partOfSpeech, values.class, roots.join(", ")].filter(Boolean).join(", ");
});

const uniqueEditors = computed(() => {
	const names = new Set<string>();

	for (const editor of e.value.editors) {
		if (editor.who != null && editor.who !== "") {
			names.add(editor.who);
		}
	}

	return Array.from(names);
});

const hasInflectedForms = computed(() => e.value.inflectedForms.length > 0);
const hasEtymology = computed(() => e.value.etymologies.length > 0);
const hasEditors = computed(() => uniqueEditors.value.length > 0);
const entryStatus = computed(() => {
	const status = e.value.status?.trim();
	if (status == null || status.toLocaleLowerCase() === "released") return undefined;
	return status;
});
const entryStatusLabel = computed(() => {
	return entryStatus.value?.replaceAll("-", " ");
});

const getEntryLink = (entry: RenderedDictEntry, responseFormat?: "json") => {
	const url = new URL(entry.selfHref, env.public.apiBaseUrl);

	if (responseFormat != null) {
		url.searchParams.set("format", responseFormat);
	}

	return url.toString();
};

const entryXmlLink = computed(() => getEntryLink(e.value));
const entryJsonLink = computed(() => getEntryLink(e.value, "json"));
const corpusDictIDQuery = computed(() => {
	return `[dict=="dict:${escapeCorpusQueryValue(e.value.id)}"]`;
});

const findGrammarValue = (items: Array<RenderedGrammarItem>, label: string) => {
	const value = items.find((item) => item.label === label)?.value;
	return value == null || value === "-" ? undefined : value;
};

const formatRootGrammar = (value: string | undefined, label: string) => {
	if (value == null) return undefined;
	return `${value} (${label})`;
};

const escapeCorpusQueryValue = (value: string) => {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
};

const openCorpusSearchWindow = () => {
	const queryString = corpusDictIDQuery.value;
	openOrUpdateWindow(
		{
			targetType: "CorpusQuery",
			params: {
				queryString,
			},
		} as unknown as WindowItem,
		`Corpus search: ${e.value.title ?? e.value.lemma}`,
		QueryString,
		"queryString",
		true,
	);
};

const formText = (form: RenderedForm) => {
	return form.orthographies.find((orthography) => !orthography.isMissing)?.text;
};

const formLanguage = (form: RenderedForm) => {
	return form.orthographies.find((orthography) => !orthography.isMissing)?.lang;
};

const languageTooltip = (language: string | undefined) => {
	if (language == null || language === "") return undefined;
	return `Language: ${language}`;
};

const sourceLabel = (source: string | undefined) => {
	if (source == null) return undefined;
	return bibliographyById.value.get(source);
};

const grammarValues = (items: Array<RenderedGrammarItem>) => {
	return items.map((item) => item.value).filter((value) => value !== "-");
};

const formGrammarText = (form: RenderedForm) => {
	const values = grammarValues(form.grammar);
	return values.length === 0 ? undefined : values.join(", ");
};

const senseGrammarText = (items: Array<RenderedGrammarItem>) => {
	const values = grammarValues(items);
	return values.length === 0 ? undefined : values.join(", ");
};

const locationKey = (location: RenderedLocation) => {
	return formatLocation(location);
};

const textKey = (text: RenderedText, index: number) => {
	return `${text.lang ?? "unknown"}-${text.source ?? "none"}-${text.text}-${String(index)}`;
};

const languageClass = (language: string | undefined) => {
	switch (language?.toLocaleLowerCase()) {
		case "en":
			return "text-sky-500";
		case "de":
			return "text-emerald-600";
		case "tr":
			return "text-red-600";
		case "fr":
			return "text-purple-700";
		default:
			return "text-gray-900";
	}
};
</script>

<template>
	<!-- eslint-disable tailwindcss/classnames-order -->
	<div>
		<div v-if="props.debug" class="text-sm">
			<pre>{{ JSON.stringify(e.raw, null, "  ") }}</pre>
		</div>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div v-if="e.html" v-html="e.html" />
		<article
			v-else
			class="not-prose overflow-hidden border-2 border-primary bg-white text-gray-950"
		>
			<header class="bg-primary px-3 py-2 text-white">
				<div class="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
					<span
						class="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-white/70 bg-white text-primary"
					>
						<BookA v-if="e.type === 'entry'" class="size-4" />
						<MessageSquareQuote v-else class="size-4" />
					</span>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg/tight">
							<template v-for="(form, formIndex) in headerForms" :key="`header-${formIndex}`">
								<span
									v-if="formIndex > 0"
									aria-hidden="true"
									class="hidden text-white/80 sm:inline"
								>
									;
								</span>
								<span
									v-if="formText(form)"
									class="text-2xl leading-none font-medium wrap-break-word italic underline decoration-white/70 decoration-2 underline-offset-4"
									:title="languageTooltip(formLanguage(form))"
								>
									{{ formText(form) }}
								</span>
								<span
									v-for="location in form.locations"
									:key="`header-${formIndex}-${locationKey(location)}`"
									:class="compactBadgeClass"
								>
									<MapPin class="size-4 text-gray-400" />
									{{ formatLocation(location) }}
								</span>
								<span v-if="sourceLabel(form.source)" :class="compactBadgeClass">
									<BookOpen class="size-4 text-gray-500" />
									{{ sourceLabel(form.source) }}
								</span>
							</template>
						</div>
						<div v-if="compactGrammar" class="pl-10 text-xl/tight">
							{{ compactGrammar }}
						</div>
					</div>
					<div class="ml-auto flex flex-col items-end gap-1.5">
						<div class="flex items-center gap-2">
							<TooltipProvider v-if="entryXmlLink" :delay-duration="0">
								<Tooltip>
									<TooltipTrigger as-child>
										<NuxtLink
											aria-label="entry as xml"
											class="flex size-8 items-center justify-center rounded-sm border border-white/50 text-white hover:bg-white hover:text-primary"
											external
											rel="noopener noreferrer"
											target="_blank"
											:to="entryXmlLink"
										>
											<Code class="size-4" />
										</NuxtLink>
									</TooltipTrigger>
									<TooltipContent class="border-black bg-black text-white" side="bottom">
										view as xml
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider v-if="entryJsonLink" :delay-duration="0">
								<Tooltip>
									<TooltipTrigger as-child>
										<NuxtLink
											aria-label="entry as JSON"
											class="flex size-8 items-center justify-center rounded-sm border border-white/50 text-white hover:bg-white hover:text-primary"
											external
											rel="noopener noreferrer"
											target="_blank"
											:to="entryJsonLink"
										>
											<Braces class="size-4" />
										</NuxtLink>
									</TooltipTrigger>
									<TooltipContent class="border-black bg-black text-white" side="bottom">
										view as JSON
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider :delay-duration="0">
								<Tooltip>
									<TooltipTrigger as-child>
										<button
											aria-label="search lemma in corpus"
											class="flex size-8 items-center justify-center rounded-sm border border-white/50 text-white hover:bg-white hover:text-primary"
											type="button"
											@click="openCorpusSearchWindow"
										>
											<Search class="size-4" />
										</button>
									</TooltipTrigger>
									<TooltipContent class="border-black bg-black text-white" side="bottom">
										search in corpus
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
						<span v-if="entryStatusLabel" class="capitalize" :class="compactBadgeClass">
							<CircleAlert class="size-4 text-gray-500" />
							{{ entryStatusLabel }}
						</span>
					</div>
				</div>
			</header>

			<div class="px-4 py-3">
				<div class="grid grid-cols-[minmax(8.75rem,12.5rem)_1fr] gap-x-6">
					<div
						v-if="hasEtymology"
						class="px-4 py-3 text-base leading-none font-semibold text-primary uppercase"
					>
						Etymology
					</div>
					<section v-if="hasEtymology" class="py-3 text-base/snug">
						<span
							v-for="(etymology, etymologyIndex) in e.etymologies"
							:key="textKey(etymology, etymologyIndex)"
						>
							<span v-if="etymologyIndex === 0">&lt; </span>
							<span v-else>; </span>
							<span class="italic" :title="languageTooltip(etymology.lang)">
								{{ etymology.text }}
							</span>
							<span v-if="etymology.lang"> ({{ etymology.lang }})</span>
						</span>
					</section>

					<div
						v-if="hasInflectedForms"
						class="px-4 py-3 text-base leading-none font-semibold text-primary uppercase"
					>
						Infl. Forms
					</div>
					<section v-if="hasInflectedForms" class="space-y-2 py-3 text-base/snug">
						<div
							v-for="(form, formIndex) in e.inflectedForms"
							:key="`inflected-${formIndex}`"
							class="flex flex-wrap items-center gap-x-2 gap-y-1"
						>
							<span
								v-if="formText(form)"
								class="font-bold italic"
								:title="languageTooltip(formLanguage(form))"
							>
								{{ formText(form) }}
							</span>
							<span v-if="formGrammarText(form)">({{ formGrammarText(form) }})</span>
							<template v-for="location in form.locations" :key="locationKey(location)">
								<span :class="compactBadgeClass">
									<MapPin class="size-4 text-gray-400" />
									{{ formatLocation(location) }}
								</span>
							</template>
							<span v-if="sourceLabel(form.source)" :class="compactBadgeClass">
								<BookOpen class="size-4 text-gray-500" />
								{{ sourceLabel(form.source) }}
							</span>
							<template
								v-for="(variant, variantIndex) in form.variants"
								:key="`inflected-${formIndex}-variant-${variantIndex}`"
							>
								<span aria-hidden="true">;</span>
								<span
									v-if="formText(variant)"
									class="font-bold italic"
									:title="languageTooltip(formLanguage(variant))"
								>
									{{ formText(variant) }}
								</span>
								<span v-if="formGrammarText(variant)">({{ formGrammarText(variant) }})</span>
								<span
									v-for="location in variant.locations"
									:key="locationKey(location)"
									:class="compactBadgeClass"
								>
									<MapPin class="size-4 text-gray-400" />
									{{ formatLocation(location) }}
								</span>
								<span v-if="sourceLabel(variant.source)" :class="compactBadgeClass">
									<BookOpen class="size-4 text-gray-500" />
									{{ sourceLabel(variant.source) }}
								</span>
							</template>
						</div>
					</section>

					<template v-for="(sense, senseIndex) in e.senses" :key="sense.id ?? senseIndex">
						<div class="px-4 py-3 text-base leading-none font-semibold text-primary uppercase">
							{{ e.senses.length > 1 ? `Sense ${String(senseIndex + 1)}` : "Sense" }}
						</div>
						<section class="py-0.5">
							<div class="rounded-sm bg-primary/15 px-2 py-1">
								<div v-if="senseGrammarText(sense.grammar)" class="mb-1 font-bold italic">
									({{ senseGrammarText(sense.grammar) }})
								</div>
								<div class="text-base/tight">
									<div
										v-for="(translation, translationIndex) in sense.translations"
										:key="textKey(translation, translationIndex)"
										class="flex flex-wrap items-center gap-1.5"
									>
										<span
											:class="languageClass(translation.lang)"
											:title="languageTooltip(translation.lang)"
										>
											{{ translation.text }}
										</span>
										<span v-if="sourceLabel(translation.source)" :class="compactBadgeClass">
											<BookOpen class="size-4 text-gray-500" />
											{{ sourceLabel(translation.source) }}
										</span>
									</div>
								</div>

								<div v-if="sense.examples.length > 0" class="mt-1 space-y-1.5">
									<div
										v-for="(example, exampleIndex) in sense.examples"
										:key="`${example.kind}-${example.id ?? example.quote?.text ?? exampleIndex}`"
										class="rounded-lg bg-primary/15 p-1"
									>
										<div class="flex flex-wrap items-start justify-between gap-1">
											<div
												v-if="example.quote"
												class="font-bold italic"
												:title="languageTooltip(example.quote.lang)"
											>
												{{ example.quote.text }}
											</div>
											<div class="ml-auto flex flex-wrap justify-end gap-0.5">
												<span
													v-for="item in example.bibliography"
													:key="item"
													:class="compactBadgeClass"
												>
													<BookOpen class="size-4 text-gray-500" />
													{{ item }}
												</span>
												<span v-if="sourceLabel(example.source)" :class="compactBadgeClass">
													<BookOpen class="size-4 text-gray-500" />
													{{ sourceLabel(example.source) }}
												</span>
												<span
													v-for="location in example.locations"
													:key="locationKey(location)"
													:class="compactBadgeClass"
												>
													<MapPin class="size-4 text-gray-400" />
													{{ formatLocation(location) }}
												</span>
											</div>
										</div>
										<div class="text-base/tight">
											<div
												v-for="(translation, translationIndex) in example.translations"
												:key="textKey(translation, translationIndex)"
												:class="languageClass(translation.lang)"
												:title="languageTooltip(translation.lang)"
											>
												{{ translation.text }}
											</div>
										</div>
									</div>
								</div>

								<div v-if="sense.locations.length > 0" class="mt-3 flex flex-wrap gap-0.5">
									<span
										v-for="location in sense.locations"
										:key="locationKey(location)"
										:class="compactBadgeClass"
									>
										<MapPin class="size-4 text-gray-400" />
										{{ formatLocation(location) }}
									</span>
								</div>
							</div>
						</section>
					</template>

					<div
						v-if="hasEditors"
						class="px-4 py-3 text-base leading-none font-semibold text-primary uppercase"
					>
						Editors
					</div>
					<section v-if="hasEditors" class="py-3 text-base/snug">
						<span v-for="(editor, editorIndex) in uniqueEditors" :key="editor">
							{{ editor }}<span v-if="editorIndex < uniqueEditors.length - 1">, </span>
						</span>
					</section>
				</div>
			</div>
		</article>
	</div>
</template>
