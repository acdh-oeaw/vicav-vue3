import { describe, expect, it } from "vitest";

import { GeoCoordinatesSchema } from "./geo-coordinates.ts";

describe("geographic coordinates", () => {
	it.each([
		[0, 0],
		[-180, -90],
		[180, 90],
		[38.8, 37.2],
	])("accepts longitude %s and latitude %s", (longitude, latitude) => {
		expect(GeoCoordinatesSchema.parse([longitude, latitude])).toEqual([longitude, latitude]);
	});

	it("accepts extra position values and returns only longitude and latitude", () => {
		expect(GeoCoordinatesSchema.parse([38.8, 37.2, 500])).toEqual([38.8, 37.2]);
	});

	it.each([
		undefined,
		null,
		[],
		[38.8],
		["38.8", 37.2],
		[38.8, "37.2"],
		[180.1, 0],
		[-180.1, 0],
		[0, 90.1],
		[0, -90.1],
		[NaN, 0],
		[0, NaN],
		[Infinity, 0],
		[0, -Infinity],
	])("rejects invalid coordinates %j", (coordinates) => {
		expect(GeoCoordinatesSchema.safeParse(coordinates).success).toBe(false);
	});
});
