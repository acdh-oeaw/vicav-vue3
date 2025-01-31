import type { Feature as GeoJsonFeature, Point } from "geojson";
import { divIcon, type LatLng, marker } from "leaflet";

import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";
const { buildFeatureValueId } = useColorsStore();

interface PetalEntry {
	id: string;
	strokeOnly?: boolean;
}

function getPetalSVG(entries: Array<PetalEntry>) {
	const div = document.createElement("div");
	div.className = "hover:scale-150 transition origin-center relative size-6";
	const NUM_PETALS = entries.length;
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("width", "12px");
	svg.setAttribute("height", "12px");
	svg.classList.add("overflow-visible");

	for (const [i, value] of entries.entries()) {
		const petal = document.createElementNS("http://www.w3.org/2000/svg", "use");
		petal.setAttribute("href", "#petal");

		if (value.strokeOnly) {
			petal.style.stroke = `var(--${value.id}, #cccccc)`;
			petal.style.fillOpacity = "0.2";
			petal.style.strokeWidth = "20px";
		}
		petal.style.fill = `var(--${value.id}, #cccccc)`;
		petal.style.transformOrigin = "bottom";
		petal.style.transform = `rotate(${String((i * 360) / NUM_PETALS)}deg)`;
		petal.classList.add("size-3", "absolute", "ml-1.5");
		petal.setAttribute("title", value.id);
		svg.appendChild(petal);
	}

	div.appendChild(svg);

	return div;
}

export function usePetalMarker(feature: GeoJsonFeature<Point, MarkerProperties>, latlng: LatLng) {
	const table = tables.value.get(url);
	const features = table
		?.getVisibleLeafColumns()
		.filter(
			(col) =>
				col.getCanFilter() &&
				(col.getFilterValue() as Map<string, unknown>).size === 0 &&
				Object.keys(feature.properties).find((k) => k === col.id),
		);

	const featureValues = table
		?.getVisibleLeafColumns()
		.filter(
			(col) =>
				col.getIsFiltered() &&
				col.getFilterValue() &&
				(col.getFilterValue() as Map<string, unknown>).size > 0,
		)
		.flatMap((col) =>
			Object.keys(feature.properties[col.id as keyof MarkerProperties] ?? {}).map((val) => ({
				id: (col.getFilterValue() as Map<string, unknown>).has(val)
					? buildFeatureValueId(col.id, val)
					: col.id,
				// show "empty" petals for feature values that are not in the filter
				strokeOnly: !(col.getFilterValue() as Map<string, unknown>).has(val),
			})),
		);

	//@ts-expect-error missing accessorFn
	const htmlContent = getPetalSVG(features?.concat(featureValues)).outerHTML; // Example HTML content
	const customIcon = divIcon({
		html: htmlContent,
		className: "custom-marker-icon size-5", // Add custom CSS class for styling
		// iconSize: [30, 30], // Adjust size as needed
	});

	const leafletMarker = marker(latlng, {
		icon: customIcon,
	});
	return leafletMarker;
}
