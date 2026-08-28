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
import { ensureFilterValueMap, FilterValueMap } from "../utils/filter-value-map";

const { AND_OPERATOR } = useAdvancedQueries();

function mapOutsideQuotes(input: string, transform: (part: string) => string): string {
	return input
		.split(/(".*?")/)
		.map((part, i) => (i % 2 === 0 ? transform(part) : part))
		.join("");
}

function normalizeOperators(input: string): string {
	// Only replace AND/OR/NOT outside of quoted values
	return mapOutsideQuotes(input, (part) =>
		part.replace(/\b(?:and|or|not)\b/gi, (op) => op.toUpperCase()),
	);
}

function collapseSpaces(input: string): string {
	return mapOutsideQuotes(input, (part) => part.replaceAll(/ {2,}/g, " "));
}

function parse(query: string) {
	let normalized = normalizeOperators(query);
	normalized = normalized.replaceAll(":ANY", ":*");
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
): { column: ReturnType<Table<unknown>["getColumn"]>; filterValue: FilterValueMap } | undefined {
	const col = table.getColumn(columnId);
	if (!col) return undefined;
	col.toggleVisibility(true);
	if (!col.getFilterValue()) col.setFilterValue(new FilterValueMap());
	const filterValue = ensureFilterValueMap(col.getFilterValue());
	if (!(col.getFilterValue() instanceof FilterValueMap)) col.setFilterValue(filterValue);
	return { column: col, filterValue };
}

function stripRedundantParens(ast: LiqeQuery): LiqeQuery {
	switch (ast.type) {
		case "ParenthesizedExpression": {
			const inner = stripRedundantParens(ast.expression);
			if (inner.type === "Tag" || inner.type === "UnaryOperator") return inner;
			return { ...ast, expression: inner };
		}
		case "LogicalExpression":
			return {
				...ast,
				left: stripRedundantParens(ast.left),
				right: stripRedundantParens(ast.right),
			};
		case "UnaryOperator":
			return { ...ast, operand: stripRedundantParens(ast.operand) };
		case "EmptyExpression":
		case "Tag":
		default:
			return ast;
	}
}

function normalizeParens(query: string): string {
	const trimmed = query.trim();
	if (trimmed.length === 0) return trimmed;
	try {
		return stringifyAST(stripRedundantParens(parse(trimmed))).trim();
	} catch {
		return trimmed;
	}
}

function parseSearchString(searchString: string, table: Table<unknown>) {
	table.resetColumnFilters();
	table.resetColumnVisibility();
	if (searchString.trim().length === 0) return;
	const ast = parse(searchString);
	traverseASTandApplyFilter(ast, table);
}

function setColumnFilter(columnId: string, value: string, table: Table<unknown>, negated = false) {
	const ensured = ensureColumnFilterMap(table, columnId);
	if (!ensured) return;
	const { filterValue } = ensured;
	const { featureValueTaxonomy } = storeToRefs(useGeojsonStore());

	const addInclude = (val: string) => {
		filterValue.set(val, 1);
		filterValue.exclude.delete(val);
	};
	const addExclude = (val: string) => {
		filterValue.exclude.add(val);
		filterValue.delete(val);
	};

	if (value === "*") {
		const allColValues = getAllColumnValues(table, columnId);
		allColValues.forEach((val) => {
			if (negated) addExclude(val);
			else addInclude(val);
		});
	} else {
		if (negated && value.includes(AND_OPERATOR)) {
			addExclude(value);
			ensured.column!.setFilterValue(filterValue);
			return;
		}
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
					const mappedVal = match[0].replace(`${columnId}.`, "");
					if (negated) addExclude(mappedVal);
					else addInclude(mappedVal);
				});
				if (negated) addExclude(part);
				else addInclude(part);
				isTaxonomyEntry = true;
			} else if (!value.includes(AND_OPERATOR)) {
				if (negated) addExclude(part);
				else addInclude(part);
			}
		});
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (!isTaxonomyEntry) {
			if (negated) addExclude(value);
			else addInclude(value);
		}
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

interface Literal {
	column: string;
	value: string;
	negated: boolean;
}

