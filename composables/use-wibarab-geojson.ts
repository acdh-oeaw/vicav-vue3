import { useQuery } from "@tanstack/vue-query";
import type { FeatureCollection } from "geojson";
import { z } from "zod";

const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

const FeatureSchema = z.object({
	type: z.literal("Feature"),
	id: z.string(),
	geometry: z.object({
		type: z.literal("Point"),
		coordinates: z.array(z.number()),
	}),
	properties: z.object({
		name: z.string(),
	}),
});

export function useWibarabGeojson(options?: { enabled?: boolean }) {
	return useQuery({
		enabled: options?.enabled,
		queryKey: ["get-wibarab-geojson"] as const,
		async queryFn() {
			const response = await fetch(url);
			return response.json() as Promise<FeatureCollection>;
		},
		select: (data) => {
			const features = data.features.map((feature) => {
				const result = FeatureSchema.passthrough().safeParse(feature);
				if (result.success) {
					return result.data;
				} else {
					console.error(result.error);
					return null;
				}
			});
			return {
				...data,
				features,
			};
		},
	});
}
