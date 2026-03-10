import type { Table } from "@tanstack/vue-table";
import {
	type LiqeQuery,
	type LogicalExpressionToken,
	parse as liqe_parse,
	SyntaxError,
	type TagToken,
	type UnaryOperatorToken,
} from "liqe";
import { storeToRefs } from "pinia";

import { useGeojsonStore } from "../stores/use-geojson-store";

const { AND_OPERATOR } = useAdvancedQueries();

function normalizeOperators(input: string): string {
	// Only replace AND/OR/NOT outside of quoted values
	return input
		.split(/(".*?")/)
		.map((part, i) =>
			i % 2 === 0 ? part.replace(/\b(?:and|or|not)\b/gi, (op) => op.toUpperCase()) : part,
		)
		.join("");
}

function normalizeQuantifiers(input: string): string {
	return input.replaceAll(":ANY", ":*");
}

function parse(query: string) {
	let normalized = normalizeOperators(query);
	normalized = normalizeQuantifiers(normalized);
	return liqe_parse(normalized);
}

function getNormalizedAST(input: LiqeQuery | string): LiqeQuery {
	const ast = typeof input === "string" ? parse(input) : input;
	return normalizeASTtoDNF(ast);
}

function getAllColumnValues(table: Table<unknown>, columnId: string): Array<string> {
	return [
		...new Set<string>(table.getCoreRowModel().flatRows.flatMap((row) => row.getValue(columnId))),
	];
}

function ensureColumnFilterMap(
	table: Table<unknown>,
	columnId: string,
):
	| { column: ReturnType<Table<unknown>["getColumn"]>; filterValue: Map<string, unknown> }
	| undefined {
	const col = table.getColumn(columnId);
	if (!col) return undefined;
	col.toggleVisibility(true);
	if (!col.getFilterValue()) col.setFilterValue(new Map<string, unknown>());
	const filterValue = col.getFilterValue() as Map<string, unknown> | undefined;
	return { column: col, filterValue: filterValue ?? new Map<string, unknown>() };
}

function parseSearchString(searchString: string, table: Table<unknown>) {
	const ast = parse(searchString);

	table.resetColumnFilters();
	table.resetColumnVisibility();
	traverseASTandApplyFilter(ast, table);
}

function setColumnFilter(columnId: string, value: string, table: Table<unknown>) {
	const ensured = ensureColumnFilterMap(table, columnId);
	if (!ensured) return;
	const { filterValue } = ensured;
	const { featureValueTaxonomy } = storeToRefs(useGeojsonStore());

	if (value === "*") {
		const allColValues = getAllColumnValues(table, columnId);
		allColValues.forEach((val) => filterValue.set(val, 1));
	} else {
		let isTaxonomyEntry = false;
		value.split(AND_OPERATOR).forEach((part) => {
			const taxonomyMatches = [...featureValueTaxonomy.value.entries()]
				.filter(
					([_key, val]) =>
						(val?.taxonomy.startsWith(columnId) ?? false) ||
						(val?.taxonomy === "" && _key.startsWith(`${columnId}.`)),
				)
				.filter(([_key, val]) => val?.taxonomy.endsWith(`.${part}`));
			if (taxonomyMatches.length > 0) {
				taxonomyMatches.forEach((match) => {
					filterValue.set(match[0].replace(`${columnId}.`, ""), 1);
				});
				filterValue.set(part, 1);
				isTaxonomyEntry = true;
			} else if (!value.includes(AND_OPERATOR)) {
				filterValue.set(part, 1);
			}
		});
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!isTaxonomyEntry) filterValue?.set(value, 1);
	}

	// ensureColumnFilterMap already ensured column and initial filter map
	ensured.column!.setFilterValue(filterValue);
}

function getColumnAndValueFromTagExpression(ast: TagToken) {
	if (!("name" in ast.field) || !("value" in ast.expression) || !ast.expression.value) {
		return {};
	}
	return { column: ast.field.name, value: String(ast.expression.value) };
}

// helper type for a leaf node
interface FilterLeaf {
	column: string;
	value: string;
	negated?: boolean;
}