function toLiteral(ast: LiqeQuery): Literal | undefined {
	if (ast.type === "Tag") {
		const { column, value } = getColumnAndValueFromTagExpression(ast);
		if (column && value) return { column, value, negated: false };
	}
	if (ast.type === "UnaryOperator" && ast.operand.type === "Tag") {
		const { column, value } = getColumnAndValueFromTagExpression(ast.operand);
		if (column && value) return { column, value, negated: true };
	}
	return undefined;
}

function literalToFilter(literal: Literal): string {
	const base = assembleFilter(literal.column, literal.value);
	return literal.negated ? `NOT ${base}` : base;
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
				if (l0.column !== r0.column || l0.negated || r0.negated) {
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
			const leaf = ast.operand.type === "Tag" ? ast.operand : undefined;
			if (!leaf) return;
			const { column, value } = getColumnAndValueFromTagExpression(leaf);
			if (column && value) yield { column, value, negated: true };
			return;
		}
		case "EmptyExpression":
		default:
			return;
	}
}

function collectAndTerms(ast: LiqeQuery): Array<FilterLeaf> {
	if (ast.type === "ParenthesizedExpression") return collectAndTerms(ast.expression);
	if (ast.type === "LogicalExpression") {
		if (ast.operator.operator !== "AND") return [];
		return [...collectAndTerms(ast.left), ...collectAndTerms(ast.right)];
	}
	const literal = toLiteral(ast);
	return literal
		? [{ column: literal.column, value: literal.value, negated: literal.negated }]
		: [];
}

function collectFilterStrings(ast: LiqeQuery): Array<string> {
	switch (ast.type) {
		case "Tag": {
			const { column, value } = getColumnAndValueFromTagExpression(ast);
			return column && value ? [assembleFilter(column, value)] : [];
		}
		case "UnaryOperator": {
			if (ast.operand.type !== "Tag") return [];
			const { column, value } = getColumnAndValueFromTagExpression(ast.operand);
			return column && value ? [`NOT ${assembleFilter(column, value)}`] : [];
		}
		case "ParenthesizedExpression":
			return collectFilterStrings(ast.expression);
		case "LogicalExpression": {
			if (ast.operator.operator === "OR") {
				return [...collectFilterStrings(ast.left), ...collectFilterStrings(ast.right)];
			}
			// AND: if all terms are on the same column, keep as a single grouped filter
			const terms = collectAndTerms(ast);
			if (terms.length > 0) {
				const [first, ...rest] = terms;
				if (first && rest.every((t) => t.column === first.column)) {
					const grouped = stringifyAST(ast);
					const normalizedGrouped =
						grouped.startsWith("(") && grouped.endsWith(")") ? grouped : `(${grouped})`;
					const parts = terms.map((term) =>
						literalToFilter({
							column: term.column,
							value: term.value,
							negated: Boolean(term.negated),
						}),
					);
					return [normalizedGrouped, ...parts];
				}
				return terms.map((term) =>
					literalToFilter({
						column: term.column,
						value: term.value,
						negated: Boolean(term.negated),
					}),
				);
			}
			return [];
		}
		case "EmptyExpression":
		default:
			return [];
	}
}

function traverseASTandApplyFilter(ast: LiqeQuery, table: Table<unknown>) {
	for (const { column, value, negated } of iterateLeaves(getNormalizedAST(ast))) {
		setColumnFilter(column, value, table, Boolean(negated));
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
	if (key === "*") assembledFilter = `${columnId}:ANY`;
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
			if (ast.operand.type === "Tag") {
				const { column, value } = getColumnAndValueFromTagExpression(ast.operand);
				const negated = column && value ? `NOT ${assembleFilter(column, value)}` : "";
				if (negated && allowed.has(negated)) return ast;
				return { type: "EmptyExpression", location: ast.location };
			}
			const operand = filterASTtoAllowed(ast.operand, allowed);
			if (operand.type === "EmptyExpression") return operand;
			return { ...ast, operand };
		}
		case "EmptyExpression":
		default:
			return ast;
	}
}

