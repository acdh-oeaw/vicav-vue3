// @vitest-environment nuxt
import { describe, expect, it } from "vitest";

import {
	buildFeatureTaxonomyTree,
	countFeaturesInCategory,
	type FeatureHeading,
	getFeatureKey,
} from "@/composables/use-feature-taxonomy.ts";

/** Shaped like the project config's `staticData.table[1]`, flattened into a single record. */
const categories: Record<string, string> = {
	personal_pronouns: "Personal pronouns",
	"personal_pronouns.bound_pronouns": "Bound personal pronouns",
	"personal_pronouns.independent_pronouns": "Independent personal pronouns",
	syntax: "Syntax",
	"syntax.particles": "Particles",
	lexicon: "Lexicon",
};

/** Shaped like the project config's `staticData.geo[0].properties.column_headings`. */
const headings: Array<FeatureHeading> = [
	{ name: "Name" },
	{ alternateNames: "Alternate Names" },
	{ category: "personal_pronouns", count: 12, ft_pr_overview: "Pronoun overview" },
	{ category: "personal_pronouns.bound_pronouns", count: 34, ft_pr_sg_p2_f: "Bound 2SG.F" },
	{ category: "syntax.particles", count: 396, ft_cond_part: "Conditional particles" },
];

describe("getFeatureKey", () => {
	it("returns the ft_ prefixed key of a feature heading", () => {
		expect(getFeatureKey({ category: "syntax.particles", count: 1, ft_cond_part: "Label" })).toBe(
			"ft_cond_part",
		);
	});

	it("returns undefined for a heading that is not a feature", () => {
		expect(getFeatureKey({ name: "Name" })).toBeUndefined();
	});
});

describe("buildFeatureTaxonomyTree", () => {
	it("groups features under their category", () => {
		const tree = buildFeatureTaxonomyTree(categories, headings);
		const pronouns = tree.find((category) => category.path === "personal_pronouns");

		expect(pronouns?.label).toBe("Personal pronouns");
		expect(pronouns?.features).toStrictEqual([
			{ id: "ft_pr_overview", label: "Pronoun overview", count: 12 },
		]);
	});

	it("nests subcategories below their parent", () => {
		const tree = buildFeatureTaxonomyTree(categories, headings);
		const pronouns = tree.find((category) => category.path === "personal_pronouns");

		expect(pronouns?.children.map((child) => child.path)).toStrictEqual([
			"personal_pronouns.bound_pronouns",
		]);
		expect(pronouns?.children[0]?.features.map((feature) => feature.id)).toStrictEqual([
			"ft_pr_sg_p2_f",
		]);
	});

	it("drops subcategories without features, but keeps empty top level categories", () => {
		const tree = buildFeatureTaxonomyTree(categories, headings);

		// `independent_pronouns` has no features in `headings`.
		expect(tree.flatMap((category) => category.children.map((child) => child.path))).not.toContain(
			"personal_pronouns.independent_pronouns",
		);
		// The feature map/table relies on every top level category yielding a column group.
		expect(tree.map((category) => category.path)).toStrictEqual([
			"personal_pronouns",
			"syntax",
			"lexicon",
		]);
	});

	it("ignores headings that are not assigned to a category", () => {
		const tree = buildFeatureTaxonomyTree(categories, headings);
		const featureIds = tree.flatMap((category) => [
			...category.features.map((feature) => feature.id),
			...category.children.flatMap((child) => child.features.map((feature) => feature.id)),
		]);

		expect(featureIds).not.toContain("name");
		expect(featureIds).not.toContain("alternateNames");
	});

	it("keys a categorized heading without a ft_ key by its category path", () => {
		const tree = buildFeatureTaxonomyTree({ country: "Country" }, [
			{ country: "Country", category: "country" },
		]);

		expect(tree[0]?.features).toStrictEqual([
			{ id: "country", label: "Country", count: undefined },
		]);
	});

	it("does not treat a category as a subcategory of a name it merely starts with", () => {
		const tree = buildFeatureTaxonomyTree(
			{ syntax: "Syntax", syntaxx: "Unrelated", "syntaxx.sub": "Unrelated sub" },
			[{ category: "syntaxx.sub", count: 1, ft_unrelated: "Unrelated feature" }],
		);

		expect(tree.find((category) => category.path === "syntax")?.children).toStrictEqual([]);
		expect(
			tree.find((category) => category.path === "syntaxx")?.children.map((child) => child.path),
		).toStrictEqual(["syntaxx.sub"]);
	});
});

describe("countFeaturesInCategory", () => {
	it("counts features of a category and all its descendants", () => {
		const tree = buildFeatureTaxonomyTree(categories, headings);
		const pronouns = tree.find((category) => category.path === "personal_pronouns")!;

		expect(countFeaturesInCategory(pronouns)).toBe(2);
	});

	it("counts zero for a category without features", () => {
		const tree = buildFeatureTaxonomyTree(categories, headings);
		const lexicon = tree.find((category) => category.path === "lexicon")!;

		expect(countFeaturesInCategory(lexicon)).toBe(0);
	});
});
