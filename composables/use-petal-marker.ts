import type { Column } from "@tanstack/vue-table";
import type { Feature as GeoJsonFeature, Point } from "geojson";
import { divIcon, type LatLng, marker } from "leaflet";

import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";
const { buildFeatureValueId } = useColorsStore();

function getPetalSVG(entries: Array<Column<never>>) {
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
	const columns = table
		?.getVisibleLeafColumns()
		.filter(
			(col) =>
				col.getCanFilter() &&
				(col.getFilterValue() as Map<string, unknown>).size === 0 &&
				Object.keys(feature.properties).find((k) => k === col.id),
		);

	const featureValues = table
		?.getVisibleLeafColumns()
		.filter((col) => col.getIsFiltered())
		.flatMap((col) =>
			[...(col.getFilterValue() as Map<string, unknown>).keys()]
				.filter((val) => val in (feature.properties[col.id as keyof MarkerProperties] as object))
				.map((val) => ({
					id: buildFeatureValueId(col.id, val),
				})),
		);

	//@ts-expect-error missing accessorFn
	const htmlContent = getPetalSVG(columns?.concat(featureValues)).outerHTML; // Example HTML content
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
