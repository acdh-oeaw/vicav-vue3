import type { Feature as GeoJsonFeature, Point } from "geojson";
import { divIcon, type LatLng, marker } from "leaflet";

import { isCharacterIcon } from "@/components/ui/icon-picker/character-icons.ts";
import type { MarkerProperties } from "@/lib/api-client";
import { useGeojsonStore } from "@/stores/use-geojson-store.ts";
import { useMarkerStore } from "@/stores/use-marker-store.ts";
import { ensureFilterValueMap } from "@/utils/filter-value-map";

import { useAdvancedQueries } from "./use-advanced-queries.ts";

const GeojsonStore = useGeojsonStore();
const { defaultMarkers, isFeatureValueGroup, resolveMarkerId } = useMarkerStore();
const { markers, markerSettings } = storeToRefs(useMarkerStore());
interface PetalEntry {
	color?: string;
	id: string;
	strokeOnly?: boolean;
	type?: "feature" | "featureValue";
}

function isMarkerHidden(id: string) {
	return markers.value.get(id)?.hidden ?? false;
}

function getCircleSVG(
	fill: string,
	symmetrical = false,
	containerLength = markerSettings.value.size,
) {
	const center = document.createElementNS("http://www.w3.org/2000/svg", "circle");
	center.setAttribute(
		"cx",
		symmetrical ? String(containerLength / 2) : String(markerSettings.value.size / 2),
	);
	center.setAttribute(
		"cy",
		symmetrical ? String(containerLength / 2) : String(markerSettings.value.size),
	);
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
	} else if (petalValue.color) {
		petal.style.fill = petalValue.color;
		petal.style.stroke = "white";
		petal.style.strokeWidth = "var(--strokeWidth, 4px)";
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

/** the length the `size-3` class gives every marker icon */
const ICON_LENGTH = 12;

function getUprightTransform(angle: number) {
	const x = (ICON_LENGTH - markerSettings.value.size) / 2;
	const y = ICON_LENGTH / 2 - markerSettings.value.size;
	return `translate(${String(x)}px, ${String(y)}px) rotate(${String(-angle)}deg) translate(${String(-x)}px, ${String(-y)}px)`;
}

function getFlowerSVG(entries: Array<PetalEntry>, center?: PetalEntry) {
	const div = document.createElement("div");
	div.className = "hover:scale-150 transition origin-center relative -translate-y-1/2";
	const visibleEntries = entries.filter((entry) => !isMarkerHidden(entry.id));
	const visibleCenter = center && !isMarkerHidden(center.id) ? center : undefined;
	const NUM_PETALS = visibleEntries.length;
	const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute("width", `${String(markerSettings.value.size)}px`);
	svg.setAttribute("height", `${String(markerSettings.value.size)}px`);
	svg.classList.add("overflow-visible");

	for (const [i, value] of visibleEntries.entries()) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const icon = markers.value.get(value.id)?.icon;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const isCharacter = isCharacterIcon(icon);
		// unlike the petal, lucide icons and characters are drawn around their own
		// center, so they have to be pushed outwards to not overlap each other
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const isCenteredIcon = markers.value.has(value.id) && (!icon?.custom || isCharacter);
		const angle = (i * 360) / NUM_PETALS;
		const petal = getMarkerSVG(value);
		petal.style.transform = `rotate(${String(angle)}deg) ${isCenteredIcon && (visibleEntries.length > 1 || visibleCenter) ? "translateY(-3px)" : ""} ${isCharacter ? getUprightTransform(angle) : ""}`;
		svg.appendChild(petal);
	}

	if (visibleCenter && markerSettings.value.showCenter) {
		const centerMarker = getMarkerSVG(visibleCenter);
		centerMarker.style.transform = `translateY(${String(markerSettings.value.size / 2)}px)`;
		svg.appendChild(centerMarker);
	}
	if (visibleEntries.length === 0 && !visibleCenter)
		svg.appendChild(getCircleSVG(`hsl(var(--color-primary))`));

	div.appendChild(svg);

	return div;
}

function getDataListMarkerSVG(colors: Array<string>) {
	return getFlowerSVG(
		colors.map((color, index) => ({ color, id: `data-list-petal-${String(index)}` })),
	);
}

function getPetalMarker(feature: GeoJsonFeature<Point, MarkerProperties>, latlng: LatLng) {
	const { AND_OPERATOR } = useAdvancedQueries();
	const table = GeojsonStore.table;
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
				.map(
					(val): PetalEntry => ({
						id: filterValue.has(val) ? resolveMarkerId(col.id, val) : col.id,
						// show "empty" petals for feature values that are not in the filter
						strokeOnly: !filterValue.has(val),
						type: "featureValue",
					}),
				);
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
				.map(
					(key): PetalEntry => ({
						id: resolveMarkerId(col.id, key),
						type: "featureValue",
					}),
				);
		});

	const petalEntries: Array<PetalEntry> = [...(featureValues ?? []), ...(combinedFilters ?? [])];
	// values that were grouped together share a marker and are drawn as a single petal
	const seenGroupIds = new Set<string>();
	const groupedFeatureValues = petalEntries.filter((entry) => {
		if (!isFeatureValueGroup(entry.id)) return true;
		if (seenGroupIds.has(entry.id)) return false;
		seenGroupIds.add(entry.id);
		return true;
	});

	const htmlContent = getFlowerSVG(
		//@ts-expect-error missing accessorFn
		unfilteredFeatures.concat(groupedFeatureValues),
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
		getDataListMarkerSVG,
		getPetalMarker,
		getMarkerSVG,
		getCircleSVG,
	};
}
