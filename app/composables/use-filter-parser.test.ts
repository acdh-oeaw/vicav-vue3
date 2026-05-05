import { createColumnHelper, getCoreRowModel, type Table, useVueTable } from "@tanstack/vue-table";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test } from "vitest";

import { useFilterParser } from "./use-filter-parser.ts";

const { AND_OPERATOR } = useAdvancedQueries();

const {
	parseSearchString,
	isInQuery,
	matchQueryStringAndFilters,
	syncGlobalAndColumnFilters,
	normalizeParens,
} = useFilterParser();

interface TestInterface {
	fruit: string;
	color: string;
}

const data: Array<TestInterface> = [
	{
		fruit: "apple",
		color: "red",
	},
	{
		fruit: "banana",
		color: "yellow",
	},
	{
		fruit: "cherry",
		color: "red",
	},
	{
		fruit: "date",
		color: "brown",
	},
];

const columnHelper = createColumnHelper<TestInterface>();

const columns = [
	columnHelper.accessor((row) => row.fruit, {
		id: "fruit",
	}),
	columnHelper.accessor((row) => row.color, {
		id: "color",
	}),
];

const table = useVueTable({
	get data() {
		return data;
	},
	columns,
	getCoreRowModel: getCoreRowModel(),
});

describe("simple search strings", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});
	test("Empty search string should reset all filters", () => {
		parseSearchString("", table as Table<unknown>);
		expect(table.getColumn("fruit")?.getFilterValue()).toBeUndefined();
		expect(table.getColumn("color")?.getFilterValue()).toBeUndefined();
	});
	test("Single tag expression sets a filter", () => {
		parseSearchString("fruit:apple", table as Table<unknown>);
		const fruitFilter = table.getColumn("fruit")?.getFilterValue() as Map<string, unknown>;
		expect(fruitFilter.get("apple")).toBe(1);
	});
});

describe("OR operator", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});
	test("OR expression sets multiple filter values (2)", () => {
		parseSearchString("color:red OR color:yellow", table as Table<unknown>);
		const colorFilter = table.getColumn("color")?.getFilterValue() as Map<string, unknown>;
		expect(colorFilter.get("red")).toBe(1);
		expect(colorFilter.get("yellow")).toBe(1);
	});
	test("OR expression sets multiple filter values (3)", () => {
		parseSearchString("color:red OR color:yellow OR color:brown", table as Table<unknown>);
		const colorFilter = table.getColumn("color")?.getFilterValue() as Map<string, unknown>;
		expect(colorFilter.get("red")).toBe(1);
		expect(colorFilter.get("yellow")).toBe(1);
		expect(colorFilter.get("brown")).toBe(1);
	});
	test("OR expression sets multiple filters", () => {
		parseSearchString("color:red OR fruit:apple", table as Table<unknown>);
		const fruitFilter = table.getColumn("fruit")?.getFilterValue() as Map<string, unknown>;
		const colorFilter = table.getColumn("color")?.getFilterValue() as Map<string, unknown>;
		expect(colorFilter.get("red")).toBe(1);
		expect(fruitFilter.get("apple")).toBe(1);
	});
});

describe("AND operator", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});
	test("AND expression combines values (2)", () => {
		parseSearchString("color:red AND color:yellow", table as Table<unknown>);
		const colorFilter = table.getColumn("color")?.getFilterValue() as Map<string, unknown>;
		expect(colorFilter.get(`red${AND_OPERATOR}yellow`)).toBe(1);
	});
	test("AND expression combines values (3)", () => {
		parseSearchString("color:red AND color:yellow AND color:brown", table as Table<unknown>);
		const colorFilter = table.getColumn("color")?.getFilterValue() as Map<string, unknown>;
		expect(colorFilter.get(`red${AND_OPERATOR}yellow${AND_OPERATOR}brown`)).toBe(1);
	});

	test("Multiple different columns with AND sets separate filters", () => {
		parseSearchString("fruit:apple AND color:red", table as Table<unknown>);
		const fruitFilter = table.getColumn("fruit")?.getFilterValue() as Map<string, unknown>;
		const colorFilter = table.getColumn("color")?.getFilterValue() as Map<string, unknown>;
		expect(fruitFilter.get("apple")).toBe(1);
		expect(colorFilter.get("red")).toBe(1);
	});
});

