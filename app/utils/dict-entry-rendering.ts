import type { DictChange, DictEntry, DictExample, RestVLEEntry } from "@/lib/api-client";

export interface RenderedText {
	lang?: string;
	gloss?: string;
	source?: string;
	text: string;
	isMissing?: boolean;
}

export interface RenderedMetadataItem {
	label: string;
	value: string;
}

export interface RenderedLocation {
	place?: string;
	tribe?: string;
}

export interface RenderedGrammarItem {
	label: string;
	value: string;
}

export interface RenderedEditor {
	action: "change" | "create";
	status?: string;
	when?: string;
	who?: string;
}

export interface RenderedForm {
	type?: string;
	subtype?: string;
	source?: string;
	orthographies: Array<RenderedText>;
	grammar: Array<RenderedGrammarItem>;
	locations: Array<RenderedLocation>;
	variants: Array<RenderedForm>;
	metadata: Array<RenderedMetadataItem>;
}

export interface RenderedExample {
	id?: string;
	kind: "direct" | "related";
	source?: string;
	quote?: RenderedText;
	locations: Array<RenderedLocation>;
	translations: Array<RenderedText>;
	editors: Array<RenderedEditor>;
	bibliography: Array<string>;
	metadata: Array<RenderedMetadataItem>;
}

export interface RenderedSense {
	id?: string;
	ana?: string;
	definitions: Array<RenderedText>;
	glosses: Array<RenderedText>;
	translations: Array<RenderedText>;
	grammar: Array<RenderedGrammarItem>;
	locations: Array<RenderedLocation>;
	examples: Array<RenderedExample>;
	metadata: Array<RenderedMetadataItem>;
}

export interface RenderedBibliographyItem {
	id: string;
	label: string;
}

export interface RenderedEtymologyGroup {
	etymologies: Array<RenderedText>;
	levels: Array<Array<RenderedText>>;
}

export interface RenderedDictEntry {
	id: string;
	sid?: string;
	xmlId?: string;
	lemma: string;
	title?: string;
	status?: string;
	type?: string;
	html?: string;
	selfHref: string;
	entryLang?: string;
	location?: string;
	locations: Array<RenderedLocation>;
	etymologies: Array<RenderedText>;
	etymologyGroups: Array<RenderedEtymologyGroup>;
	bibliography: Array<RenderedBibliographyItem>;
	lemmaForms: Array<RenderedForm>;
	variantForms: Array<RenderedForm>;
	quote?: RenderedText;
	translations: Array<RenderedText>;
	editors: Array<RenderedEditor>;
	grammar: Array<RenderedGrammarItem>;
	inflectedForms: Array<RenderedForm>;
	senses: Array<RenderedSense>;
	notes: Array<string>;
	metadata: Array<RenderedMetadataItem>;
	raw: RestVLEEntry;
}

interface TextNodeLike {
	"@lang"?: string;
	"@type"?: string;
	$?: string;
}

interface TranslationLike {
	"@lang"?: string;
	quote?: TextNodeLike;
}

interface ExampleLike {
	"@id"?: string;
	"@source"?: string;
	"@type"?: string;
	"@subtype"?: string;
	"@vutlsk"?: string;
	feature?: DictChange;
	features?: Array<DictChange>;
	geographic_usg?: EntryLocationLike;
	quote?: TextNodeLike;
	translation_cit?: TranslationLike;
	translation_cits?: Array<TranslationLike>;
	listBibl?: Array<{
		"@id"?: string;
		title?: {
			"@ref"?: string;
		};
		biblScope?: {
			"@unit"?: string;
			$: string;
		};
	}>;
}

interface GrammarLike {
	gramGrp?: GrammarLike;
	pos_gram?: { $?: string };
	derivedVerbClass_gram?: { $?: string };
	synRoot_gram?: { $?: string };
	diaRoot_gram?: { $?: string };
	root_gram?: { $?: string };
	root_grams?: Array<{ $?: string }>;
	roots_gram?: { $?: string };
	number_gram?: { $?: string };
	person_gram?: { $?: string };
	aspect_gram?: { $?: string };
	gender_gram?: { $?: string };
	mood_gram?: { $?: string };
	voice_gram?: { $?: string };
	degree_gram?: { $?: string };
	inflectionType_gram?: { $?: string };
	msd_gram?: { $?: string };
	constraint_gram?: { $?: string };
	morphPattern_gram?: { $?: string };
	collocate_gram?: { $?: string };
	valency_gram?: { $?: string };
	government_gram?: { $?: string };
	arguments_gram?: TextNodeLike;
	arguments_grams?: Array<TextNodeLike>;
	subc_gram?: { $?: string };
	socioCultural_usg?: { $?: string };
	temporal_usg?: { $?: string };
}

