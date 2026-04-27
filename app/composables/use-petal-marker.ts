import type { Feature as GeoJsonFeature, Point } from "geojson";
import { divIcon, type LatLng, marker } from "leaflet";

import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import { useMarkerStore } from "@/stores/use-marker-store.ts";
import { ensureFilterValueMap } from "@/utils/filter-value-map";

import { useAdvancedQueries } from "./use-advanced-queries.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";
const { buildFeatureValueId, defaultMarkers } = useMarkerStore();
const { markers, markerSettings } = storeToRefs(useMarkerStore());
interface PetalEntry {
	id: string;
	strokeOnly?: boolean;
	type?: "feature" | "featureValue";
}

function isMarkerHidden(id: string) {
	return markers.value.get(id)?.hidden ?? false;
}

function getCircleSVG(fill: string, symmetrical = false, containerLength = 12) {
	const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	center.setAttribute("cx", symmetrical ? String(containerLength / 2) : "6");
	center.setAttribute("cy", symmetrical ? String(containerLength / 2) : "12");
	center.setAttribute("r", symmetrical ? "3" : "2.5");
	center.style.fill = fill;
	center.style.filter = "var(--greyscale)";

	return center;
}

function getIconSVG(petalValue: PetalEntry) {
	const petal = document.createElementNS("http://www.w3.org/2000/svg", "use");

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	let iconEntry = markers.value.get(petalValue.id)?.icon;
	if (markerSettings.value.flowerCenterId === petalValue.id && !petalValue.strokeOnly)
		iconEntry = defaultMarkers.circle;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	petal.setAttribute("href", `#${String(iconEntry?.name ?? "petal")}`);

	if (petalValue.strokeOnly) {
		petal.style.stroke = `var(--${petalValue.id}, #cccccc)`;
		petal.style.fillOpacity = "0.2";
		petal.style.strokeWidth =
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			iconEntry?.name === "petal" ? `calc(var(--strokeWidth, 4px) * 5)` : `var(--strokeWidth, 4px)`;
	}
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	if (iconEntry?.custom) {
		petal.style.fill = `var(--${petalValue.id}, #cccccc)`;
	} else {
		petal.style.stroke = `var(--${petalValue.id}, #cccccc)`;
		petal.style.strokeWidth = `var(--strokeWidth, 4px)`;
		petal.style.fill = `transparent`;
	}

	petal.style.transformOrigin = "bottom";
	petal.style.filter = "var(--greyscale)";

	petal.classList.add("size-3", "absolute", "ml-1.5");
	petal.setAttribute("title", petalValue.id);
	return petal;
}

function getMarkerSVG(petalValue: PetalEntry) {
	return getIconSVG(petalValue);
}

function getFlowerSVG(entries: Array<PetalEntry>, center?: PetalEntry) {
	const div = document.createElement("div");
	div.className = "hover:scale-150 transition origin-center relative -translate-y-1/2";
	const visibleEntries = entries.filter((entry) => !isMarkerHidden(entry.id));
	const visibleCenter = center && !isMarkerHidden(center.id) ? center : undefined;
	const NUM_PETALS = visibleEntries.length;
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("width", "12px");
	svg.setAttribute("height", "12px");
	svg.classList.add("overflow-visible");

	for (const [i, value] of visibleEntries.entries()) {
		const useLucideIcon =
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			markers.value.has(value.id) && !markers.value.get(value.id)?.icon?.custom;
		const petal = getMarkerSVG(value);
		petal.style.transform = `rotate(${String((i * 360) / NUM_PETALS)}deg) ${useLucideIcon && (visibleEntries.length > 1 || visibleCenter) ? "translateY(-3px)" : ""}`;
		svg.appendChild(petal);
	}

	if (visibleCenter && markerSettings.value.showCenter) {
		const centerMarker = getMarkerSVG(visibleCenter);
		centerMarker.style.transform = "translateY(6px)";
		svg.appendChild(centerMarker);
	}
	if (visibleEntries.length === 0 && !visibleCenter)
		svg.appendChild(getCircleSVG(`hsl(var(--color-primary))`));

	div.appendChild(svg);

	return div;
}

function getPetalMarker(feature: GeoJsonFeature<Point, MarkerProperties>, latlng: LatLng) {
	const { AND_OPERATOR } = useAdvancedQueries();
	const table = tables.value.get(url);
	const getFilterValue = (col: { getFilterValue: () => unknown }) =>
		ensureFilterValueMap(col.getFilterValue());
	const hasActiveFilters = (col: { getFilterValue: () => unknown }) => {
		const filterValue = getFilterValue(col);
		return filterValue.size > 0 || filterValue.exclude.size > 0;
	};
	const features = table
		?.getVisibleLeafColumns()
		.filter(
			(col) => col.getCanFilter() && Object.keys(feature.properties).find((k) => k === col.id),
		);
	const filteredFeaturesCount = table
		?.getVisibleLeafColumns()
		.filter((col) => col.getCanFilter()).length;
	let unfilteredFeatures =
		features?.filter((col) => !col.getIsFiltered() || !hasActiveFilters(col)) ?? [];
	if (features?.length === 1 && unfilteredFeatures.length === 1) unfilteredFeatures = [];
	const flowerCenter =
		features?.length === 1 && filteredFeaturesCount === 1 ? features[0] : undefined;

	const featureValues = table
		?.getVisibleLeafColumns()
		.filter((col) => col.getIsFiltered() && col.getFilterValue() && hasActiveFilters(col))
		.flatMap((col) => {
			const filterValue = getFilterValue(col);
			const featureValue = feature.properties[col.id as keyof MarkerProperties];

			return (typeof featureValue === "string" ? [featureValue] : Object.keys(featureValue ?? {}))
				.filter(
					(val) =>
						![...filterValue.keys()].find(
							(key) => key.includes(AND_OPERATOR) && key.includes(val),
						) ||
						[...filterValue.keys()].find((key) => !key.includes(AND_OPERATOR) && key.includes(val)),
				)
				.filter((val) => {
					return markerSettings.value.showOtherFeatureValues || filterValue.has(val);
				})
				.map((val) => ({
					id: filterValue.has(val) ? buildFeatureValueId(col.id, val) : col.id,
					// show "empty" petals for feature values that are not in the filter
					strokeOnly: !filterValue.has(val),
					type: "featureValue",
				}));
		});
	const combinedFilters = table
		?.getVisibleLeafColumns()
		.filter((col) => col.getIsFiltered() && col.getFilterValue() && hasActiveFilters(col))
		.flatMap((col) => {
			const filterValue = getFilterValue(col);
			const featureValue = feature.properties[col.id as keyof MarkerProperties];
			return [...filterValue.keys()]
				.filter(
					(key) =>
						key.includes(AND_OPERATOR) &&
						key
							.split(AND_OPERATOR)
							.every(
								(k) =>
									k in
									(typeof featureValue === "string"
										? { [featureValue]: true }
										: ((featureValue as object | undefined) ?? {})),
							),
				)
				.map((key) => ({
					id: buildFeatureValueId(col.id, key),
					type: "featureValue",
				}));
		});

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