// generator that yields leaves without building intermediate arrays
function* iterateLeaves(ast: LiqeQuery): Generator<FilterLeaf> {
	switch (ast.type) {
		case "Tag": {
			const { column, value } = getColumnAndValueFromTagExpression(ast);
			if (column && value) yield { column, value };
			return;
		}
		case "LogicalExpression": {
			if (ast.operator.operator === "OR") {
				yield* iterateLeaves(ast.left);
				yield* iterateLeaves(ast.right);
			} else {
				// AND expression: we need to look at both sides to decide whether
				// to merge values or emit separately.  collect first leaf of each
				// branch; this is typically small.
				const leftLeaves: Array<FilterLeaf> = [...iterateLeaves(ast.left)];
				const rightLeaves: Array<FilterLeaf> = [...iterateLeaves(ast.right)];

				if (leftLeaves.length === 0 || rightLeaves.length === 0) return;
				const l0 = leftLeaves[0]!;
				const r0 = rightLeaves[0]!;
				if (l0.column !== r0.column) {
					for (const l of leftLeaves) yield l;
					for (const r of rightLeaves) yield r;
				} else {
					yield { column: l0.column, value: [l0.value, r0.value].join(AND_OPERATOR) };
				}
			}
			return;
		}
		case "ParenthesizedExpression": {
			yield* iterateLeaves(ast.expression);
			return;
		}
		case "UnaryOperator": {
			yield* iterateLeaves(ast.operand);
			return;
		}
		case "EmptyExpression":
		default:
			return;
	}
}

function collectLeavesAsArray(ast: LiqeQuery): Array<FilterLeaf> {
	return [...iterateLeaves(ast)];
}

function traverseASTandApplyFilter(ast: LiqeQuery, table: Table<unknown>) {
	for (const { column, value } of iterateLeaves(getNormalizedAST(ast))) {
		setColumnFilter(column, value, table);
	}
}

function constructLogicalExpression(
	operator: "AND" | "OR",
	left: LiqeQuery,
	right: LiqeQuery,
): LogicalExpressionToken {
	return {
		type: "LogicalExpression",
		operator: {
			type: "BooleanOperator",
			operator: operator,
			location: { start: left.location.end + 1, end: right.location.start - 1 },
		},
		left: left,
		right: right,
		location: { start: left.location.start, end: right.location.end },
	};
}

function constructNegatedExpression(ast: LiqeQuery): UnaryOperatorToken {
	return {
		type: "UnaryOperator",
		operator: "NOT",
		operand: ast,
		location: ast.location,
	};
}

function unwrapParenthesizedExpression(ast: LiqeQuery): LiqeQuery {
	if (ast.type === "ParenthesizedExpression") {
		return unwrapParenthesizedExpression(ast.expression);
	}
	return ast;
}

function normalizeASTtoDNF(ast: LiqeQuery): LiqeQuery {
	switch (ast.type) {
		case "Tag": {
			return ast;
		}
		case "ParenthesizedExpression": {
			return { ...ast, expression: normalizeASTtoDNF(ast.expression) };
		}
		case "LogicalExpression": {
			if (ast.operator.operator === "AND") {
				const left = normalizeASTtoDNF(ast.left);
				const right = normalizeASTtoDNF(ast.right);
				if (left.type === "EmptyExpression" || right.type === "EmptyExpression") {
					return ast;
				}
				const unwrappedLeft = unwrapParenthesizedExpression(left);
				const unwrappedRight = unwrapParenthesizedExpression(right);
				if (
					"operator" in unwrappedLeft &&
					typeof unwrappedLeft.operator !== "string" &&
					unwrappedLeft.operator.operator === "OR"
				) {
					const newLeft = normalizeASTtoDNF(
						constructLogicalExpression("AND", unwrappedLeft.left!, right),
					);
					const newRight = normalizeASTtoDNF(
						constructLogicalExpression("AND", unwrappedLeft.right!, right),
					);
					return constructLogicalExpression("OR", newLeft, newRight);
				}
				if (
					"operator" in unwrappedRight &&
					typeof unwrappedRight.operator !== "string" &&
					unwrappedRight.operator.operator === "OR"
				) {
					const newLeft = normalizeASTtoDNF(
						constructLogicalExpression("AND", left, unwrappedRight.left!),
					);
					const newRight = normalizeASTtoDNF(
						constructLogicalExpression("AND", left, unwrappedRight.right!),
					);
					return constructLogicalExpression("OR", newLeft, newRight);
				}
				return constructLogicalExpression("AND", left, right);
			}
			// if ast.operator.operator === "OR":
			else {
				return constructLogicalExpression(
					"OR",
					normalizeASTtoDNF(ast.left),
					normalizeASTtoDNF(ast.right),
				);
			}
		}
		case "UnaryOperator": {
			if (ast.operand.type === "Tag") return ast;
			if (
				ast.operand.type === "ParenthesizedExpression" &&
				ast.operand.expression.type === "LogicalExpression"
			) {
				const operator = ast.operand.expression.operator.operator;
				const newLeft = constructNegatedExpression(ast.operand.expression.left);
				const newRight = constructNegatedExpression(ast.operand.expression.right);
				return normalizeASTtoDNF(
					constructLogicalExpression(operator === "OR" ? "AND" : "OR", newLeft, newRight),
				);
			}
			return ast;
		}
		case "EmptyExpression":
		default: {
			return ast;
		}
	}
}

