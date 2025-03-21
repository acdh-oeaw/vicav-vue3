<script lang="ts" setup>
import {
	type AccessorColumnDef,
	type CellContext,
	type ColumnDef,
	createColumnHelper,
	type GroupColumnDef,
	type Row,
	type Table,
} from "@tanstack/vue-table";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import type { FeatureType, MarkerType } from "@/types/global";

const GeojsonStore = useGeojsonStore();
const { addWindow, findWindowByTypeAndParam } = useWindowsStore();
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

const { isPending } = GeojsonStore.fetchGeojson(url);
const { fetchedData, tables } = storeToRefs(GeojsonStore);
const { data: projectData } = useProjectInfo();
const columnHelper = createColumnHelper<FeatureType>();
const { AND_OPERATOR } = useAdvancedQueries();

interface SimpleColumnInterface {
	id: string;
	header: string;
	columns: Array<AccessorColumnDef<FeatureType> | GroupColumnDef<FeatureType>>;
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
	let columns: Array<AccessorColumnDef<FeatureType> | GroupColumnDef<FeatureType>> = [];
	columns = columns.concat(
		allFeatureNames
			.filter((heading) => heading.category === col.id)
			.map((heading) => {
				const accessorFn = (cell: FeatureType) => {
					return Object.keys(
						cell.properties[String(Object.keys(heading).find((key) => /ft_*/.test(key)) ?? "")] ??
							{},
					);
				};
				return columnHelper.accessor(accessorFn, {
					id: Object.keys(heading).find((key) => /ft_*/.test(key)) ?? "",
					header: heading[Object.keys(heading).find((key) => /ft_*/.test(key)) ?? ""],
					cell: (cell: CellContext<FeatureType, unknown>) => {
						return h(resolveComponent("GeojsonTablePropertyCell"), {
							value: cell.row.original.properties[cell.column.columnDef.id!],
						});
					},
					filterFn: (row, columnId, filterValue: Map<string, unknown>) => {
						if (!row.getVisibleCells().find((cell) => cell.column.id === columnId)) {
							return true;
						}
						if (filterValue.size === 0) return true;
						const filter = [...filterValue.keys()].some((val) => {
							if (val.includes(AND_OPERATOR)) {
								return val
									.split(AND_OPERATOR)
									.every((v) => (row.getValue(columnId) as Array<string>).includes(v));
							} else return (row.getValue(columnId) as Array<string>).includes(val);
						});
						return filter;
					},
					enableGlobalFilter: true,
				}) as AccessorColumnDef<FeatureType>;
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
				) as GroupColumnDef<FeatureType>;
			})
			.filter((col) => (col.columns?.length ?? 0) > 0),
	);

	return { ...col, columns: columns };
}

const columns = computed(() => {
	const allFeatureNames = fetchedData.value.get(url)?.properties.column_headings;

	const featureCategories = projectData.value!.projectConfig?.staticData?.table?.[1] as Record<
		string,
		string
	>;

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
			subcategoryColumns = buildColumnDefRecursive(
				col,
				featureCategories,
				allFeatureNames!,
			).columns;
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
								cell: ({ cell }: CellContext<FeatureType, never>) => {
									return h(
										"span",
										{ class: "max-w-[500px] truncate font-medium" },
										cell.row.original.properties[cell.column.columnDef.id!],
									);
								},
								accessorFn: (cell: FeatureType) => {
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
});
const columnVisibility = computed(() => {
	const columnHeadings = fetchedData.value.get(url)?.properties.column_headings ?? [];
	return Object.fromEntries(
		columnHeadings?.map((heading) => [Object.keys(heading).find((key) => /ft_*/.test(key)), false]),
	);
});

function filterEmptyRows(row: Row<never>) {
	const hidableVisibleCells = row.getVisibleCells().filter((cell) => cell.column.getCanHide());
	if (hidableVisibleCells.length === 0) return true;
	if (
		hidableVisibleCells.some((cell) => !cell.getValue() || (cell.getValue() as string).length > 0)
	)
		return true;
	return false;
}

function applyGlobalFilter(table: Table<FeatureType>) {
	// re-apply global filter to remove empty lines from the table
	// table.resetGlobalFilter(true);
	table.setGlobalFilter(true);
}

const { addColor } = useColorsStore();
const { colors } = storeToRefs(useColorsStore());
function onVisibilityChange(props: { table: Table<FeatureType>; col: Record<string, boolean> }) {
	applyGlobalFilter(props.table);
	const changedColumnKey = Object.keys(props.col)[0]!;
	const visibilityValue = props.col[changedColumnKey]!;
	if (visibilityValue && !colors.value.has(changedColumnKey)) addColor(changedColumnKey);
}
function registerTable(table: Table<FeatureType>) {
	tables.value.set(url, table);
	const mw = findWindowByTypeAndParam("GeojsonMap", "url", url);
	if (mw) {
		mw.winbox.focus();
		mw.winbox.addClass("highlighted");
		setTimeout(() => {
			mw.winbox.removeClass("highlighted");
		}, 1000);
	} else {
		addWindow({
			targetType: "GeojsonMap",
			params: {
				url,
				markerType: "petal" as MarkerType,
			},
			title: "Variety Data - Map View",
		});
	}
}
</script>

<template>
	<div>
		<Centered v-if="isPending">
			<LoadingIndicator />
		</Centered>
		<div class="flex justify-between justify-items-end py-2">
			<DataTablePagination
				v-if="tables.get(url)"
				:table="tables.get(url) as unknown as Table<never>"
			/>
			<div class="flex gap-2">
				<DataTableActiveFilters
					v-if="tables.get(url)"
					class="inline"
					:table="tables.get(url) as unknown as Table<never>"
				></DataTableActiveFilters>
				<DataTableFilterColumns
					v-if="tables.get(url)"
					class="inline"
					:table="tables.get(url) as unknown as Table<never>"
				/>
			</div>
		</div>
		<DataTable
			v-if="!isPending"
			:columns="columns as unknown as Array<ColumnDef<never>>"
			:enable-filter-on-columns="true"
			:global-filter-fn="filterEmptyRows"
			:initial-column-visibility="columnVisibility"
			:items="fetchedData.get(url)?.features as Array<never>"
			:min-header-depth="2"
			:visibility-change-fn="onVisibilityChange"
			@table-ready="registerTable"
		></DataTable>
		<div class="grid justify-items-end py-2">
			<DataTablePagination
				v-if="tables.get(url)"
				:table="tables.get(url) as unknown as Table<never>"
			/>
		</div>
	</div>
</template>
