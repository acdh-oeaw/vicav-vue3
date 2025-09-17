import type { Table } from "@tanstack/vue-table";
import {
	type LiqeQuery,
	type LogicalExpressionToken,
	type ParenthesizedExpressionToken,
	parse as liqe_parse,
	SyntaxError,
	type TagToken,
	type UnaryOperatorToken,
} from "liqe";

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

function parseSearchString(searchString: string, table: Table<unknown>) {
	const ast = parse(searchString);

	table.resetColumnFilters();
	table.resetColumnVisibility();
	traverseASTandApplyFilter(ast, table);
}

function setColumnFilter(columnId: string, value: string, table: Table<unknown>) {
	if (!table.getAllFlatColumns().find((column) => column.id === columnId)) return;
	table.getColumn(columnId)?.toggleVisibility(true);
	if (!table.getColumn(columnId)?.getFilterValue()) {
		table.getColumn(columnId)?.setFilterValue(new Map());
	}
	const filterValue = table.getColumn(columnId)?.getFilterValue() as
		| Map<string, unknown>
		| undefined;
	filterValue?.set(value, 1);
	table.getColumn(columnId)?.setFilterValue(filterValue);
}

function getColumnAndValueFromTagExpression(ast: TagToken) {
	if (!("name" in ast.field) || !("value" in ast.expression) || !ast.expression.value) {
		return {};
	}
	return { column: ast.field.name, value: String(ast.expression.value) };
}

function handleAndExpression(ast: LiqeQuery) {
	if (!ast.left || !ast.right) return [];
	const left = traverseAST(ast.left);
	const right = traverseAST(ast.right);
	if (!left[0]?.column || !right[0]?.column) return [];
	if (left[0].column !== right[0].column) {
		return [left, right].flat();
	} else {
		return [{ column: left[0].column, value: [left[0].value, right[0].value].join(AND_OPERATOR) }];
	}
}

function traverseAST(ast: LiqeQuery): Array<{ column: string; value: string; negated?: boolean }> {
	switch (ast.type) {
		case "Tag": {
			const { column, value } = getColumnAndValueFromTagExpression(ast);
			if (!column || !value) return [];
			return [{ column, value }];
		}
		case "LogicalExpression": {
			if (ast.operator.operator === "OR") {
				return [traverseAST(ast.left), traverseAST(ast.right)].flat();
			} else {
				return handleAndExpression(ast);
			}
		}
		case "ParenthesizedExpression": {
			return traverseAST(ast.expression);
		}
		case "UnaryOperator": {
			return traverseAST(ast.operand);
		}
		case "EmptyExpression":
		default:
	}
	return [];
}

function traverseASTandApplyFilter(ast: LiqeQuery, table: Table<unknown>) {
	traverseAST(normalizeASTtoDNF(ast)).forEach((result) => {
		setColumnFilter(result.column, result.value, table);
	});
}

function constructLocicalExpression(
	operator: "AND" | "OR",
	left: LiqeQuery,
	right: LiqeQuery,
): LogicalExpressionToken {
	return {
		type: "LogicalExpression",
		operator: { type: "BooleanOperator", operator: operator, location: { start: -1, end: -1 } },
		left: left,
		right: right,
		location: { start: -1, end: -1 },
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

function normalizeASTtoDNF(ast: LiqeQuery): Exclude<LiqeQuery, ParenthesizedExpressionToken> {
	switch (ast.type) {
		case "Tag": {
			return ast;
		}
		case "ParenthesizedExpression": {
			return normalizeASTtoDNF(ast.expression);
		}
		case "LogicalExpression": {
			if (ast.operator.operator === "AND") {
				const left = normalizeASTtoDNF(ast.left);
				const right = normalizeASTtoDNF(ast.right);
				if (left.type === "EmptyExpression" || right.type === "EmptyExpression") {
					return ast;
				}
				if (typeof left.operator !== "string" && left.operator.operator === "OR") {
					const newLeft = normalizeASTtoDNF(constructLocicalExpression("AND", left.left!, right));
					const newRight = normalizeASTtoDNF(constructLocicalExpression("AND", left.right!, right));
					return constructLocicalExpression("OR", newLeft, newRight);
				}
				if (typeof right.operator !== "string" && right.operator.operator === "OR") {
					const newLeft = normalizeASTtoDNF(constructLocicalExpression("AND", left, right.left!));
					const newRight = normalizeASTtoDNF(constructLocicalExpression("AND", left, right.right!));
					return constructLocicalExpression("OR", newLeft, newRight);
				}
				return constructLocicalExpression("AND", left, right);
			}
			// if ast.operator.operator === "OR":
			else {
				return constructLocicalExpression(
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
					constructLocicalExpression(operator === "OR" ? "AND" : "OR", newLeft, newRight),
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
	const ast = typeof query === "string" ? normalizeASTtoDNF(parse(query)) : query;
	const filterAST = typeof filter === "string" ? normalizeASTtoDNF(parse(filter)) : filter;

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

function matchQueryStringAndFilters(query: string, filters: Array<string>) {
	// remove leafs from query that are not in filters:
	const normalizedAST = normalizeASTtoDNF(parse(query));
	const filteredAST = traverseAST(normalizedAST).filter((leaf) =>
		filters.includes(assembleFilter(leaf.column, leaf.value)),
	);
	let filteredQueryString = filteredAST
		.map((leaf) => assembleFilter(leaf.column, leaf.value))
		.join(" OR ");

	// add filters that are not in query:
	if (filters.length === 0) return filteredQueryString;

	filteredQueryString = filters.reduce(
		(acc, filter) => {
			if (!isInQuery(acc, filter)) {
				return `${acc} OR ${filter}`;
			}
			return acc;
		},
		filteredQueryString.length > 0 ? filteredQueryString : filters[0]!,
	);

	return filteredQueryString;
}

function syncGlobalAndColumnFilters(table: Table<unknown>) {
	const columnFilters = table.getState().columnFilters as Array<{
		id: string;
		value: Map<string, unknown>;
	}>;
	let currentGlobalFilter = String(table.getState().globalFilter ?? "");
	const assembledColumnFilters = columnFilters
		.map((column) => {
			return [...column.value.entries()].map(([key, _value]) => {
				return assembleFilter(column.id, key);
			});
		})
		.flat();
	currentGlobalFilter = matchQueryStringAndFilters(currentGlobalFilter, assembledColumnFilters);
	currentGlobalFilter = currentGlobalFilter.replace(/^ OR /, "").replaceAll("  ", " ");
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
	return traverseAST(normalizeASTtoDNF(parse(query)));
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
