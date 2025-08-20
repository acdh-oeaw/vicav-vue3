import {
	type AccessorColumnDef,
	type CellContext,
	createColumnHelper,
	type GroupColumnDef,
} from "@tanstack/vue-table";

import geojsonTablePropertyCell from "@/components/geojson-table-property-cell.vue";
import Button from "@/components/ui/button/Button.vue";
import type { FeatureType, WindowItem } from "@/types/global";

export interface PatchedFeatureType extends FeatureType {
	properties: Record<string, Record<string, unknown>>;
}

const columnHelper = createColumnHelper<PatchedFeatureType>();

interface SimpleColumnInterface {
	id: string;
	header: string;
	columns: Array<AccessorColumnDef<PatchedFeatureType> | GroupColumnDef<PatchedFeatureType>>;
	enableHiding?: boolean;
}

function buildColumnDefRecursive(
	col: SimpleColumnInterface,
	featureCategories: Record<string, string>,
	allFeatureNames: Array<Record<string, string>>,
): SimpleColumnInterface {
	const subCategories = Object.entries(featureCategories).filter(
		([categoryName, _]) =>
			categoryName.startsWith(col.id) && categoryName.lastIndexOf(".") === col.id.length,
	);
	let columns: Array<AccessorColumnDef<PatchedFeatureType> | GroupColumnDef<PatchedFeatureType>> =
		[];
	columns = columns.concat(
		allFeatureNames
			.filter((heading) => heading.category === col.id)
			.map((heading) => {
				const accessorFn = (cell: PatchedFeatureType) => {
					return Object.keys(
						cell.properties[String(Object.keys(heading).find((key) => /ft_*/.test(key)) ?? "")] ??
							{},
					);
				};
				return columnHelper.accessor(accessorFn, {
					id: Object.keys(heading).find((key) => /ft_*/.test(key)) ?? "",
					header: heading[Object.keys(heading).find((key) => /ft_*/.test(key)) ?? ""],
					cell: (cell: CellContext<PatchedFeatureType, unknown>) => {
						const highlightedValues = [
							...(cell.column.getFilterValue() as Map<string, unknown>).keys(),
						];
						return h(geojsonTablePropertyCell, {
							value: cell.row.original.properties[cell.column.columnDef.id!],
							highlightedValues: highlightedValues,
							column: cell.column,
							fullEntry: cell.row.original.properties,
						});
					},
					filterFn: (row, columnId, _filterValue: Map<string, unknown>) => {
						if (!row.getVisibleCells().find((cell) => cell.column.id === columnId)) {
							return true;
						}
						return true;
					},
					enableGlobalFilter: true,
				}) as AccessorColumnDef<PatchedFeatureType>;
			}),
	);

	columns = columns.concat(
		subCategories
			.map(([categoryName, categoryLabel]) => {
				return columnHelper.group(
					buildColumnDefRecursive(
						{
							header: featureCategories[categoryName] ?? categoryLabel,
							id: String(categoryName),
							columns: [],
						},
						featureCategories,
						allFeatureNames,
					),
				) as GroupColumnDef<PatchedFeatureType>;
			})
			.filter((col) => (col.columns?.length ?? 0) > 0),
	);

	return { ...col, columns: columns };
}

function createColumnDefs(
	featureCategories: Record<string, string>,
	allFeatureNames: Array<Record<string, string>>,
) {
	const openOrUpdateWindow = useOpenOrUpdateWindow();
	const topLevelColumns: Array<SimpleColumnInterface> = [
		{
			id: "-",
			header: "-",
			enableHiding: false,
			columns: [],
		},
		...[
			...new Set(Object.keys(featureCategories).map((categoryName) => categoryName.split(".")[0]!)),
		].map((categoryName) => {
			return {
				header: featureCategories[categoryName] ?? categoryName,
				id: categoryName,
				columns: [],
			};
		}),
	];

	topLevelColumns.forEach((col) => {
		let subcategoryColumns;
		if (col.header !== "-") {
			subcategoryColumns = buildColumnDefRecursive(col, featureCategories, allFeatureNames).columns;
		} else {
			subcategoryColumns = [
				columnHelper.group({
					header: "-",
					id: "-",
					enableHiding: false,
					//@ts-expect-error type mismatch in accessorFn
					columns: allFeatureNames
						.filter((heading) => !heading.category)
						.map((heading) => {
							return {
								id: Object.keys(heading)[0],
								header: Object.values(heading)[0],
								enableHiding: false,
								cell: ({ cell }: CellContext<PatchedFeatureType, never>) => {
									return h(
										Button,
										{
											class: "max-w-[500px] truncate font-medium cursor-pointer text-black",
											variant: "link",
											onclick: () => {
												openOrUpdateWindow(
													{
														targetType: "Location",
														params: cell.row,
													} as unknown as WindowItem,
													cell.row.original.properties.name as unknown as string,
												);
											},
										},
										() => cell.row.original.properties[cell.column.columnDef.id!],
									);
								},
								accessorFn: (cell: PatchedFeatureType) => {
									return cell.properties[String(Object.keys(heading)[0])];
								},
								enableColumnFilter: false,
								enableGlobalFilter: true,
							};
						}),
				}),
			];
		}
		col.columns = subcategoryColumns;
	});
	const groupedColumns = topLevelColumns
		// .filter((col) => col.columns.some((col) => (col.columns?.length ?? -1) > 0))
		.map((col) => columnHelper.group(col))
		.sort((a, b) => String(a.header).localeCompare(String(b.header)));
	return groupedColumns;
}

export function useColumnGeneration() {
	return { createColumnDefs };
}