describe("Expressions containing parentheses", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});
	test("Parentheses around OR followed by a different feature", () => {
		parseSearchString("(fruit:apple OR fruit:banana) AND color:red", table as Table<unknown>);
		const fruitFilter = table.getColumn("fruit")?.getFilterValue() as Map<string, unknown>;
		const colorFilter = table.getColumn("color")?.getFilterValue() as Map<string, unknown>;
		expect(fruitFilter.get("apple")).toBe(1);
		expect(fruitFilter.get("banana")).toBe(1);
		expect(colorFilter.get("red")).toBe(1);
	});
	test("Parentheses around AND followed by a different feature", () => {
		parseSearchString("(fruit:apple AND fruit:banana) AND color:red", table as Table<unknown>);
		const fruitFilter = table.getColumn("fruit")?.getFilterValue() as Map<string, unknown>;
		const colorFilter = table.getColumn("color")?.getFilterValue() as Map<string, unknown>;
		expect(fruitFilter.get(`apple${AND_OPERATOR}banana`)).toBe(1);
		expect(colorFilter.get("red")).toBe(1);
	});
	test("Parentheses around AND followed by the same feature", () => {
		parseSearchString("(fruit:apple AND fruit:banana) AND fruit:cherry", table as Table<unknown>);
		const fruitFilter = table.getColumn("fruit")?.getFilterValue() as Map<string, unknown>;
		expect(fruitFilter.get(`apple${AND_OPERATOR}banana${AND_OPERATOR}cherry`)).toBe(1);
	});
});

describe("Test isInQuery function", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});
	test("Simple tag expression", () => {
		expect(isInQuery("fruit:apple", "fruit:apple")).toBe(true);
	});
	test("Simple tag expression with different value", () => {
		expect(isInQuery("fruit:apple", "fruit:banana")).toBe(false);
	});
	test("Simple tag expression with different column", () => {
		expect(isInQuery("fruit:apple", "color:apple")).toBe(false);
	});
	test("Simple tag expression with different column and value", () => {
		expect(isInQuery("fruit:apple", "color:banana")).toBe(false);
	});
	test("Simple tag expression with different column and same value", () => {
		expect(isInQuery("fruit:apple", "color:apple")).toBe(false);
	});

	test("OR expression", () => {
		expect(isInQuery("fruit:apple OR fruit:banana", "fruit:apple")).toBe(true);
	});
	test("OR expression with different value", () => {
		expect(isInQuery("fruit:apple OR fruit:banana", "fruit:cherry")).toBe(false);
	});

	test("AND expression", () => {
		// This seems counter intuitive at first, but the the isInQuery function is written to return
		// false for AND expressions like this, to allow for querys such as "(A AND B) OR A". This query
		// should create one petal for "A AND B" and another one for just "A".
		expect(isInQuery("fruit:apple AND fruit:banana", "fruit:apple")).toBe(false);
	});
	test("AND expression with different value", () => {
		expect(isInQuery("fruit:apple AND fruit:banana", "fruit:cherry")).toBe(false);
	});

	test("AND expression in filter", () => {
		expect(isInQuery("fruit:apple AND fruit:banana", "fruit:apple AND fruit:banana")).toBe(true);
	});
	test("AND expression in reversed order", () => {
		expect(isInQuery("fruit:apple AND fruit:banana", "fruit:banana AND fruit:apple")).toBe(true);
	});
	test("AND expression in filter with different value", () => {
		expect(isInQuery("fruit:apple AND fruit:banana", "fruit:apple AND fruit:cherry")).toBe(false);
	});

	test("complex expression", () => {
		expect(
			isInQuery(
				"fruit:date OR fruit:apple AND (fruit:banana OR fruit:cherry)",
				"fruit:apple AND fruit:banana",
			),
		).toBe(true);
	});
});

