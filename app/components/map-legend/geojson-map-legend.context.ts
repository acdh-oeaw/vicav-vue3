import type { FeatureValueGroupInterface } from "@/stores/use-marker-store.ts";
import type { FeatureValueGroupMember } from "@/types/global.ts";

export interface LegendEntry {
	columnId: string;
	featureLabel: string;
	key: string;
	parts: Array<string>;
	count?: number;
	markerId: string;
}

export interface LegendGroup {
	group: FeatureValueGroupInterface;
	entries: Array<LegendEntry>;
	rowCount: number;
	crossFeature: boolean;
}

export const LEGEND_SORTABLE_GROUP = "legend";

export function legendMemberKey(columnId: string, key: string) {
	return JSON.stringify([columnId, key]);
}

export function toGroupMember(entry: LegendEntry): FeatureValueGroupMember {
	return { columnId: entry.columnId, value: entry.key };
}
