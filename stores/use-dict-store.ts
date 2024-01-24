import { Dict, type DictId, type DictType } from "@/types/global.d";

type DictIndex = Set<DictId>;

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
				const dictParse = Dict.safeParse({
					id: d.name as string,
				});
				if (dictParse.success) {
					newDictIndex.add(dictParse.data.id);
				}
			});
		}
		return newDictIndex;
	});

	const getDictById = async (id: DictId) => {
		if (!dictIndex.value.has(id)) {
			return;
		}
		const { data, suspense: suspense } = useDictsDict({ id });
		await suspense();
		const dataObject = data.value?._embedded._.find((obj) => obj.note === "all entries");
		if (dataObject === undefined) {
			return;
		}
		const dict: DictType = {
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
