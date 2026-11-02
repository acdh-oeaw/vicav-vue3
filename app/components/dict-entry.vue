<script setup lang="ts">
import { Braces, CircleAlert, Code, MapPin, Search } from "@lucide/vue";

import type { RestVLEEntry } from "@/lib/api-client";
import type { WindowItem } from "@/types/global.ts";
import {
	formatLocation,
	normalizeEntry,
	type RenderedBibliographyReference,
	type RenderedDictEntry,
	type RenderedForm,
	type RenderedGrammarItem,
	type RenderedLocation,
	type RenderedSense,
	type RenderedText,
} from "@/utils/dict-entry-rendering";

import DictSourceAction from "./dict-source-action.vue";

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
	"inline-flex min-h-6 items-center gap-1 rounded-full border border-primary/20 bg-[color-mix(in_srgb,hsl(var(--color-primary))_10%,white)] px-1.5 text-sm leading-none text-gray-900 shadow-xs";

const bibliographyById = computed(() => {
	return new Map(
		e.value.bibliography.flatMap((item) =>
			item.sourceId == null ? [] : [[item.sourceId, item] as const],
		),
	);
});

const headerForms = computed(() => {
	return e.value.lemmaForms;
});

const compactGrammar = computed(() => {
	const values = {
		partOfSpeech: findGrammarValue(e.value.grammar, "Part of speech"),
		gender: findGrammarValue(e.value.grammar, "Gender"),
		class: findGrammarValue(e.value.grammar, "Class"),
		synRoot: findGrammarValue(e.value.grammar, "Syn root"),
		diaRoot: findGrammarValue(e.value.grammar, "Dia root"),
		root: findGrammarValue(e.value.grammar, "Root"),
	};
	const roots = [
		formatRootGrammar(values.synRoot, "synRoot"),
		formatRootGrammar(values.diaRoot, "diaRoot"),
		formatRootGrammar(values.root, "Root"),
	].filter(Boolean);

	const patterns = headerForms.value
		.concat(e.value.variantForms)
		.flatMap((form) => form.grammar)
		.filter((item) => item.label === "Pattern" && item.value !== "-")
		.map((item) => item.value);
	const uniquePatterns = Array.from(new Set(patterns));
	return [
		values.partOfSpeech,
		values.partOfSpeech?.toLowerCase().endsWith("noun") ? values.gender : undefined,
		values.class,
		uniquePatterns.join(", "),
		roots.join(", "),
	]
		.filter(Boolean)
		.join(", ");
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

const formSections = computed(() =>
	[
		{ label: "Variant Forms", forms: e.value.variantForms, separateVariants: false },
		{ label: "Infl. Forms", forms: e.value.inflectedForms, separateVariants: false },
		{ label: "Derived Forms", forms: e.value.derivativeForms, separateVariants: true },
	].filter((section) => section.forms.length > 0),
);
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
	return `[dict="dict:${escapeCorpusQueryValue(e.value.id)}"] | <seg lemmaRef="dict:${escapeCorpusQueryValue(e.value.id)}"/> containing []`;
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
				mode: "text",
			},
		} as unknown as WindowItem,
		`Corpus search: ${e.value.title ?? e.value.lemma}`,
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

const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const languageName = (tag: string) => {
	const normalized = tag.replace(/^gr(?=-|$)/i, "el");
	try {
		return languageNames.of(normalized) ?? tag;
	} catch {
		return tag;
	}
};

