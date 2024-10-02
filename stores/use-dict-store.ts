import { Dict } from "@/types/global.d";

type DictIndex = Set<Zod.infer<typeof Dict>["id"]>;

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

		const dataObject = data.value!._embedded._.find(
			//eslint-disable-next-line  @typescript-eslint/no-explicit-any
			(obj) => (obj as Record<string, any>).note === "all entries",
		);
		if (dataObject === undefined) {
			return;
		}

		if (dataObject.specialCharacters === undefined) {
			throw new Error("Missing virtual keyboard definition!");
		}

		const dict: Zod.infer<typeof Dict> = {
			id,
			//TODO refine response types in API definition
			queryTemplates: new Map(dataObject.queryTemplates!.map((e) => [e, e])),
			dbNames: dataObject.dbNames!,
			specialCharacters: dataObject.specialCharacters,
		};
		return dict;
	};

	return {
		initialize,
		getDictById,
	};
});
