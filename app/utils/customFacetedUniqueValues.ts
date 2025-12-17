import { memo, type Table } from "@tanstack/vue-table";

const customFacetedUniqueValues = (table: Table<never>, columnId: string) => {
	return memo(
		() => [table.getColumn(columnId)?.getFacetedRowModel()],
		(facetedRowModel) => {
			if (!facetedRowModel) return new Map();

			const facetedUniqueValues = new Map<unknown, number>();

			for (const row of facetedRowModel.flatRows) {
				const values = row.getUniqueValues<number>(columnId);

				for (const val of values) {
					let wrappedValue = [val];
					if (Array.isArray(val)) {
						wrappedValue = val;
					}
					for (const value of wrappedValue) {
						if (facetedUniqueValues.has(value)) {
							facetedUniqueValues.set(value, (facetedUniqueValues.get(value) ?? 0) + 1);
						} else {
							facetedUniqueValues.set(value, 1);
						}
					}
				}
			}

			return facetedUniqueValues;
		},
		{
			key: `getFacetedUniqueValues_${columnId}`,
		},
	);
};

export default customFacetedUniqueValues;
