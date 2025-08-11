import { defineStore } from "pinia";

interface MarkerInterface {
	id: string;
	markerSVG: string;
}

const { buildFeatureValueId } = useColorsStore();

export const useMarkerStore = defineStore("markers", () => {
	const markers = shallowRef<Map<MarkerInterface["id"], MarkerInterface>>(new Map());

	function addDefaultMarker(baseId: MarkerInterface["id"], subId: MarkerInterface["id"]) {
		if (markers.value.get(baseId))
			setMarker({
				id: buildFeatureValueId(baseId, subId),
				markerSVG: markers.value.get(baseId)!.markerSVG,
			});
		else setMarker({ id: buildFeatureValueId(baseId, subId), markerSVG: "circle" });
	}

	function setMarker(marker: MarkerInterface) {
		markers.value.set(marker.id, marker);
	}

	function removeMarker(id: MarkerInterface["id"]) {
		markers.value.delete(id);
	}

	return {
		addDefaultMarker,
		setMarker,
		removeMarker,
		markers,
	};
});