describe("Test matchQueryStringAndFilters function", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
	});
	test("matchQueryStringAndFilters maintains AND when syncing - different features", () => {
		const query = 'a:"1" AND b:"2"';
		const new_filters = ['c:"3"'];
		const filters = [...query.split(" AND "), ...new_filters];
		const out = matchQueryStringAndFilters(query, filters);
		expect(out).toBe('(a:"1" AND b:"2") OR c:"3"');
	});

	test("matchQueryStringAndFilters maintains AND when syncing - same feature", () => {
		const query = 'a:"1" AND a:"2"';
		const new_filters = ['c:"3"'];
		const filters = ['(a:"1" AND a:"2")', ...new_filters];
		const out = matchQueryStringAndFilters(query, filters);
		expect(out).toBe('(a:"1" AND a:"2") OR c:"3"');
	});

	test("Don't add unnecessary parentheses around OR", () => {
		const query = 'a:"1" AND a:"2" OR b:"3"';
		const new_filters = ['c:"4"'];
		const filters = ['(a:"1" AND a:"2")', 'b:"3"', ...new_filters];
		const out = matchQueryStringAndFilters(query, filters);
		expect(out).toBe('(a:"1" AND a:"2") OR b:"3" OR c:"4"');
	});
	test("Handle NOT operator correctly", () => {
		const query = '(a:"1" AND NOT a:"2")';
		const new_filters = ['b:"3"'];
		const filters = ['(a:"1" AND NOT a:"2")', ...new_filters];
		const out = matchQueryStringAndFilters(query, filters);
		expect(out).toBe('(a:"1" AND NOT a:"2") OR b:"3"');
	});

	test("syncGlobalAndColumnFilters preserves NOT expression when adding column filter", () => {
		const table2 = useVueTable({
			get data() {
				return data;
			},
			columns,
			getCoreRowModel: getCoreRowModel(),
		}) as Table<unknown>;

		table2.setGlobalFilter('fruit:"apple" AND NOT fruit:"banana"');

		const colorColumn = table2.getColumn("color");
		expect(colorColumn).toBeDefined();
		colorColumn!.toggleVisibility(true);
		const map = new Map<string, unknown>();
		map.set("red", 1);
		colorColumn!.setFilterValue(map);

		syncGlobalAndColumnFilters(table2);

		expect(String(table2.getState().globalFilter ?? "")).toBe(
			'(fruit:"apple" AND NOT fruit:"banana") OR color:"red"',
		);
	});
});

describe("normalizeParens", () => {
	test("empty string is returned unchanged", () => {
		expect(normalizeParens("")).toBe("");
	});

	test("whitespace-only string is returned as empty", () => {
		expect(normalizeParens("   ")).toBe("");
	});

	test("simple tag without parens is unchanged", () => {
		expect(normalizeParens('fruit:"apple"')).toBe('fruit:"apple"');
	});

	test("single tag wrapped in parens is unwrapped", () => {
		expect(normalizeParens('(fruit:"apple")')).toBe('fruit:"apple"');
	});

	test("double-wrapped single tag is fully unwrapped", () => {
		expect(normalizeParens('((fruit:"apple"))')).toBe('fruit:"apple"');
	});

	test("negated tag wrapped in parens is unwrapped", () => {
		expect(normalizeParens('(NOT fruit:"apple")')).toBe('NOT fruit:"apple"');
	});

	test("AND expression in parens is kept", () => {
		expect(normalizeParens('(fruit:"apple" AND fruit:"banana")')).toBe(
			'(fruit:"apple" AND fruit:"banana")',
		);
	});

	test("OR expression in parens is kept", () => {
		expect(normalizeParens('(fruit:"apple" OR fruit:"banana")')).toBe(
			'(fruit:"apple" OR fruit:"banana")',
		);
	});

	test("single-tag parens nested inside a larger expression are unwrapped", () => {
		expect(normalizeParens('(fruit:"apple") AND color:"red"')).toBe(
			'fruit:"apple" AND color:"red"',
		);
	});

	test("multiple single-tag parens in OR are all unwrapped", () => {
		expect(normalizeParens('(fruit:"apple") OR (fruit:"banana")')).toBe(
			'fruit:"apple" OR fruit:"banana"',
		);
	});

	test("mixed: single-tag parens unwrapped, multi-term group kept", () => {
		expect(normalizeParens('(fruit:"apple") OR (fruit:"banana" AND color:"red")')).toBe(
			'fruit:"apple" OR (fruit:"banana" AND color:"red")',
		);
	});

	test("triple expression is kept", () => {
		expect(normalizeParens('(fruit:"apple" OR fruit:"banana" OR color:"red")')).toBe(
			'(fruit:"apple" OR fruit:"banana" OR color:"red")',
		);
	});

	test("triple expression without parentheses is kept", () => {
		expect(normalizeParens('fruit:"apple" AND fruit:"banana" AND color:"red"')).toBe(
			'fruit:"apple" AND fruit:"banana" AND color:"red"',
		);
	});

	test("AND: nested expression is kept", () => {
		expect(normalizeParens('((fruit:"apple" AND fruit:"banana") AND color:"red")')).toBe(
			'((fruit:"apple" AND fruit:"banana") AND color:"red")',
		);
	});

	test("OR: nested expression is kept", () => {
		expect(normalizeParens('((fruit:"apple" OR fruit:"banana") OR color:"red")')).toBe(
			'((fruit:"apple" OR fruit:"banana") OR color:"red")',
		);
	});

	test("mixed: nested expression is kept", () => {
		expect(normalizeParens('((fruit:"apple" OR fruit:"banana") AND color:"red")')).toBe(
			'((fruit:"apple" OR fruit:"banana") AND color:"red")',
		);
	});
});
