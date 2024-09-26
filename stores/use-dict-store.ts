import { Dict } from "@/types/global.d";

type DictIndex = Set<Zod.infer<typeof Dict>["id"]>;

const dictDataExtra = {
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
		//TODO: refine response types in API definition
		//eslint-disable-next-line  @typescript-eslint/no-explicit-any
		const dicts: Array<Record<string, any>> | undefined = dictData.value?._embedded.dicts;
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
		//TODO: refine response types in API definition
		//eslint-disable-next-line  @typescript-eslint/no-explicit-any
		const dataObject: Record<string, any> | undefined = data.value!._embedded._.find(
			//eslint-disable-next-line  @typescript-eslint/no-explicit-any
			(obj) => (obj as Record<string, any>).note === "all entries",
		);
		if (dataObject === undefined) {
			return;
		}
		const specChars = dictDataExtra.specChars.get(id); // TODO: this is obsolete, and is inserted here temporarily
		if (specChars === undefined) {
			return;
		}
		const dict: Zod.infer<typeof Dict> = {
			id,
			//TODO refine response types in API definition
			queryTemplates: new Map((dataObject.queryTemplates as Array<string>).map((e) => [e, e])),
			dbNames: dataObject.dbNames as Array<string>,
			specChars,
		};
		return dict;
	};

	return {
		initialize,
		getDictById,
	};
});
