import { computed } from "vue";
import * as z from "zod";

import type { TeiCorpus } from "@/lib/api-client";

const TeiCorpusSchema = z.fromJSONSchema(useOpenapiSchema("TeiCorpus")!) as z.ZodType<TeiCorpus>;

export const useTeiHeadersStore = defineStore("use-tei-headers-store", () => {
	const { data: projectData, suspense } = useProjectInfo();

	const initialize = async () => {
		await suspense();
	};

	const rawItems = computed(() => {
		const parsedItems: Array<TeiCorpus> = [];
		(projectData.value?.projectConfig?.staticData?.table ?? []).forEach((item) => {
			const parsedItem = TeiCorpusSchema.safeParse(item);
			if (parsedItem.success) {
				parsedItems.push(parsedItem.data);
			} else {
				console.log(parsedItem.error);
			}
		});
		return parsedItems;
	});

	return {
		initialize,
		rawItems,
	};
});
