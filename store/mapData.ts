import {defineStore} from 'pinia';
import {GeoJsonObject} from "geojson";
import { z } from "zod";

const { $api } = useNuxtApp();
const pointSchema = z.object({
    type: z.literal("Point"),
    coordinates: z.array(z.number()),
    bbox: z.array(z.number()).optional()
})
const featureSchema = z.object({
    type: z.literal("Feature"),
    id: z.union([z.number(), z.string()]).optional(),
    properties: z.any().nullable(),
    geometry: pointSchema.nullable()
})
type GeoJsonObject = z.infer<typeof featureSchema>

$api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);
export const useMapDataStore = defineStore(
    'mapData',
    () => {
        const layers = ref([] as GeoJsonObject[][])

        async function getMarkers(type: string, query: string, scope: string) {

        }

        return {
            layers,
        }
    }
)
