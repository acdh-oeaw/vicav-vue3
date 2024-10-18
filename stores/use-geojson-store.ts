import type { Table } from "@tanstack/vue-table";

import type { FeatureType } from "@/types/global";

export const useGeojsonStore = defineStore("geojson", () => {
	const tables = ref<Map<string, Table<FeatureType>>>(new Map());
	return {
		tables,
	};
});
