import type { Column, RowModel } from "@tanstack/vue-table";

interface CombinedFilter {
	combinedValue: string;
	filterValues: Array<string>;
	count: number;
}

const AND_OPERATOR = "AND";

function getCombinedFilterOption(
	column: Column<unknown>,
	rowModel: RowModel<unknown>,
	items: Array<string>,
) {
	const count = rowModel.flatRows.filter((row) =>
		items.every((i) => {
			const rowValue: Array<string> = row.getValue(column.id);
			return rowValue.includes(i);
		}),
	).length;
	return {
		combinedValue: items.join(AND_OPERATOR),
		filterValues: items,
		count: count,
	};
}

export function useAdvancedQueries() {
	return {
		AND_OPERATOR,
		getCombinedFilterOption,
	} as const;
}

export type { CombinedFilter };