function isEqual(a: LiqeQuery, b: LiqeQuery): boolean {
	if (a.type !== b.type) return false;
	if (a.type === "Tag" && b.type === "Tag") {
		const { column: colA, value: valA } = getColumnAndValueFromTagExpression(a);
		const { column: colB, value: valB } = getColumnAndValueFromTagExpression(b);
		return colA === colB && valA === valB;
	}
	if (a.type === "LogicalExpression" && b.type === "LogicalExpression") {
		return (
			a.operator.operator === b.operator.operator &&
			((isEqual(a.left, b.left) && isEqual(a.right, b.right)) ||
				(isEqual(a.left, b.right) && isEqual(a.right, b.left)))
		);
	}
	return false;
}

function isInQuery(query: LiqeQuery | string, filter: LiqeQuery | string): boolean {
	const ast = getNormalizedAST(query);
	const filterAST = getNormalizedAST(filter);

	if (ast.type === "ParenthesizedExpression") {
		return isInQuery(ast.expression, filterAST);
	}
	if (filterAST.type === "ParenthesizedExpression") {
		return isInQuery(ast, filterAST.expression);
	}

	if (ast.type === "Tag") {
		return isEqual(ast, filterAST);
	}
	if (ast.type === "LogicalExpression") {
		if (isEqual(ast, filterAST)) return true;
		if (ast.operator.operator === "OR") {
			return isInQuery(ast.left, filterAST) || isInQuery(ast.right, filterAST);
		}
		// if (ast.operator.operator === "AND"): should return false for our use case
	}
	return false;
}

function assembleFilter(columnId: string, key: string) {
	let assembledFilter = `${columnId}:"${key}"`;
	if (key.includes(AND_OPERATOR)) {
		assembledFilter = key
			.split(AND_OPERATOR)
			.map((k) => `${columnId}:"${k}"`)
			.join(` ${AND_OPERATOR} `);
		assembledFilter = `(${assembledFilter})`;
	}
	return assembledFilter;
}

function filterASTtoAllowed(ast: LiqeQuery, allowed: Set<string>): LiqeQuery {
	switch (ast.type) {
		case "Tag": {
			const { column, value } = getColumnAndValueFromTagExpression(ast);
			if (column && value && allowed.has(assembleFilter(column, value))) {
				return ast;
			}
			return { type: "EmptyExpression", location: ast.location };
		}
		case "LogicalExpression": {
			if (ast.operator.operator === "OR") {
				const left = filterASTtoAllowed(ast.left, allowed);
				const right = filterASTtoAllowed(ast.right, allowed);
				if (left.type === "EmptyExpression") return right;
				if (right.type === "EmptyExpression") return left;
				return { ...ast, left, right };
			} else {
				// AND: Check if the stringified AND expression is in allowed before pruning children
				const stringified = stringifyAST(ast);
				const stringifiedWithParens = `(${stringified})`;
				if (allowed.has(stringified) || allowed.has(stringifiedWithParens)) {
					return ast;
				}

				const left = filterASTtoAllowed(ast.left, allowed);
				const right = filterASTtoAllowed(ast.right, allowed);
				if (left.type === "EmptyExpression") return right;
				if (right.type === "EmptyExpression") return left;
				return { ...ast, left, right };
			}
		}
		case "ParenthesizedExpression": {
			const expr = filterASTtoAllowed(ast.expression, allowed);
			if (expr.type === "EmptyExpression") return expr;
			return { ...ast, expression: expr };
		}
		case "UnaryOperator": {
			const operand = filterASTtoAllowed(ast.operand, allowed);
			if (operand.type === "EmptyExpression") return operand;
			return { ...ast, operand };
		}
		case "EmptyExpression":
		default:
			return ast;
	}
}