function collectDNFTerms(ast: LiqeQuery): Array<Array<Literal>> {
	switch (ast.type) {
		case "Tag":
		case "UnaryOperator": {
			const literal = toLiteral(ast);
			return literal ? [[literal]] : [];
		}
		case "ParenthesizedExpression":
			return collectDNFTerms(ast.expression);
		case "LogicalExpression": {
			if (ast.operator.operator === "OR") {
				return [...collectDNFTerms(ast.left), ...collectDNFTerms(ast.right)];
			}
			const leftTerms = collectDNFTerms(ast.left);
			const rightTerms = collectDNFTerms(ast.right);
			const combined: Array<Array<Literal>> = [];
			for (const l of leftTerms) {
				for (const r of rightTerms) {
					combined.push([...l, ...r]);
				}
			}
			return combined;
		}
		case "EmptyExpression":
		default:
			return [];
	}
}

function normalizeTerm(term: Array<Literal>): Array<Literal> | undefined {
	const byKey = new Map<string, Literal>();
	for (const lit of term) {
		const key = `${lit.column}::${lit.value}`;
		const existing = byKey.get(key);
		if (existing && existing.negated !== lit.negated) {
			return undefined;
		}
		byKey.set(key, lit);
	}
	return [...byKey.values()].sort((a, b) => {
		if (a.column !== b.column) return a.column.localeCompare(b.column);
		if (a.value !== b.value) return a.value.localeCompare(b.value);
		return Number(a.negated) - Number(b.negated);
	});
}

function termKey(term: Array<Literal>): string {
	return term.map((lit) => `${lit.negated ? "!" : ""}${lit.column}=${lit.value}`).join("|");
}

function isSubset(a: Array<Literal>, b: Array<Literal>): boolean {
	const bKeys = new Set(b.map((lit) => `${lit.negated ? "!" : ""}${lit.column}=${lit.value}`));
	return a.every((lit) => bKeys.has(`${lit.negated ? "!" : ""}${lit.column}=${lit.value}`));
}

function simplifyTerms(terms: Array<Array<Literal>>): Array<Array<Literal>> {
	let normalized = terms
		.map((t) => normalizeTerm(t))
		.filter((t): t is Array<Literal> => Array.isArray(t));

	const dedupe = (list: Array<Array<Literal>>): Array<Array<Literal>> => {
		const seen = new Set<string>();
		const out: Array<Array<Literal>> = [];
		for (const t of list) {
			const key = termKey(t);
			if (!seen.has(key)) {
				seen.add(key);
				out.push(t);
			}
		}
		return out;
	};

	normalized = dedupe(normalized);

	let changed = true;
	while (changed) {
		changed = false;

		// absorption: A OR (A AND B) => A
		outer: for (let i = 0; i < normalized.length; i++) {
			for (let j = 0; j < normalized.length; j++) {
				if (i === j) continue;
				if (isSubset(normalized[i]!, normalized[j]!)) {
					normalized.splice(j, 1);
					changed = true;
					break outer;
				}
			}
		}
		if (changed) continue;

		// resolution: (A AND B) OR (A AND NOT B) => A
		outerResolution: for (let i = 0; i < normalized.length; i++) {
			for (let j = i + 1; j < normalized.length; j++) {
				const a = normalized[i]!;
				const b = normalized[j]!;
				if (a.length !== b.length) continue;

				let diffIndex = -1;
				for (let k = 0; k < a.length; k++) {
					const ak = a[k]!;
					const bk = b[k]!;
					if (ak.column === bk.column && ak.value === bk.value && ak.negated !== bk.negated) {
						if (diffIndex !== -1) {
							diffIndex = -1;
							break;
						}
						diffIndex = k;
					} else if (
						ak.column !== bk.column ||
						ak.value !== bk.value ||
						ak.negated !== bk.negated
					) {
						diffIndex = -1;
						break;
					}
				}
				if (diffIndex !== -1) {
					const newTerm = a.filter((_, idx) => idx !== diffIndex);
					normalized.splice(j, 1);
					normalized.splice(i, 1);
					if (newTerm.length > 0) normalized.push(newTerm);
					normalized = dedupe(normalized);
					changed = true;
					break outerResolution;
				}
			}
		}
	}

	return normalized;
}

