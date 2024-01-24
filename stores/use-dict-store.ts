import { Dict, type DictType } from "@/types/global.d";

export type DictRegistry = Map<DictType["id"], DictType>;

export const useDictStore = defineStore("dict", () => {
	const { data, suspense } = useDicts();
	const registry = computed(() => {
		const newRegistry = ref<DictRegistry>(new Map());
		const dicts: Array<object> | undefined = data.value?._embedded.dicts;
		if (dicts !== undefined) {
			dicts.forEach((d) => {
				const dictParse = Dict.safeParse({
					id: d.name as string,
				});
				if (dictParse.success) {
					newRegistry.value.set(dictParse.data.id, dictParse.data);
				}
			});
		}
		return newRegistry;
	});

	return {
		registry,
		suspense,
	};
});
