import type { Feature as GeoJsonFeature, Point } from "geojson";
import { divIcon, type LatLng, marker } from "leaflet";

import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import { useMarkerStore } from "@/stores/use-marker-store.ts";

import { useAdvancedQueries } from "./use-advanced-queries.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";
const { buildFeatureValueId } = useMarkerStore();
const { markers, markerSettings } = storeToRefs(useMarkerStore());
interface PetalEntry {
	id: string;
	strokeOnly?: boolean;
	type?: "feature" | "featureValue";
}

function getCircleSVG(fill: string, symmetrical = false, containerLength = 12) {
	const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	circle.setAttribute("cx", symmetrical ? String(containerLength / 2) : "6");
	circle.setAttribute("cy", symmetrical ? String(containerLength / 2) : "12");
	circle.setAttribute("r", symmetrical ? "3" : "2.5");
	circle.style.fill = fill;
	circle.style.filter = "var(--greyscale)";

	return circle;
}

function getPetalSVG(petalValue: PetalEntry) {
	const petal = document.createElementNS("http://www.w3.org/2000/svg", "use");
	petal.setAttribute("href", "#petal");

	if (petalValue.strokeOnly) {
		petal.style.stroke = `var(--${petalValue.id}, #cccccc)`;
		petal.style.fillOpacity = "0.2";
		petal.style.strokeWidth = `calc(var(--strokeWidth, 4px) * 5)`;
	}
	petal.style.fill = `var(--${petalValue.id}, #cccccc)`;
	petal.style.transformOrigin = "bottom";
	petal.style.filter = "var(--greyscale)";

	petal.classList.add("size-3", "absolute", "ml-1.5");
	petal.setAttribute("title", petalValue.id);
	return petal;
}

function getIconSVG(petalValue: PetalEntry) {
	const petal = document.createElementNS("http://www.w3.org/2000/svg", "use");
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	petal.setAttribute("href", `#${String(markers.value.get(petalValue.id)?.marker?.name ?? "")}`);

	petal.style.stroke = `var(--${petalValue.id}, #cccccc)`;
	petal.style.strokeWidth = `var(--strokeWidth, 4px)`;
	petal.style.fill = `transparent`;
	petal.style.transformOrigin = "bottom";
	petal.style.filter = "var(--greyscale)";

	petal.classList.add("size-3", "absolute", "ml-1.5");
	petal.setAttribute("title", petalValue.id);
	return petal;
}

function getMarkerSVG(petalValue: PetalEntry) {
	const useLucideIcon =
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		markers.value.has(petalValue.id) && !markers.value.get(petalValue.id)?.marker?.custom;
	return useLucideIcon ? getIconSVG(petalValue) : getPetalSVG(petalValue);
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
		const useLucideIcon =
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			markers.value.has(value.id) && !markers.value.get(value.id)?.marker?.custom;
		const petal = getMarkerSVG(value);
		petal.style.transform = `rotate(${String((i * 360) / NUM_PETALS)}deg) ${useLucideIcon && (entries.length > 1 || center) ? "translateY(-3px)" : ""}`;
		svg.appendChild(petal);
	}

	if (center && markerSettings.value.showCenter)
		svg.appendChild(getCircleSVG(`var(--${center.id}, #cccccc)`));
	if (entries.length === 0 && !center) svg.appendChild(getCircleSVG(`hsl(var(--color-primary))`));

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
				.filter((val) => {
					return (
						markerSettings.value.showOtherFeatureValues ||
						(col.getFilterValue() as Map<string, unknown>).has(val)
					);
				})
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
		getMarkerSVG,
		getCircleSVG,
	};
}