function stringifyTerms(terms: Array<Array<Literal>>): string {
	if (terms.length === 0) return "";
	for (const term of terms) {
		if (term.length === 0) return "";
	}
	const rendered = terms.map((term) => {
		const parts = term.map((lit) => literalToFilter(lit));
		const inner = parts.join(" AND ");
		return parts.length > 1 ? `(${inner})` : inner;
	});
	return rendered.join(" OR ");
}

function simplifyQueryString(query: string): string {
	const trimmed = query.trim();
	if (trimmed.length === 0) return trimmed;
	try {
		const ast = getNormalizedAST(trimmed);
		const terms = collectDNFTerms(ast);
		const simplified = simplifyTerms(terms);
		const out = stringifyTerms(simplified);
		return out.trim();
	} catch {
		return trimmed;
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
			const needsParens =
				(parentOp === "AND" && op !== "AND") || (parentOp === "OR" && op === "AND");
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
	let filteredQueryString = stringifyAST(pruned);
	if (filteredQueryString.trim().length === 0 && query.trim().length > 0) {
		filteredQueryString = stringifyAST(normalizedAST);
	}

	if (filters.length === 0) return filteredQueryString.trim();

	const existingLeaves = new Set<string>(collectFilterStrings(normalizedAST));

	let result = filteredQueryString.trim();
	for (const filter of filters) {
		if (!existingLeaves.has(filter)) {
			if (result.length > 0) {
				// If result contains a top-level AND and we're adding with OR, wrap it
				const wrapSource =
					pruned.type === "EmptyExpression" ? normalizedAST : (pruned as LiqeQuery);
				if (wrapSource.type === "LogicalExpression" && wrapSource.operator.operator === "AND") {
					result = `(${result}) OR ${filter}`;
				} else {
					result = `${result} OR ${filter}`;
				}
			} else {
				result = filter;
			}
		}
	}

	return simplifyQueryString(result.trim());
}
function syncGlobalAndColumnFilters(table: Table<unknown>) {
	const columnFilters = table.getState().columnFilters as Array<{
		id: string;
		value: Map<string, unknown> | FilterValueMap;
	}>;
	let currentGlobalFilter = String(table.getState().globalFilter ?? "");

	const { getTaxonomyTree } = useGeojsonStore();

	const assembledColumnFilters = columnFilters
		.map((column) => {
			const filterValue = ensureFilterValueMap(column.value);
			// Check if all values for a specific column are selected
			// if so, remove all featureValues for this column from the query string
			// and return `${column.id}:ANY`
			const allColValues = getAllColumnValues(table, column.id);
			if (
				allColValues.length > 1 &&
				filterValue.exclude.size === 0 &&
				allColValues.every((val) => filterValue.has(val))
			) {
				return [
					`${column.id}:ANY `,
					...[...filterValue.entries()]
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
					treeEntry.featureValues.every((val) => filterValue.has(val))
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
			const remainingFilters = [...filterValue.entries()]
				.filter(([key, _value]) => {
					return !removeKeys.includes(key);
				})
				.map(([key, _value]) => assembleFilter(column.id, key));
			const excludedFilters = [...filterValue.exclude.values()].map(
				(key) => `NOT ${assembleFilter(column.id, key)}`,
			);

			return [...replacedFilters, ...remainingFilters, ...excludedFilters];
		})
		.flat();
	currentGlobalFilter = matchQueryStringAndFilters(currentGlobalFilter, assembledColumnFilters);
	currentGlobalFilter = collapseSpaces(currentGlobalFilter.replace(/^ OR /, ""));
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
	return collapseSpaces(`${originalQuery} AND ${newFilter}`);
}

function getTraversedAST(query: string) {
	return [...iterateLeaves(getNormalizedAST(query))];
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
	const normalized = normalizeOperators(query);

	const warnings: Array<string> = [];
	let isValid = false;
	try {
		if (
			new Set([...normalized.matchAll(operatorRegex)].map((e) => e[0])).size > 1 &&
			[...normalized.matchAll(parenthesesRegex)].length === 0
		)
			warnings.push("Consider using parentheses to group your query (e.g. (A AND B) OR C)");
		const ast = parse(normalized);
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
		normalizeParens,
		addMetaFilter,
		parse,
	};
}
