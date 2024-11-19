import type { Column } from "@tanstack/vue-table";
import type { Feature as GeoJsonFeature, Point } from "geojson";
import { divIcon, type LatLng, marker } from "leaflet";

//@ts-expect-error asset not found
import petal from "@/assets/petal.svg?raw";
import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

const sampleColors = [
	"#555b6e",
	"#6f868e",
	"#89b0ae",
	"#a4cac5",
	"#bee3db",
	"#CF9997",
	"#C14444",
	"#ffd6ba",
];

function getPetalSVG(entries: Array<Column<never>>) {
	const div = document.createElement("div");
	div.className = "hover:scale-150 transition origin-center relative size-6";
	const NUM_PETALS = entries.length;
	for (const [i, value] of entries.entries()) {
		const svg = document.createElement("svg");
		svg.setHTMLUnsafe(String(petal));
		svg.setAttribute("fill", sampleColors[i % sampleColors.length] ?? "#cccccc");
		svg.style.transformOrigin = "bottom";
		svg.style.transform = `rotate(${String((i * 360) / NUM_PETALS)}deg)`;
		svg.className = "size-3 absolute ml-1.5";
		svg.title = value.id;
		div.appendChild(svg);
	}

	return div;
}

export function usePetalMarker(feature: GeoJsonFeature<Point, MarkerProperties>, latlng: LatLng) {
	const table = tables.value.get(url);
	const columns = table
		?.getVisibleLeafColumns()
		.filter(
			(col) => col.getCanFilter() && Object.keys(feature.properties).find((k) => k === col.id),
		);
	//@ts-expect-error missing accessorFn
	const htmlContent = getPetalSVG(columns).outerHTML; // Example HTML content
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