interface EntryLocationLike {
	place_name?: {
		$: string;
	};
	tribe_name?: {
		$: string;
	};
	tribe_names?: Array<{
		$: string;
	}>;
	$?: string;
}

interface EntryFormLike {
	"@source"?: string;
	"@type"?: string;
	"@subtype"?: string;
	"@lang"?: string;
	"@ana"?: string;
	orth?: TextNodeLike;
	orths?: Array<TextNodeLike>;
	gramGrp?: GrammarLike | string;
	geographic_usg?: EntryLocationLike;
	geographic_usgs?: Array<EntryLocationLike>;
	variant_form?: EntryFormLike;
	variant_forms?: Array<EntryFormLike>;
	socioCultural_usg?: {
		$: string;
	};
	reg_usg?: {
		$: string;
	};
	workflow_note?: {
		$: string;
	};
}

interface TranslationEquivalentLike {
	"@source"?: string;
	"@type"?: string;
	"@lang"?: string;
	form?: {
		orth?: TextNodeLike;
	};
	gloss?: TextNodeLike | string;
}

interface RelatedXrLike {
	"@type"?: string;
	$?: string;
	example_cit?: ExampleLike;
}

interface SenseLike {
	"@id"?: string;
	"@ana"?: string;
	domain_usg?: TextNodeLike;
	domain_usgs?: Array<TextNodeLike>;
	pragmatics_usg?: TextNodeLike;
	pragmatics_usgs?: Array<TextNodeLike>;
	socioCultural_usg?: TextNodeLike;
	gramGrp?: GrammarLike;
	gramGrps?: Array<GrammarLike>;
	def?: TextNodeLike;
	defs?: Array<TextNodeLike>;
	translationEquivalent_cit?: TranslationEquivalentLike;
	translationEquivalent_cits?: Array<TranslationEquivalentLike>;
	glosses?: Array<TextNodeLike>;
	geographic_usg?: EntryLocationLike;
	geographic_usgs?: Array<EntryLocationLike>;
	example_cit?: ExampleLike;
	example_cits?: Array<ExampleLike>;
	related_xr?: RelatedXrLike;
	related_xrs?: Array<RelatedXrLike>;
}

interface EntryPayloadLike {
	"@id"?: string;
	"@lang"?: string;
	lemma_form?: EntryFormLike;
	lemmaVariant_form?: EntryFormLike;
	lemmaVariant_forms?: Array<EntryFormLike>;
	multiWordUnit_form?: EntryFormLike;
	inflected_form?: EntryFormLike;
	inflected_forms?: Array<EntryFormLike>;
	gramGrp?: GrammarLike | string;
	sense?: SenseLike;
	senses?: Array<SenseLike>;
	def?: TextNodeLike;
	defs?: Array<TextNodeLike>;
	note?: TextNodeLike;
	notes?: Array<TextNodeLike>;
	translation_cit?: TranslationLike;
	translation_cits?: Array<TranslationLike>;
	feature?: DictChange;
	features?: Array<DictChange>;
	etym?: EtymLike;
	listBibl?: Array<BibliographyLike>;
	geographic_usg?: EntryLocationLike;
	example_cit?: ExampleLike;
	example_cits?: Array<ExampleLike>;
	related_xr?: RelatedXrLike;
	related_xrs?: Array<RelatedXrLike>;
}

interface BibliographyLike {
	"@id"?: string;
	title?: {
		"@ref"?: string;
	};
	biblScope?: {
		"@unit"?: string;
		$: string;
	};
}

interface EtymonLike {
	form?: {
		orth?: TextNodeLike;
		orths?: Array<TextNodeLike>;
	};
}

interface EtymLike {
	etym?: EtymLike;
	etymon_cit?: EtymonLike;
	etymon_cits?: Array<EtymonLike>;
}

function asArray<T>(value: T | Array<T> | null | undefined): Array<T> {
	if (value == null) return [];
	return Array.isArray(value) ? value : [value];
}

