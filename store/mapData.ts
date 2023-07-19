import {defineStore} from 'pinia';
import { z } from "zod";

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

export interface IMapLayer {
    id: string,
    query: IMapQuery,
    data: GeoJsonObject[],
}

export interface IMapQuery {
    endpoint: string,
    query: string,
    scope: string,
}

const defaultParams = { headers: { accept: "application/json" }};

function endpointString(s: string) {
    return s.toLowerCase().replace(/([-_][a-z])/g, (group: string) =>
        group
            .toUpperCase()
            .replace('-', '')
            .replace('_', '')
    );
}

export const useMapDataStore = defineStore(
    'mapData',
    () => {
        const { $api } = useNuxtApp();
        $api.baseUrl = ("" + import.meta.env.VITE_APIBASEURL);

        const layers = ref([] as IMapLayer[])

        const layerById = (id: string) => layers.value.find((l) => l.id === id );
        async function getMarkers(id: string, query: IMapQuery) {
            let index = layers.value.findIndex((l) => l.id === id );
            let endpoint: string = endpointString(query.endpoint);
            // @ts-ignore
            if($api[endpoint] && $api[endpoint].getMarkers) {
                // @ts-ignore
                let res = await $api[endpoint].getMarkers(query, defaultParams);
                let filteredRes = res.data.filter((item: GeoJsonObject) => {
                    try {
                        featureSchema.parse(item);
                        return true
                    } catch (error) {
                        console.error(error,item);
                        return false
                    }
                })
                if(index > -1) {
                    layers.value[index].query = query;
                    layers.value[index].data = filteredRes;
                }

                else layers.value.push({id, data: filteredRes, query});
            }
            else console.error(`endpoint ${endpoint} not found in current API configuration`);
        }

        return {
            layers,
            layerById,
            getMarkers,
        }
    }
)

