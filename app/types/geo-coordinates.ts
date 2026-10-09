import { z } from "zod";

export const GeoCoordinatesSchema = z
	.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)], z.unknown())
	.transform(([longitude, latitude]): [number, number] => [longitude, latitude]);
