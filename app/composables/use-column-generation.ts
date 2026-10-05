import {
	type AccessorColumnDef,
	type CellContext,
	createColumnHelper,
	type GroupColumnDef,
} from "@tanstack/vue-table";

import geojsonTablePropertyCell from "@/components/geojson-table-property-cell.vue";
import GeojsonTableSimpleCell from "@/components/geojson-table-simple-cell.vue";
import {
	buildFeatureTaxonomyTree,
	type FeatureHeading,
	type FeatureTaxonomyCategory,
	type FeatureTaxonomyFeature,
} from "@/composables/use-feature-taxonomy.ts";
import type { FeatureType } from "@/types/global.ts";

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

function buildFeatureColumnDef(
	feature: FeatureTaxonomyFeature,
): AccessorColumnDef<PatchedFeatureType> {
	const accessorFn = (cell: PatchedFeatureType) => {
		const value = cell.properties[feature.id] ?? {};
		if (typeof value === "string") {
			return [value];
		}
		return Object.keys(value);
	};
	return columnHelper.accessor(accessorFn, {
		id: feature.id,
		header: feature.label,
		cell: (cell: CellContext<PatchedFeatureType, unknown>) => {
			const highlightedValues = [...(cell.column.getFilterValue() as Map<string, unknown>).keys()];
			let value = cell.row.original.properties[cell.column.columnDef.id!];
			if (typeof value === "string") value = { [value]: [{}] };
			return h(geojsonTablePropertyCell, {
				value,
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
}

function buildCategoryColumns(
	category: FeatureTaxonomyCategory,
): Array<AccessorColumnDef<PatchedFeatureType> | GroupColumnDef<PatchedFeatureType>> {
	return [
		...category.features.map(buildFeatureColumnDef),
		...category.children.map(
			(child) =>
				columnHelper.group({
					header: child.label,
					id: child.path,
					columns: buildCategoryColumns(child),
				}) as GroupColumnDef<PatchedFeatureType>,
		),
	];
}

function createColumnDefs(
	featureCategories: Record<string, string>,
	allFeatureNames: Array<FeatureHeading>,
) {
	const taxonomy = buildFeatureTaxonomyTree(featureCategories, allFeatureNames);
	/** Headings that are not features, e.g. the name of a variety. */
	const uncategorizedColumns = columnHelper.group({
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
						return h(GeojsonTableSimpleCell, {
							cell: cell,
							valuePrimary: cell.row.original.properties[cell.column.columnDef.id!] ?? "",
							valueSecondary:
								cell.column.id === "name"
									? (
											cell.row.original.properties.alternateNames as unknown as
												| Array<Record<string, string>>
												| undefined
										)
											?.map((nameEntry) => nameEntry.name!)
											.join(" / ")
									: undefined,
						});
					},
					accessorFn: (cell: PatchedFeatureType) => {
						return cell.properties[String(Object.keys(heading)[0])];
					},
					enableColumnFilter: false,
					enableGlobalFilter: true,
				};
			}),
	});
	const topLevelColumns: Array<SimpleColumnInterface> = [
		{
			id: "-",
			header: "-",
			enableHiding: false,
			columns: [uncategorizedColumns],
		},
		...taxonomy.map((category) => {
			return {
				header: category.label,
				id: category.path,
				columns: buildCategoryColumns(category),
			};
		}),
	];

	const groupedColumns = topLevelColumns
		// .filter((col) => col.columns.some((col) => (col.columns?.length ?? -1) > 0))
		.map((col) => columnHelper.group(col));
	// .sort((a, b) => String(a.header).localeCompare(String(b.header)));
	return [
		...groupedColumns.filter(
			(c) => !["traditional_classification", "country"].includes(c.id ?? ""),
		),
		...groupedColumns.filter((c) => ["traditional_classification", "country"].includes(c.id ?? "")),
	];
}

export function useColumnGeneration() {
	return { createColumnDefs };
}