function compactMetadata(
	items: Array<[string, string | null | undefined]>,
): Array<RenderedMetadataItem> {
	return items
		.filter(([, value]) => value != null && value !== "")
		.map(([label, value]) => ({ label, value: String(value) }));
}

function normalizeSource(source: string | undefined): string | undefined {
	return source?.replace(/^#/, "");
}

function collectChanges(
	changes: DictChange | Array<DictChange> | undefined,
): Array<RenderedEditor> {
	const renderedChanges: Array<RenderedEditor> = [];

	for (const item of asArray(changes)) {
		if (item.change != null) {
			renderedChanges.push({ action: "change", ...item.change });
			continue;
		}

		if (item.create != null) {
			renderedChanges.push({
				action: "create",
				status: item.create.status,
				when: typeof item.create.when === "string" ? item.create.when : undefined,
				who: item.create.who,
			});
		}
	}

	return renderedChanges;
}

function collectTextNodes(
	single: TextNodeLike | undefined,
	multiple: Array<TextNodeLike> | undefined,
): Array<RenderedText> {
	return [...asArray(single), ...asArray(multiple)].flatMap((node) => {
		const text = node.$?.trim();
		const lang = node["@lang"];
		if (text != null && text !== "") return [{ lang, text }];
		if (lang != null && lang !== "") return [{ lang, text: "No text", isMissing: true }];
		return [];
	});
}

function collectTranslations(
	single: TranslationLike | undefined,
	multiple: Array<TranslationLike> | undefined,
): Array<RenderedText> {
	return [...asArray(single), ...asArray(multiple)].flatMap((translation) => {
		const lang = translation["@lang"] ?? translation.quote?.["@lang"];
		const text = translation.quote?.$?.trim();
		if (text != null && text !== "") return [{ lang, text }];
		if (lang != null && lang !== "") return [{ lang, text: "No text", isMissing: true }];
		return [];
	});
}

function collectTranslationEquivalents(
	single: TranslationEquivalentLike | undefined,
	multiple: Array<TranslationEquivalentLike> | undefined,
): Array<RenderedText> {
	return [...asArray(single), ...asArray(multiple)].flatMap((translation) => {
		const lang = translation.form?.orth?.["@lang"] ?? translation["@lang"];
		const text = translation.form?.orth?.$?.trim();
		const gloss =
			typeof translation.gloss === "string"
				? translation.gloss.trim()
				: translation.gloss?.$?.trim();

		if (text != null && text !== "") {
			return [{ lang, gloss, source: normalizeSource(translation["@source"]), text }];
		}

		if (gloss != null && gloss !== "") {
			return [{ lang, source: normalizeSource(translation["@source"]), text: gloss }];
		}

		if (lang != null && lang !== "") {
			return [
				{ lang, source: normalizeSource(translation["@source"]), text: "No text", isMissing: true },
			];
		}

		return [];
	});
}

function collectLocations(
	single: EntryLocationLike | undefined,
	multiple: Array<EntryLocationLike> | undefined,
): Array<RenderedLocation> {
	return [...asArray(single), ...asArray(multiple)]
		.map((location) => {
			return {
				place: location.place_name?.$ ?? location.$,
				tribe: location.tribe_name?.$ ?? location.tribe_names?.[0]?.$,
			};
		})
		.filter((location) => location.place != null || location.tribe != null)
		.filter((location, index, locations) => {
			return (
				locations.findIndex((item) => formatLocation(item) === formatLocation(location)) === index
			);
		});
}

export function formatLocation(location: RenderedLocation) {
	return [location.place, location.tribe].filter(Boolean).join(", ");
}

function collectGrammar(grammar: GrammarLike | string | undefined): Array<RenderedGrammarItem> {
	if (grammar == null || typeof grammar === "string") return [];

	const items: Array<[string, string | undefined]> = [
		["Part of speech", grammar.pos_gram?.$],
		["Class", grammar.derivedVerbClass_gram?.$],
		["Syn root", grammar.synRoot_gram?.$],
		["Dia root", grammar.diaRoot_gram?.$],
		["Root", grammar.root_gram?.$],
		...asArray(grammar.root_grams).map((root, index): [string, string | undefined] => [
			`Root ${String(index + 1)}`,
			root.$,
		]),
		["Roots", grammar.roots_gram?.$],
		["Aspect", grammar.aspect_gram?.$],
		["Number", grammar.number_gram?.$],
		["Person", grammar.person_gram?.$],
		["Gender", grammar.gender_gram?.$],
		["Mood", grammar.mood_gram?.$],
		["Voice", grammar.voice_gram?.$],
		["Degree", grammar.degree_gram?.$],
		["Inflection", grammar.inflectionType_gram?.$],
		["MSD", grammar.msd_gram?.$],
		["Constraint", grammar.constraint_gram?.$],
		["Pattern", grammar.morphPattern_gram?.$],
		["Collocate", grammar.collocate_gram?.$],
		["Valency", grammar.valency_gram?.$],
		["Government", grammar.government_gram?.$],
		["Argument", grammar.arguments_gram?.$],
		...asArray(grammar.arguments_grams).map((argument, index): [string, string | undefined] => [
			`Argument ${String(index + 1)}`,
			argument.$,
		]),
		["Subclass", grammar.subc_gram?.$],
		["Socio-cultural", grammar.socioCultural_usg?.$],
		["Temporal", grammar.temporal_usg?.$],
	];

	return collectGrammar(grammar.gramGrp).concat(
		items
			.filter(([, value]) => value != null && value !== "")
			.map(([label, value]) => ({ label, value: String(value) })),
	);
}

function formatBibliographyTitle(title: string | undefined): string | undefined {
	if (title == null || title === "") return undefined;

	const label = title.replace(/^zot:/, "");
	const match = /^(?<name>.+?)(?<year>\d{4})$/.exec(label);
	if (match?.groups == null) return label;

	const name = match.groups.name;
	const year = match.groups.year;
	if (name == null || year == null) return label;

	return `${name} ${year}`;
}

function formatBibliographyItem(item: BibliographyLike): string | undefined {
	const title = formatBibliographyTitle(item.title?.["@ref"]);
	const scope = item.biblScope?.$;

	if (title == null && scope == null) return undefined;
	return [title, scope].filter(Boolean).join(", ");
}

function collectBibliographyItems(
	items: Array<BibliographyLike> | BibliographyLike | undefined,
): Array<RenderedBibliographyItem> {
	return asArray(items).flatMap((item) => {
		const id = item["@id"];
		const label = formatBibliographyItem(item);

		if (id == null || label == null) return [];
		return [{ id, label }];
	});
}

function collectBibliography(example: ExampleLike | undefined): Array<string> {
	return asArray(example?.listBibl).flatMap((item) => {
		const label = formatBibliographyItem(item);
		return label == null ? [] : [label];
	});
}

function collectEtymologies(etym: EtymLike | undefined): Array<RenderedText> {
	if (etym == null) return [];

	const etymons = asArray(etym.etymon_cit).concat(asArray(etym.etymon_cits));
	const nested = collectEtymologies(etym.etym);

	return etymons
		.flatMap((etymon) => collectTextNodes(etymon.form?.orth, etymon.form?.orths))
		.concat(nested);
}

function collectEtymologyGroups(etym: EtymLike | undefined): Array<RenderedEtymologyGroup> {
	if (etym == null) return [];

	const nestedGroups = collectEtymologyGroups(etym.etym);
	const rootGroups = asArray(etym.etymon_cit)
		.concat(asArray(etym.etymon_cits))
		.map((etymon) => collectTextNodes(etymon.form?.orth, etymon.form?.orths))
		.filter((etymologies) => etymologies.length > 0);

	if (rootGroups.length === 0) {
		return nestedGroups;
	}

	const lastRootIndex = rootGroups.length - 1;

	return rootGroups.map((etymologies, index) => {
		const nestedLevels =
			index === lastRootIndex ? nestedGroups.flatMap((group) => group.levels) : [];
		const levels = [etymologies].concat(nestedLevels);

		return {
			etymologies: levels.flat(),
			levels,
		};
	});
}

function collectForm(
	single: EntryFormLike | undefined,
	multiple: Array<EntryFormLike> | undefined,
	fallbackType?: string,
): Array<RenderedForm> {
	return [...asArray(single), ...asArray(multiple)].flatMap((form) => {
		const orthographies = collectTextNodes(form.orth, form.orths);
		const grammar = collectGrammar(form.gramGrp);
		const locations = collectLocations(form.geographic_usg, form.geographic_usgs);
		const metadata = compactMetadata([
			["type", form["@type"] ?? fallbackType],
			["subtype", form["@subtype"]],
			["lang", form["@lang"]],
			["ana", form["@ana"]],
			["usage", form.socioCultural_usg?.$ ?? form.reg_usg?.$],
			["workflow", form.workflow_note?.$],
		]);

		if (
			orthographies.length === 0 &&
			grammar.length === 0 &&
			locations.length === 0 &&
			metadata.length === 0
		) {
			return [];
		}

		return [
			{
				type: form["@type"] ?? fallbackType,
				subtype: form["@subtype"],
				source: normalizeSource(form["@source"]),
				orthographies,
				grammar,
				locations,
				variants: collectForm(form.variant_form, form.variant_forms, "variant"),
				metadata,
			},
		];
	});
}

function collectExample(example: ExampleLike, kind: "direct" | "related"): RenderedExample {
	const quote = example.quote?.$
		? {
				lang: example.quote["@lang"],
				text: example.quote.$,
			}
		: undefined;

	return {
		id: example["@id"],
		kind,
		source: normalizeSource(example["@source"]),
		quote,
		locations: collectLocations(example.geographic_usg, undefined),
		translations: collectTranslations(example.translation_cit, example.translation_cits),
		editors: [...collectChanges(example.feature), ...collectChanges(example.features)],
		bibliography: collectBibliography(example),
		metadata: compactMetadata([
			["type", example["@type"]],
			["subtype", example["@subtype"]],
			["vutlsk", example["@vutlsk"]],
		]),
	};
}

function collectExamples(
	single: ExampleLike | undefined,
	multiple: Array<ExampleLike> | undefined,
): Array<RenderedExample> {
	return [...asArray(single), ...asArray(multiple)].map((example) =>
		collectExample(example, "direct"),
	);
}

function collectRelatedExamples(
	single: RelatedXrLike | undefined,
	multiple: Array<RelatedXrLike> | undefined,
): Array<RenderedExample> {
	return [...asArray(single), ...asArray(multiple)].flatMap((related) => {
		const example = related.example_cit;
		if (example == null) return [];

		return [
			{
				...collectExample(example, "related"),
				metadata: compactMetadata([
					["relation", related["@type"]],
					["warning", related.$],
					["type", example["@type"]],
					["subtype", example["@subtype"]],
					["vutlsk", example["@vutlsk"]],
				]),
			},
		];
	});
}

function collectSenseMetadata(sense: SenseLike): Array<RenderedMetadataItem> {
	return compactMetadata([
		["ana", sense["@ana"]],
		["domain", sense.domain_usg?.$],
		...asArray(sense.domain_usgs).map((domain, index): [string, string | undefined] => [
			`domain ${String(index + 1)}`,
			domain.$,
		]),
		["pragmatics", sense.pragmatics_usg?.$],
		...asArray(sense.pragmatics_usgs).map((pragmatics, index): [string, string | undefined] => [
			`pragmatics ${String(index + 1)}`,
			pragmatics.$,
		]),
		["socio-cultural", sense.socioCultural_usg?.$],
	]);
}

export function normalizeEntry(entry: RestVLEEntry): RenderedDictEntry {
	if (typeof entry.entry === "string") {
		return {
			id: entry.id,
			sid: entry.sid,
			lemma: entry.lemma,
			title: entry.lemma,
			status: entry.status,
			type: entry.type,
			html: entry.entry,
			selfHref: entry._links.self.href,
			locations: [],
			etymologies: [],
			etymologyGroups: [],
			bibliography: [],
			lemmaForms: [],
			variantForms: [],
			translations: [],
			editors: [],
			grammar: [],
			inflectedForms: [],
			senses: [],
			notes: [],
			metadata: compactMetadata([
				["took", entry.took],
				["stored md5", entry.storedEntryMd5],
			]),
			raw: entry,
		};
	}

	const payload = entry.entry as DictEntry | DictExample | undefined;
	const payloadWithEntry = payload as { entry?: EntryPayloadLike } | undefined;
	const normalizedPayload = payloadWithEntry?.entry ?? (payload as EntryPayloadLike | undefined);
	const example =
		((payload as DictEntry | undefined)?.example_cit as ExampleLike | undefined) ??
		(payload as ExampleLike | undefined);
	const quote = example?.quote?.$;
	const quoteLang = example?.quote?.["@lang"];
	const translations = collectTranslations(
		example?.translation_cit,
		example?.translation_cits,
	).concat(
		collectTranslations(normalizedPayload?.translation_cit, normalizedPayload?.translation_cits),
	);
	const editors = [
		...collectChanges(example?.feature),
		...collectChanges(example?.features),
		...collectChanges((payload as DictEntry | undefined)?.feature),
		...collectChanges((payload as DictEntry | undefined)?.features),
		...collectChanges(normalizedPayload?.feature),
		...collectChanges(normalizedPayload?.features),
	];
	const location =
		(payload as DictEntry | undefined)?.geographic_usg?.place_name?.$ ??
		example?.geographic_usg?.place_name?.$;
	const locations = collectLocations(
		normalizedPayload?.lemma_form?.geographic_usg,
		normalizedPayload?.lemma_form?.geographic_usgs,
	)
		.concat(collectLocations((payload as DictEntry | undefined)?.geographic_usg, undefined))
		.concat(collectLocations(example?.geographic_usg, undefined));
	const lemmaForms = collectForm(normalizedPayload?.lemma_form, undefined, "lemma").concat(
		collectForm(normalizedPayload?.multiWordUnit_form, undefined, "multiWordUnit"),
	);
	const variantForms = collectForm(
		normalizedPayload?.lemma_form?.variant_form,
		normalizedPayload?.lemma_form?.variant_forms,
		"variant",
	).concat(
		collectForm(
			normalizedPayload?.lemmaVariant_form,
			normalizedPayload?.lemmaVariant_forms,
			"variant",
		),
	);
	const grammar = collectGrammar(normalizedPayload?.gramGrp);
	const etymologies = collectEtymologies(normalizedPayload?.etym);
	const etymologyGroups = collectEtymologyGroups(normalizedPayload?.etym);
	const bibliography = collectBibliographyItems(normalizedPayload?.listBibl);
	const inflectedForms = collectForm(
		normalizedPayload?.inflected_form,
		normalizedPayload?.inflected_forms,
		"inflected",
	);
	const senses = [...asArray(normalizedPayload?.sense), ...asArray(normalizedPayload?.senses)].map(
		(sense) => {
			const senseGrammar = collectGrammar(sense.gramGrp).concat(
				asArray(sense.gramGrps).flatMap((grammar) => collectGrammar(grammar)),
			);

			return {
				id: sense["@id"],
				ana: sense["@ana"],
				definitions: collectTextNodes(sense.def, sense.defs),
				glosses: collectTextNodes(undefined, sense.glosses),
				translations: collectTranslationEquivalents(
					sense.translationEquivalent_cit,
					sense.translationEquivalent_cits,
				),
				grammar: senseGrammar,
				locations: collectLocations(sense.geographic_usg, sense.geographic_usgs),
				examples: collectExamples(sense.example_cit, sense.example_cits).concat(
					collectRelatedExamples(sense.related_xr, sense.related_xrs),
				),
				metadata: collectSenseMetadata(sense),
			};
		},
	);
	const notes = collectTextNodes(normalizedPayload?.note, normalizedPayload?.notes).map(
		(note) => note.text,
	);
	const firstLemmaText = lemmaForms
		.flatMap((form) => form.orthographies)
		.find((orthography) => !orthography.isMissing)?.text;
	const normalizedLemma = entry.lemma !== "[]" ? entry.lemma : undefined;
	const title = firstLemmaText ?? normalizedLemma ?? quote ?? entry.id;

	return {
		id: entry.id,
		sid: entry.sid,
		xmlId: normalizedPayload?.["@id"],
		lemma: entry.lemma,
		title,
		status: entry.status,
		type: entry.type,
		selfHref: entry._links.self.href,
		entryLang: normalizedPayload?.["@lang"],
		location,
		locations,
		etymologies,
		etymologyGroups,
		bibliography,
		lemmaForms,
		variantForms,
		quote: quote ? { lang: quoteLang, text: quote } : undefined,
		translations,
		editors,
		grammar,
		inflectedForms,
		senses,
		notes,
		metadata: compactMetadata([
			["entry language", normalizedPayload?.["@lang"]],
			["took", entry.took],
			["stored md5", entry.storedEntryMd5],
		]),
		raw: entry,
	};
}
