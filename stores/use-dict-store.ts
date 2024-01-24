import { Dict } from "@/types/global.d";

type DictIndex = Set<Zod.infer<typeof Dict>["id"]>;

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
		const dict: Zod.infer<typeof Dict> = {
			id,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			queryTemplates: dataObject.queryTemplates,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			dbNames: dataObject.dbNames,
		};
		return dict;
	};

	return {
		initialize,
		getDictById,
	};
});
