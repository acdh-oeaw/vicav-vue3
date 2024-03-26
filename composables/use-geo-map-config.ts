import { icon } from "leaflet";

export function useGeoMapConfig() {
	const env = useRuntimeConfig();
	const { data, ...rest } = useProjectInfo();

	const baseLayer = {
		url: env.public.mapTileLayerUrl,
		attribution: env.public.mapTileLayerAttribution,
	};

	const initialViewState = {
		center: data.value?.projectConfig?.map?.center as [number, number],
		zoom: data.value?.projectConfig?.map?.zoom,
	};

	const nearbyMarkersPopup = true; //data.value?.projectConfig?.map?.nearbyMarkersPopup as Boolean;

	const iconUrl = computed(() => {
		const url = data.value?.projectConfig?.icon;

		// TODO: default should be set via zod schema
		return url ?? "/assets/images/marker-icon.png";
	});

	return {
		data: {
			baseLayer,
			initialViewState,
			nearbyMarkersPopup,
			options: {
				minZoom: 2,
				maxZoom: 20,
				preferCanvas: true,
				zoomControl: false,
			},
			marker: {
				place: {
					autoPanOnFocus: false,
					icon: icon({
						iconAnchor: [7, 34],
						iconSize: [13, 35],
						iconUrl: iconUrl.value,
					}),
					riseOnHover: true,
				},
				region: {
					color: "hsl(320deg 30.1% 51.2%)",
					fillColor: "hsl(320deg 30.1% 51.2%)",
					radius: 10,
					weight: 1,
				},
			},
		},
		...rest,
	};
}
