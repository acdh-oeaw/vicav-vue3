import { Dict } from "@/types/global.d";

type DictIndex = Set<Zod.infer<typeof Dict>["id"]>;

const dictDataExtra = {
	fieldSelect: new Map<Zod.infer<typeof Dict>["id"], Zod.infer<typeof Dict>["fieldSelect"]>([
		[
			"dc_tunico",
			new Map([
				["any", "Any field"],
				["lem", "Arabic lemma"],
				["infl", "Arabic (infl.)"],
				["en", "Trans. (English)"],
				["de", "Trans. (German)"],
				["fr", "Trans. (French)"],
				["pos", "POS"],
				["root", "Roots"],
				["subc", "subc"],
				["etymLang", "Lang. in etymologies"],
				["etymSrc", "Words in etymologies"],
			]),
		],
		[
			"dc_apc_eng_publ",
			new Map([
				["any", "Any field"],
				["lem", "Arabic lemma"],
				["infl", "Arabic (infl.)"],
				["en", "Trans. (English)"],
				["de", "Trans. (German)"],
				["fr", "Trans. (French)"],
				["pos", "POS"],
				["root", "Roots"],
				["subc", "subc"],
				["etymLang", "Lang. in etymologies"],
				["etymSrc", "Words in etymologies"],
			]),
		],
		[
			"dc_arz_eng_publ",
			new Map([
				["any", "Any field"],
				["lem", "Arabic lemma"],
				["infl", "Arabic (infl.)"],
				["en", "Trans. (English)"],
				["de", "Trans. (German)"],
				["fr", "Trans. (French)"],
				["pos", "POS"],
				["root", "Roots"],
				["subc", "subc"],
				["etymLang", "Lang. in etymologies"],
				["etymSrc", "Words in etymologies"],
			]),
		],
		[
			"dc_acm_baghdad_eng_publ",
			new Map([
				["any", "Any field"],
				["lem", "Arabic lemma"],
				["infl", "Arabic (infl.)"],
				["en", "Trans. (English)"],
				["de", "Trans. (German)"],
				["es", "Trans. (Spanish)"],
				["pos", "POS"],
				["root", "Roots"],
			]),
		],
		[
			"dc_ar_en_publ",
			new Map([
				["any", "Any field"],
				["lem", "Arabic lemma"],
				["infl", "Arabic (infl.)"],
				["en", "Trans. (English)"],
				["de", "Trans. (German)"],
				["pos", "POS"],
				["root", "Roots"],
			]),
		],
	]),
	specChars: new Map<Zod.infer<typeof Dict>["id"], Zod.infer<typeof Dict>["specChars"]>([
		[
			"dc_tunico",
			[
				"’",
				"ʔ",
				"ā",
				"ḅ",
				"ʕ",
				"ḏ",
				"ḏ",
				"ē",
				"ġ",
				"ǧ",
				"ḥ",
				"ī",
				"ᴵ",
				"ḷ",
				"ṃ",
				"ō",
				"ṛ",
				"ṣ",
				"s̠",
				"š",
				"ṭ",
				"ṯ",
				"ū",
				"ẓ",
				"ž",
			],
		],
		[
			"dc_apc_eng_publ",
			[
				"ʕ",
				"ʔ",
				"ā",
				"ḅ",
				"ʕ",
				"ḍ",
				"ḏ",
				"ǝ",
				"ᵊ",
				"ē",
				"ġ",
				"ǧ",
				"ḥ",
				"ī",
				"ḷ",
				"ṃ",
				"ō",
				"ṛ",
				"ṣ",
				"š",
				"ṭ",
				"ṯ",
				"ū",
				"ẓ",
				"ž",
			],
		],
		[
			"dc_arz_eng_publ",
			[
				"’",
				"ʔ",
				"ā",
				"ḅ",
				"ʕ",
				"ḏ",
				"ḏ",
				"ē",
				"ġ",
				"ǧ",
				"ḥ",
				"ī",
				"ᴵ",
				"ḷ",
				"ṃ",
				"ō",
				"ṛ",
				"ṣ",
				"s̠",
				"š",
				"ṭ",
				"ṯ",
				"ū",
				"ẓ",
				"ž",
			],
		],
		[
			"dc_acm_baghdad_eng_publ",
			[
				"ʔ",
				"ʕ",
				"ā",
				"b",
				"č",
				"d",
				"ḍ",
				"ḓ",
				"ḏ",
				"e",
				"ē",
				"ǝ",
				"ġ",
				"ǧ",
				"ḥ",
				"ī",
				"ḷ",
				"ṃ",
				"ō",
				"ṛ",
				"š",
				"ṣ",
				"ṭ",
				"ṯ",
				"ū",
				"ẓ",
			],
		],
		[
			"dc_ar_en_publ",
			[
				"ˀ",
				"ˁ",
				"ā",
				"ḍ",
				"ḏ",
				"ē",
				"ġ",
				"ǧ",
				"ḥ",
				"ī",
				"ḷ",
				"ṣ",
				"s̠",
				"š",
				"ṭ",
				"ṯ",
				"ū",
				"ẓ",
				"ʔ",
			],
		],
	]),
};

export const useDictStore = defineStore("dict", () => {
	const { data: dictData, suspense } = useDicts();

	const initialize = async () => {
		await suspense();
	};

	const dictIndex = computed(() => {
		const newDictIndex: DictIndex = new Set();
		const dicts: Array<object> | undefined = dictData.value?._embedded.dicts;
		if (dicts !== undefined) {
			dicts.forEach((d) => {
				const dictParse = Dict.shape.id.safeParse(d.name);
				if (dictParse.success) {
					newDictIndex.add(dictParse.data);
				}
			});
		}
		return newDictIndex;
	});

	const getDictById = async (id: Zod.infer<typeof Dict>["id"]) => {
		if (!dictIndex.value.has(id)) {
			return;
		}
		const { data, suspense: suspense } = useDictsDict({ id });
		await suspense();
		const dataObject = data.value?._embedded._.find((obj) => obj.note === "all entries");
		if (dataObject === undefined) {
			return;
		}
		const fieldSelect = dictDataExtra.fieldSelect.get(id); // TODO: this is obsolete, and is inserted here temporarily
		if (fieldSelect === undefined) {
			return;
		}
		const specChars = dictDataExtra.specChars.get(id); // TODO: this is obsolete, and is inserted here temporarily
		if (specChars === undefined) {
			return;
		}
		const dict: Zod.infer<typeof Dict> = {
			id,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			queryTemplates: dataObject.queryTemplates,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			dbNames: dataObject.dbNames,
			fieldSelect,
			specChars,
		};
		return dict;
	};

	return {
		initialize,
		getDictById,
	};
});
