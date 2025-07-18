import type { Feature as GeoJsonFeature, Point } from "geojson";
import { divIcon, type LatLng, marker } from "leaflet";

import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";

import { useAdvancedQueries } from "./use-advanced-queries.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";
const { buildFeatureValueId } = useColorsStore();
interface PetalEntry {
	id: string;
	strokeOnly?: boolean;
	type?: "feature" | "featureValue";
}

function getCircleSVG(fill: string) {
	const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	circle.setAttribute("cx", "6");
	circle.setAttribute("cy", "12");
	circle.setAttribute("r", "2.5");
	circle.style.fill = fill;

	return circle;
}

function getPetalSVG(petalValue: PetalEntry) {
	const petal = document.createElementNS("http://www.w3.org/2000/svg", "use");
	petal.setAttribute("href", "#petal");

	if (petalValue.strokeOnly) {
		petal.style.stroke = `var(--${petalValue.id}, #cccccc)`;
		petal.style.fillOpacity = "0.2";
		petal.style.strokeWidth = "20px";
	}
	petal.style.fill = `var(--${petalValue.id}, #cccccc)`;
	petal.style.transformOrigin = "bottom";

	petal.classList.add("size-3", "absolute", "ml-1.5");
	petal.setAttribute("title", petalValue.id);
	return petal;
}

function getFlowerSVG(entries: Array<PetalEntry>, center?: PetalEntry) {
	const div = document.createElement("div");
	div.className = "hover:scale-150 transition origin-center relative -translate-y-1/2";
	const NUM_PETALS = entries.length;
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("width", "12px");
	svg.setAttribute("height", "12px");
	svg.classList.add("overflow-visible");

	for (const [i, value] of entries.entries()) {
		const petal = getPetalSVG(value);
		petal.style.transform = `rotate(${String((i * 360) / NUM_PETALS)}deg)`;
		svg.appendChild(petal);
	}

	if (center) svg.appendChild(getCircleSVG(`var(--${center.id}, #cccccc)`));

	div.appendChild(svg);

	return div;
}

function getPetalMarker(feature: GeoJsonFeature<Point, MarkerProperties>, latlng: LatLng) {
	const { AND_OPERATOR } = useAdvancedQueries();
	const table = tables.value.get(url);
	const features = table
		?.getVisibleLeafColumns()
		.filter(
			(col) => col.getCanFilter() && Object.keys(feature.properties).find((k) => k === col.id),
		);
	let unfilteredFeatures =
		features?.filter(
			(col) => !col.getIsFiltered() || (col.getFilterValue() as Map<string, unknown>).size === 0,
		) ?? [];
	if (features?.length === 1 && unfilteredFeatures.length === 1) unfilteredFeatures = [];
	const flowerCenter = features?.length === 1 ? features[0] : undefined;

	const featureValues = table
		?.getVisibleLeafColumns()
		.filter(
			(col) =>
				col.getIsFiltered() &&
				col.getFilterValue() &&
				(col.getFilterValue() as Map<string, unknown>).size > 0,
		)
		.flatMap((col) =>
			Object.keys(feature.properties[col.id as keyof MarkerProperties] ?? {})
				.filter(
					(val) =>
						![...(col.getFilterValue() as Map<string, unknown>).keys()].find(
							(key) => key.includes(AND_OPERATOR) && key.includes(val),
						) ||
						[...(col.getFilterValue() as Map<string, unknown>).keys()].find(
							(key) => !key.includes(AND_OPERATOR) && key.includes(val),
						),
				)
				.map((val) => ({
					id: (col.getFilterValue() as Map<string, unknown>).has(val)
						? buildFeatureValueId(col.id, val)
						: col.id,
					// show "empty" petals for feature values that are not in the filter
					strokeOnly: !(col.getFilterValue() as Map<string, unknown>).has(val),
					type: "featureValue",
				})),
		);
	const combinedFilters = table
		?.getVisibleLeafColumns()
		.filter(
			(col) =>
				col.getIsFiltered() &&
				col.getFilterValue() &&
				(col.getFilterValue() as Map<string, unknown>).size > 0,
		)
		.flatMap((col) =>
			[...(col.getFilterValue() as Map<string, unknown>).keys()]
				.filter(
					(key) =>
						key.includes(AND_OPERATOR) &&
						key
							.split(AND_OPERATOR)
							.every(
								(k) =>
									k in
									((feature.properties[col.id as keyof MarkerProperties] as object | undefined) ??
										{}),
							),
				)
				.map((key) => ({
					id: buildFeatureValueId(col.id, key),
					type: "featureValue",
				})),
		);

	const htmlContent = getFlowerSVG(
		//@ts-expect-error missing accessorFn
		unfilteredFeatures.concat(featureValues).concat(combinedFilters),
		flowerCenter,
	).outerHTML; // Example HTML content
	const customIcon = divIcon({
		html: htmlContent,
		className: "custom-marker-icon", // Add custom CSS class for styling
		// iconSize: [30, 30], // Adjust size as needed
	});

	const leafletMarker = marker(latlng, {
		icon: customIcon,
		riseOnHover: true,
	});
	return leafletMarker;
}

export function usePetalMarker() {
	return {
		getPetalMarker,
		getPetalSVG,
	};
}
