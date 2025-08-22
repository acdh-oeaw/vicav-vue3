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
	icon: IconType;
	colorCode: string;
}

export const useMarkerStore = defineStore("markers", () => {
	const markers = ref<Map<MarkerInterface["id"], MarkerInterface>>(new Map());
	const markerSettings = ref({
		flowerCenterId: null as string | null,
		strokeWidth: 4,
		greyscale: false,
		showCenter: true,
		showOtherFeatureValues: true,
		triggerRepaint: false,
	});
	const defaultMarkers = {
		circle: {
			name: "circle-small",
			custom: true,
		},
		petal: {
			name: "petal",
			custom: true,
			additionalAttributes: {
				"stroke-width": "40",
				height: "90%",
				y: "5%",
			},
		},
	};

	const buildFeatureValueId = (columnId: string, feature: string) =>
		encodeURIComponent(`${columnId}-${feature}`).replaceAll(/%|\./g, "");

	/* General Marker Settings */
	function updateSettingVariables() {
		document.documentElement.style.setProperty(
			"--greyscale",
			`grayscale(${String(Number(markerSettings.value.greyscale))})`,
		);
		document.documentElement.style.setProperty(
			"--strokeWidth",
			`${String(markerSettings.value.strokeWidth)}px`,
		);
	}
	updateSettingVariables();

	watch(
		markerSettings,
		() => {
			updateSettingVariables();
		},
		{ deep: true },
	);

	watch(
		[
			() => markerSettings.value.showCenter,
			() => markerSettings.value.showOtherFeatureValues,
			() => markerSettings.value.flowerCenterId,
		],
		() => {
			markerSettings.value.triggerRepaint = true;
		},
	);

	/* Setting and updating colors */
	const refColor = ref(
		// `hsl(${document.documentElement.style.getPropertyValue("--color-primary")})`,
		`hsl(-57.76924deg 26.53061224489796% 51.9607843137255%)`,
	);

	function updateColorValue(color: ColorInterface) {
		assert(markers.value.has(color.id), `Entry not found in markers ${color.id}`);
		markers.value.set(color.id, { ...markers.value.get(color.id)!, colorCode: color.colorCode });
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
		return color;
	}

	function addColorVariant(baseId: ColorInterface["id"], subId: ColorInterface["id"]) {
		if (!markers.value.has(baseId)) addColor(baseId);
		const baseColor = markers.value.get(baseId)?.colorCode;

		const newColor = new Color(baseColor!).to("lch");
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
		markers.value.delete(id);
	}

	function addDefaultMarker(baseId: MarkerInterface["id"], subId?: MarkerInterface["id"]) {
		if (subId && !markers.value.has(baseId)) addDefaultMarker(baseId);
		if (markers.value.get(baseId)) {
			assert(markers.value.get(baseId) != null);
			setMarker({
				id: subId ? buildFeatureValueId(baseId, subId) : baseId,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				icon: markers.value.get(baseId)!.icon,
				colorCode: "",
			});
		} else
			setMarker({
				id: subId ? buildFeatureValueId(baseId, subId) : baseId,
				icon: defaultMarkers.petal,
				colorCode: "",
			});
		if (subId) addColorVariant(baseId, subId);
		else addColor(baseId);
	}

	function setMarker(marker: MarkerInterface) {
		let repaint = false;
		if (markers.value.get(marker.id)?.icon !== marker.icon) repaint = true;
		markers.value.set(marker.id, marker);
		if (marker.colorCode !== "") {
			setColor(marker);
		}
		if (repaint) {
			markerSettings.value.triggerRepaint = true;
		}
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
		addDefaultMarker,
		setMarker,
		removeMarker,
		markers,
		markerSettings,
		defaultMarkers,
	};
});
