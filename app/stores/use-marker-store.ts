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
	hidden?: boolean;
}
interface MarkerStyleInterface {
	icon?: IconType;
	colorCode?: string;
}
function buildVariantColor(baseColor: string) {
	const newColor = new Color(baseColor).to("lch");
	newColor.l = Math.random() * 60 + 20; //lightness values from 20 to 80
	return newColor.toGamut({ space: "srgb" }).to("srgb").toString({ format: "hex" });
}

export const useMarkerStore = defineStore("markers", () => {
	const markers = ref(new Map<MarkerInterface["id"], MarkerInterface>());
	const markerSettings = ref({
		flowerCenterId: null as string | null,
		strokeWidth: 4,
		size: 12,
		greyscale: false,
		showCenter: true,
		showOtherFeatureValues: false,
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

	const buildFeatureValueId = (columnId: string, feature?: string) =>
		encodeURIComponent(
			`${columnId}-${(feature ?? "").replaceAll(/[`~!@#$%^&*()_|+\-=?;:'",.<>{}[\]\\/]/g, "")}`,
		).replaceAll(/[()%\\]/g, "");

	function forEachUnderlyingFeatureValue(
		featureId: string,
		updateEntry: (entry: MarkerInterface, id: string) => void,
	) {
		const featureValuePrefix = buildFeatureValueId(featureId, "");
		markers.value.forEach((entry, id) => {
			if (id !== featureId && id.startsWith(featureValuePrefix)) {
				updateEntry(entry, id);
			}
		});
	}

	function hasUnderlyingFeatureValues(featureId: string) {
		let hasUnderlyingValues = false;
		forEachUnderlyingFeatureValue(featureId, () => {
			hasUnderlyingValues = true;
		});
		return hasUnderlyingValues;
	}

	function setUnderlyingFeatureValuesHidden(featureId: string, hidden: boolean) {
		forEachUnderlyingFeatureValue(featureId, (entry, id) => {
			if (entry.hidden !== hidden) {
				markers.value.set(id, { ...entry, hidden });
			}
		});
	}

	function applyStyleToUnderlyingFeatureValues(featureId: string, style: MarkerStyleInterface) {
		forEachUnderlyingFeatureValue(featureId, (entry, id) => {
			if (entry.icon !== style.icon) {
				markerSettings.value.triggerRepaint = true;
			}
			const updatedEntry: MarkerInterface = {
				...entry,
				...style,
			};
			markers.value.set(id, updatedEntry);
			if (style.colorCode) {
				updateCssVariable({ id, colorCode: style.colorCode });
				updateColorValue({ id, colorCode: style.colorCode });
			}
		});
	}

	function generateColorVariantsForFeatureValues(featureId: string) {
		if (!markers.value.has(featureId)) addColor(featureId);
		const baseColor = markers.value.get(featureId)?.colorCode;
		assert(baseColor != null, `Base marker color not found for ${featureId}`);

		forEachUnderlyingFeatureValue(featureId, (_entry, id) => {
			const colorCode = buildVariantColor(baseColor);
			updateCssVariable({ id, colorCode });
			updateColorValue({ id, colorCode });
		});
	}

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
			() => markerSettings.value.size,
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
		assert(baseColor != null, `Base marker color not found for ${baseId}`);

		const color: ColorInterface = {
			id: buildFeatureValueId(baseId, subId),
			colorCode: buildVariantColor(baseColor),
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
		const inheritedHidden = subId ? (markers.value.get(baseId)?.hidden ?? false) : false;
		if (markers.value.get(baseId)) {
			assert(markers.value.get(baseId) != null);
			setMarker({
				id: subId ? buildFeatureValueId(baseId, subId) : baseId,
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				icon: markers.value.get(baseId)!.icon,
				colorCode: "",
				hidden: inheritedHidden,
			});
		} else
			setMarker({
				id: subId ? buildFeatureValueId(baseId, subId) : baseId,
				icon: defaultMarkers.petal,
				colorCode: "",
				hidden: inheritedHidden,
			});
		if (subId) addColorVariant(baseId, subId);
		else addColor(baseId);
	}

	function setMarker(marker: MarkerInterface) {
		let repaint = false;
		if (markers.value.get(marker.id)?.icon !== marker.icon) repaint = true;
		if (markers.value.get(marker.id)?.hidden !== marker.hidden) repaint = true;
		markers.value.set(marker.id, { hidden: false, ...marker });
		if (!marker.id.includes("-")) {
			setUnderlyingFeatureValuesHidden(marker.id, marker.hidden ?? false);
		}
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
		applyStyleToUnderlyingFeatureValues,
		generateColorVariantsForFeatureValues,
		hasUnderlyingFeatureValues,
		removeMarker,
		markers,
		markerSettings,
		defaultMarkers,
	};
});