// custom stringification function (instead of liqe.stringify) to better handle parentheses
function stringifyAST(ast: LiqeQuery, parentOp?: "AND" | "OR"): string {
	switch (ast.type) {
		case "Tag": {
			const { column, value } = getColumnAndValueFromTagExpression(ast);
			return column && value ? assembleFilter(column, value) : "";
		}
		case "LogicalExpression": {
			const left = stringifyAST(ast.left, ast.operator.operator);
			const right = stringifyAST(ast.right, ast.operator.operator);
			const op = ast.operator.operator;
			const inner = `${left} ${op} ${right}`;
			// Wrap in parentheses if:
			// - parent is AND (both AND and OR need parens inside AND)
			// - this is AND and parent is OR (AND needs parens to clarify precedence)
			const needsParens = parentOp === "AND" || (parentOp === "OR" && op === "AND");
			return needsParens ? `(${inner})` : inner;
		}
		case "ParenthesizedExpression":
			if (ast.expression.type !== "Tag") return `(${stringifyAST(ast.expression)})`;
			else return stringifyAST(ast.expression);
		case "UnaryOperator":
			return `NOT ${stringifyAST(ast.operand)}`;
		case "EmptyExpression":
		default:
			return "";
	}
}

function matchQueryStringAndFilters(query: string, filters: Array<string>) {
	const normalizedAST = getNormalizedAST(query);

	// compute intersection of query leaves and filters by pruning the AST
	const allowed = new Set(filters);
	const pruned = filterASTtoAllowed(normalizedAST, allowed);
	const filteredQueryString = stringifyAST(pruned);

	if (filters.length === 0) return filteredQueryString.trim();

	const existingLeaves = new Set<string>();
	for (const leaf of iterateLeaves(normalizedAST)) {
		existingLeaves.add(assembleFilter(leaf.column, leaf.value));
	}

	let result = filteredQueryString.trim();
	for (const filter of filters) {
		if (!existingLeaves.has(filter)) {
			if (result.length > 0) {
				// If result contains a top-level AND and we're adding with OR, wrap it
				if (pruned.type === "LogicalExpression" && pruned.operator.operator === "AND") {
					result = `(${result}) OR ${filter}`;
				} else {
					result = `${result} OR ${filter}`;
				}
			} else {
				result = filter;
			}
		}
	}

	return result.trim();
}
function syncGlobalAndColumnFilters(table: Table<unknown>) {
	const columnFilters = table.getState().columnFilters as Array<{
		id: string;
		value: Map<string, unknown>;
	}>;
	let currentGlobalFilter = String(table.getState().globalFilter ?? "");

	const { getTaxonomyTree } = useGeojsonStore();

	const assembledColumnFilters = columnFilters
		.map((column) => {
			// Check if all values for a specific column are selected
			// if so, remove all featureValues for this column from the query string
			// and return `${column.id}:ANY`
			const allColValues = [
				...new Set(table.getCoreRowModel().flatRows.flatMap((row) => row.getValue(column.id))),
			];
			if (allColValues.every((val) => column.value.has(val as string))) {
				return [
					`${column.id}:ANY `,
					...[...column.value.entries()]
						.filter(([key, _value]) => {
							return !allColValues.includes(key);
						})
						.map(([key, _value]) => {
							return assembleFilter(column.id, key);
						}),
				];
			}

			// Check if all values for a specific taxonomy level within this feature are selected
			// if so, remove all featureValues under this level from the query string and insert the
			// taxonomy name, e.g. `${column.id}:"exceptionalCases"`
			const taxonomyTree = getTaxonomyTree(column.id);
			function allValuesSelected(treeEntry: TaxonomyTreeEntry): boolean {
				return (
					treeEntry.featureValues.length > 0 &&
					treeEntry.featureValues.every((val) => column.value.has(val))
				);
			}
			const replacedFilters: Array<string> = [];
			let removeKeys: Array<string> = [];
			function traverseTree(tree: TaxonomyTree, _parentKey = "") {
				for (const [key, entry] of tree.entries()) {
					if (allValuesSelected(entry)) {
						replacedFilters.push(`${column.id}:"${key}"`);
						removeKeys = removeKeys.concat(entry.featureValues);
					}
					traverseTree(entry.children, key);
				}
			}
			traverseTree(taxonomyTree);

			// Add remaining individual filters
			const remainingFilters = [...column.value.entries()]
				.filter(([key, _value]) => {
					return !removeKeys.includes(key);
				})
				.map(([key, _value]) => assembleFilter(column.id, key));
			// debugging: remainingFilters

			return [...replacedFilters, ...remainingFilters];
		})
		.flat();
	currentGlobalFilter = matchQueryStringAndFilters(currentGlobalFilter, assembledColumnFilters);
	currentGlobalFilter = currentGlobalFilter.replace(/^ OR /, "").replaceAll("  ", " ");

	// Check if "AND" would incorrectly be overwritten with "OR"
	const globalFilterWithAndReplacedOutside = String(table.getState().globalFilter ?? "").replaceAll(
		/\bAND\b(?![^(]*\))/g,
		"OR",
	);
	if (globalFilterWithAndReplacedOutside === currentGlobalFilter) {
		return;
	}

	table.setGlobalFilter(currentGlobalFilter);
}

