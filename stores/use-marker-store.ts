import { assert, debounce } from "@acdh-oeaw/lib";
import Color from "colorjs.io";
import { defineStore } from "pinia";

import type { IconType } from "@/components/ui/icon-picker/IconPicker.vue";

interface ColorInterface {
	id: string;
	colorCode: string;
}
interface MarkerInterface {
	id: string;
	markerSVG?: string;
	marker: IconType;
}

export const useMarkerStore = defineStore("markers", () => {
	const colors = shallowRef<Map<ColorInterface["id"], ColorInterface>>(new Map());
	const markers = shallowRef<Map<MarkerInterface["id"], MarkerInterface>>(new Map());

	const refColor = ref(
		// `hsl(${document.documentElement.style.getPropertyValue("--color-primary")})`,
		`hsl(-57.76924deg 26.53061224489796% 51.9607843137255%)`,
	);
	const buildFeatureValueId = (columnId: string, feature: string) =>
		encodeURIComponent(`${columnId}-${feature}`).replaceAll(/%|\./g, "");

	function updateColorValue(color: ColorInterface) {
		colors.value.set(color.id, color);
		refColor.value = color.colorCode;
	}

	function updateCssVariable(color: ColorInterface) {
		document.documentElement.style.setProperty(`--${color.id}`, color.colorCode);
	}

	const colorUpdateDebounce = debounce((color: ColorInterface) => {
		updateColorValue(color);
	}, 500);

	function setColor(color: ColorInterface) {
		updateCssVariable(color);
		colorUpdateDebounce(color);
	}

	function addColor(id: ColorInterface["id"]) {
		const lastColor = new Color(refColor.value).to("lch");
		lastColor.h += 79;
		const color: ColorInterface = {
			id: id,

			colorCode: lastColor.toGamut({ space: "srgb" }).to("srgb").toString({ format: "hex" }),
		};
		updateCssVariable(color);
		updateColorValue(color);
	}

	function addColorVariant(baseId: ColorInterface["id"], subId: ColorInterface["id"]) {
		if (!colors.value.has(baseId)) addColor(baseId);
		const baseColor = colors.value.get(baseId);

		const newColor = new Color(baseColor!.colorCode).to("lch");
		newColor.l = Math.random() * 60 + 20; //lightness values from 20 to 80

		const color: ColorInterface = {
			id: buildFeatureValueId(baseId, subId),
			colorCode: newColor.toGamut({ space: "srgb" }).to("srgb").toString({ format: "hex" }),
		};
		updateCssVariable(color);
		updateColorValue(color);
	}

	function removeColor(id: ColorInterface["id"]) {
		document.documentElement.style.removeProperty(`--${id}`);
		colors.value.delete(id);
	}

	function addDefaultMarker(baseId: MarkerInterface["id"], subId: MarkerInterface["id"]) {
		if (markers.value.get(baseId)) {
			assert(markers.value.get(baseId) != null);
			setMarker({
				id: buildFeatureValueId(baseId, subId),
				markerSVG: markers.value.get(baseId)!.markerSVG,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				marker: markers.value.get(baseId)!.marker,
			});
		} else
			setMarker({
				id: buildFeatureValueId(baseId, subId),
				marker: {
					name: "petal",
					custom: true,
					additionalAttributes: {
						fill: "transparent",
						stroke: "black",
						"stroke-width": "40",
						height: "90%",
						y: "5%",
					},
				},
			});
	}

	function setMarker(marker: MarkerInterface) {
		markers.value.set(marker.id, marker);
	}

	function removeMarker(id: MarkerInterface["id"]) {
		markers.value.delete(id);
	}

	return {
		addColor,
		addColorVariant,
		setColor,
		removeColor,
		buildFeatureValueId,
		colors,
		addDefaultMarker,
		setMarker,
		removeMarker,
		markers,
	};
});