const sourceReferences = (source: string | undefined): Array<RenderedBibliographyReference> => {
	if (!source?.trim()) return [];
	return source
		.trim()
		.split(/\s+/)
		.flatMap((id) => {
			const reference = bibliographyById.value.get(id.replace(/^#/, ""));
			return reference ? [reference] : [];
		});
};

const grammarValues = (items: Array<RenderedGrammarItem>) => {
	return items.map((item) => item.value).filter((value) => value !== "-");
};

const formVariants = (form: RenderedForm): Array<RenderedForm> => {
	return form.variants.flatMap((variant) => [variant, ...formVariants(variant)]);
};

const senseGrammarText = (items: Array<RenderedGrammarItem>) => {
	const values = grammarValues(items);
	return values.length === 0 ? undefined : values.join(", ");
};

const groupedSenseTranslations = (sense: RenderedSense) => {
	const groups = new Map<string, { lang: string | undefined; translations: Array<RenderedText> }>();

	for (const translation of sense.translations) {
		const key = translation.lang ?? "";
		const group = groups.get(key);

		if (group == null) {
			groups.set(key, { lang: translation.lang, translations: [translation] });
		} else {
			group.translations.push(translation);
		}
	}

	return Array.from(groups.values());
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
			<header class="bg-primary/20 px-3 py-2 text-gray-950">
				<div class="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg">
							<template v-for="(form, formIndex) in headerForms" :key="`header-${formIndex}`">
								<span v-if="formIndex > 0" aria-hidden="true" class="hidden sm:inline"> ; </span>
								<span
									v-if="formText(form)"
									class="text-2xl font-bold wrap-break-word"
									:class="{ italic: /^ar-(latn|ltn)(-|$)/i.test(formLanguage(form) ?? '') }"
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
								<DictSourceAction
									v-for="(reference, sourceIndex) in sourceReferences(form.source)"
									:key="sourceIndex"
									:reference="reference"
								/>
							</template>
						</div>
						<div v-if="compactGrammar" class="text-lg">
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
											class="flex size-8 items-center justify-center rounded-sm border border-primary/20 bg-[color-mix(in_srgb,hsl(var(--color-primary))_10%,white)] text-primary hover:bg-primary hover:text-white"
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
											class="flex size-8 items-center justify-center rounded-sm border border-primary/20 bg-[color-mix(in_srgb,hsl(var(--color-primary))_10%,white)] text-primary hover:bg-primary hover:text-white"
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
											class="flex size-8 items-center justify-center rounded-sm border border-primary/20 bg-[color-mix(in_srgb,hsl(var(--color-primary))_10%,white)] text-primary hover:bg-primary hover:text-white"
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
				<div class="grid grid-cols-[10rem_minmax(0,1fr)] gap-x-4">
					<template v-for="section in formSections" :key="section.label">
						<div
							class="px-4 py-3 text-base leading-none font-semibold text-primary uppercase whitespace-nowrap"
						>
							{{ section.label }}
						</div>
						<section class="space-y-2 py-3 text-base/snug">
							<div
								v-for="(form, formIndex) in section.forms"
								:key="`inflected-${formIndex}`"
								class="flex flex-wrap items-center gap-x-2 gap-y-1"
							>
								<DictFormDisplay
									:badge-class="compactBadgeClass"
									:form="form"
									:references="sourceReferences(form.source)"
								/>
								<div
									v-for="(variant, variantIndex) in formVariants(form)"
									:key="variantIndex"
									class="flex flex-wrap items-center gap-x-2 gap-y-1"
									:class="{ 'w-full': section.separateVariants }"
								>
									<span v-if="!section.separateVariants" aria-hidden="true">;</span>
									<DictFormDisplay
										:badge-class="compactBadgeClass"
										:form="variant"
										:references="sourceReferences(variant.source)"
									/>
								</div>
							</div>
						</section>
					</template>

					<template v-for="(sense, senseIndex) in e.senses" :key="sense.id ?? senseIndex">
						<div
							class="px-4 py-3 text-base leading-none font-semibold text-primary uppercase whitespace-nowrap"
						>
							{{ e.senses.length > 1 ? `Sense ${String(senseIndex + 1)}` : "Sense" }}
						</div>
						<section class="py-0.5">
							<div class="rounded-sm border border-primary/15 bg-primary/15 px-2 py-1">
								<div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1">
									<div v-if="senseGrammarText(sense.grammar)" class="mb-1 font-bold italic">
										({{ senseGrammarText(sense.grammar) }})
									</div>
									<div class="flex max-w-72 flex-wrap justify-end gap-0.5 justify-self-end">
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
								<div class="text-base/tight">
									<div
										v-for="translationGroup in groupedSenseTranslations(sense)"
										:key="translationGroup.lang ?? 'unknown'"
										class="flex flex-wrap items-center gap-1.5"
									>
										<span
											class="inline-flex flex-wrap items-center gap-x-1"
											:class="languageClass(translationGroup.lang)"
											:title="languageTooltip(translationGroup.lang)"
										>
											<template
												v-for="(translation, translationIndex) in translationGroup.translations"
												:key="textKey(translation, translationIndex)"
											>
												<span>{{ translation.text }}</span>
												<span v-if="translation.gloss" class="text-gray-700">
													({{ translation.gloss }})
												</span>
												<DictSourceAction
													v-for="(reference, sourceIndex) in sourceReferences(translation.source)"
													:key="sourceIndex"
													:reference="reference"
												/>
												<span v-if="translationIndex < translationGroup.translations.length - 1">
													,
												</span>
											</template>
										</span>
									</div>
								</div>
								<div v-if="sense.glosses.length > 0" class="mt-1 flex flex-wrap gap-1">
									<span
										v-for="(gloss, glossIndex) in sense.glosses"
										:key="textKey(gloss, glossIndex)"
										class="inline-flex items-center rounded-sm bg-white/80 px-1.5 py-0.5 text-sm text-gray-700"
									>
										<span class="font-semibold">gloss:</span>&nbsp;{{ gloss.text }}
									</span>
								</div>

								<div v-if="sense.examples.length > 0" class="mt-1 space-y-1.5">
									<div
										v-for="(example, exampleIndex) in sense.examples"
										:key="`${example.kind}-${example.id ?? example.quote?.text ?? exampleIndex}`"
										class="rounded-lg bg-primary/15 p-1"
									>
										<div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1">
											<div
												v-if="example.quote"
												class="min-w-0 font-bold wrap-break-word italic"
												:title="languageTooltip(example.quote.lang)"
											>
												{{ example.quote.text }}
											</div>
											<div class="flex max-w-72 flex-wrap justify-end gap-0.5 justify-self-end">
												<DictSourceAction
													v-for="item in example.bibliography"
													:key="`${item.sourceId ?? 'local'}-${item.queryString}`"
													:reference="item"
												/>
												<DictSourceAction
													v-for="(reference, sourceIndex) in sourceReferences(example.source)"
													:key="sourceIndex"
													:reference="reference"
												/>
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
							</div>
						</section>
					</template>

					<div
						v-if="hasEtymology"
						class="px-4 py-3 text-base leading-none font-semibold text-primary uppercase whitespace-nowrap"
					>
						Etymology
					</div>
					<section v-if="hasEtymology" class="space-y-1 py-3 text-base/snug">
						<div v-for="(group, groupIndex) in e.etymologyGroups" :key="`etymology-${groupIndex}`">
							<template v-for="(level, levelIndex) in group.levels" :key="levelIndex">
								<span v-if="levelIndex > 0"> &lt; </span>
								<span
									v-for="(etymology, etymologyIndex) in level"
									:key="textKey(etymology, etymologyIndex)"
								>
									<span v-if="etymologyIndex > 0">; </span>
									<span
										class="italic"
										:class="languageClass(etymology.lang)"
										:lang="etymology.lang"
										:title="languageTooltip(etymology.lang)"
									>
										{{ etymology.text }}
									</span>
									<span v-if="etymology.lang"> ({{ languageName(etymology.lang) }})</span>
								</span>
							</template>
						</div>
					</section>

					<div
						v-if="hasEditors"
						class="px-4 py-3 text-base leading-none font-semibold text-primary uppercase whitespace-nowrap"
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
