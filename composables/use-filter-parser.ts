import type { Table } from "@tanstack/vue-table";
import { type LiqeQuery, parse, type TagToken } from "liqe";

const { AND_OPERATOR } = useAdvancedQueries();

function parseSearchString(searchString: string, table: Table<unknown>) {
	const ast = parse(searchString);

	table.resetColumnFilters();
	table.resetColumnVisibility();
	traverseASTandApplyFilter(ast, table);
}

function setColumnFilter(columnId: string, value: string, table: Table<unknown>) {
	table.getColumn(columnId)?.toggleVisibility(true);
	if (!table.getColumn(columnId)?.getFilterValue()) {
		table.getColumn(columnId)?.setFilterValue(new Map());
	}
	const filterValue = table.getColumn(columnId)?.getFilterValue() as Map<string, unknown>;
	filterValue.set(value, 1);
	table.getColumn(columnId)?.setFilterValue(filterValue);
}

function getColumnAndValueFromTagExpression(ast: TagToken) {
	if (!("name" in ast.field) || !("value" in ast.expression) || !ast.expression.value) {
		return {};
	}
	return { column: ast.field.name, value: String(ast.expression.value) };
}

function handleAndExpression(ast: LiqeQuery) {
	// console.log("AND: ", ast.left, ast.right);
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

function traverseAST(ast: LiqeQuery): Array<{ column: string; value: string }> {
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
		case "EmptyExpression":
		case "UnaryOperator":
		default:
	}
	return [];
}

function traverseASTandApplyFilter(ast: LiqeQuery, table: Table<unknown>) {
	traverseAST(ast).forEach((result) => {
		setColumnFilter(result.column, result.value, table);
	});
}

export function useFilterParser() {
	return { parseSearchString };
}