function addMetaFilter(originalQuery: string, metaKey: string, metaValue: string | Array<string>) {
	let newFilter: string;
	if (Array.isArray(metaValue))
		newFilter = metaValue.map((val) => `${metaKey}:${val}`).join(" OR ");
	else newFilter = `${metaKey}:${metaValue}`;
	return `${originalQuery} AND ${newFilter}`.replaceAll(/ {2,}/g, " ");
}

function getTraversedAST(query: string) {
	return collectLeavesAsArray(getNormalizedAST(query));
}

function findImplicitBooleanOperator(ast: LiqeQuery): boolean {
	if (ast.type === "LogicalExpression") {
		return (
			ast.operator.type === "ImplicitBooleanOperator" ||
			findImplicitBooleanOperator(ast.left) ||
			findImplicitBooleanOperator(ast.right)
		);
	}
	return false;
}

function validateQuery(query: string): { warnings: Array<string>; isValid: boolean } {
	const operatorRegex = /\bAND|OR|NOT\b/g;
	const parenthesesRegex = /\(.*?\)/g;

	const warnings: Array<string> = [];
	let isValid = false;
	try {
		if (
			new Set([...normalizeOperators(query).matchAll(operatorRegex)].map((e) => e[0])).size > 1 &&
			[...normalizeOperators(query).matchAll(parenthesesRegex)].length === 0
		)
			warnings.push("Consider using parentheses to group your query (e.g. (A AND B) OR C)");
		const ast = parse(normalizeOperators(query));
		if (findImplicitBooleanOperator(ast))
			warnings.push("If no operator (AND/OR) is specified, AND is used implicitly.");
		isValid = true;
	} catch (err) {
		if (err instanceof SyntaxError)
			warnings.push(
				`The query contains a syntax error at line ${String(err.line)} position ${String(err.column)}`,
			);
		else warnings.push("The current query is incomplete");
	}
	return { warnings, isValid };
}

export function useFilterParser() {
	return {
		parseSearchString,
		isInQuery,
		matchQueryStringAndFilters,
		syncGlobalAndColumnFilters,
		getTraversedAST,
		validateQuery,
		normalizeOperators,
		addMetaFilter,
		parse,
	};
}
