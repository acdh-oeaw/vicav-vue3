import type { JsonObject } from "type-fest";

import { deepGet } from "./deepGet";
import { orderByGroup } from "./orderByGroup";

// Four grouping levels: country, region, place, dataType

type groupedByL4 = Record<string, Array<JsonObject>>;
type groupedByL3 = Record<string, groupedByL4>;
type groupedByL2 = Record<string, groupedByL3>;
type groupedByL1 = Record<string, groupedByL2>;
type GroupedTypes = groupedByL1 | groupedByL2 | groupedByL3 | groupedByL4;

// getGroupedItems(simpleItems.value, ["place.country", "place.region", "place.settlement", "dataType"], "dataType", ["CorpusText"], "label", {key: "@hasTEIw", value: "true"})
export function getGroupedItems(
	items: Array<JsonObject>,
	levelProperties: [string, string, string, string],
	dataTypeProperty: string,
	allowedDataTypes: Array<string>,
	sortProperty: string,
	filterListBy?: { key: string; value: string },
) {
	// Group by L1
	const collectedItems = items
		.filter((item) => {
			const dataType = deepGet(item, dataTypeProperty, ""),
				isAllowedDataType = allowedDataTypes.includes(typeof dataType !== "string" ? "" : dataType),
				filterByIsTrue =
					filterListBy === undefined || deepGet(item, filterListBy.key, "") === filterListBy.value;
			if (typeof dataType !== "string") return false;
			return isAllowedDataType && filterByIsTrue;
		})
		.sort((a, b) => {
			const aLabel = deepGet(a, sortProperty, ""),
				bLabel = deepGet(b, sortProperty, "");
			if (aLabel && bLabel && typeof aLabel === "string" && typeof bLabel === "string") {
				return aLabel.localeCompare(bLabel);
			}
			return 0;
		});

	const grouped = Object.groupBy(collectedItems, (item: JsonObject) => {
		const L1 = deepGet(item, levelProperties[0], "");
		if (typeof L1 !== "string") return "";
		return L1;
	}) as GroupedTypes;

	// Group by L2
	for (const L1 in grouped as groupedByL4) {
		(grouped as groupedByL3)[L1] = orderByGroup(
			Object.groupBy((grouped as groupedByL4)[L1]!, (item: JsonObject) => {
				const L2 = deepGet(item, levelProperties[1], "");
				if (typeof L2 !== "string") return "";
				return L2;
			}),
		);

		// Group by L3
		for (const L2 in (grouped as groupedByL3)[L1]) {
			(grouped as groupedByL2)[L1]![L2] = orderByGroup(
				Object.groupBy((grouped as groupedByL3)[L1]![L2] ?? [], (item: JsonObject) => {
					const L3 = deepGet(item, levelProperties[2], "");
					if (typeof L3 !== "string") return "";
					return L3;
				}),
			);

			// Group by L4

			for (const L3 in (grouped as groupedByL2)[L1]![L2]) {
				(grouped as groupedByL1)[L1]![L2]![L3] = Object.groupBy(
					(grouped as groupedByL2)[L1]![L2]![L3] ?? [],
					(item) => {
						const L4 = deepGet(item, levelProperties[3], "");
						if (typeof L4 !== "string") return "";
						return L4;
					},
				);

				for (const L4 in (grouped as groupedByL1)[L1]![L2]![L3]!) {
					(grouped as groupedByL1)[L1]![L2]![L3]![L4] = (grouped as groupedByL1)[L1]![L2]![L3]![
						L4
					]!.sort((a, b) => {
						const aLabel = deepGet(a, sortProperty, ""),
							bLabel = deepGet(b, sortProperty, "");
						if (aLabel && bLabel && typeof aLabel === "string" && typeof bLabel === "string") {
							return aLabel.localeCompare(bLabel);
						}
						return 0;
					});
				}
			}
		}
	}

	return grouped as groupedByL1;
}
