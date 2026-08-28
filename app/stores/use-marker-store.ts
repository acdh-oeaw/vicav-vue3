import { assert, debounce } from "@acdh-oeaw/lib";
import Color from "colorjs.io";
import { defineStore } from "pinia";

import type { IconType } from "@/components/ui/icon-picker/IconPicker.vue";
import type { FeatureValueGroup } from "@/types/global.ts";

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

export type SerializedFeatureValueGroup = FeatureValueGroup;
export interface FeatureValueGroupInterface extends SerializedFeatureValueGroup {
	id: string;
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

	const featureValueGroups = ref(new Map<string, FeatureValueGroupInterface>());
	let featureValueGroupCounter = 0;

	const groupsByColumn = computed(() => {
		const index = new Map<string, Array<FeatureValueGroupInterface>>();
		featureValueGroups.value.forEach((group) => {
			const groups = index.get(group.columnId);
			if (groups) groups.push(group);
			else index.set(group.columnId, [group]);
		});
		return index;
	});

	const valueGroupKey = (columnId: string, value: string) => JSON.stringify([columnId, value]);

	const groupByValue = computed(() => {
		const index = new Map<string, FeatureValueGroupInterface>();
		featureValueGroups.value.forEach((group) => {
			group.values.forEach((value) => index.set(valueGroupKey(group.columnId, value), group));
		});
		return index;
	});

	function getFeatureValueGroups(columnId: string) {
		return groupsByColumn.value.get(columnId) ?? [];
	}

	function getFeatureValueGroup(columnId: string, value: string) {
		return groupByValue.value.get(valueGroupKey(columnId, value));
	}

	function isFeatureValueGroup(id: string) {
		return featureValueGroups.value.has(id);
	}

	function resolveMarkerId(columnId: string, value: string) {
		return getFeatureValueGroup(columnId, value)?.id ?? buildFeatureValueId(columnId, value);
	}

	function dissolveFeatureValueGroup(groupId: string) {
		if (!featureValueGroups.value.delete(groupId)) return;
		removeColor(groupId);
		markerSettings.value.triggerRepaint = true;
	}

	function updateFeatureValueGroupValues(group: FeatureValueGroupInterface, values: Array<string>) {
		if (values.length < 2) {
			dissolveFeatureValueGroup(group.id);
			return;
		}
		featureValueGroups.value.set(group.id, { ...group, values });
		markerSettings.value.triggerRepaint = true;
	}

	function detachValueFromFeatureValueGroups(columnId: string, value: string) {
		const group = getFeatureValueGroup(columnId, value);
		if (!group) return;
		updateFeatureValueGroupValues(
			group,
			group.values.filter((entry) => entry !== value),
		);
	}

	function createFeatureValueGroup(columnId: string, values: Array<string>, label?: string) {
		const uniqueValues = [...new Set(values)];
		if (uniqueValues.length < 2) return undefined;
		uniqueValues.forEach((value) => {
			detachValueFromFeatureValueGroups(columnId, value);
		});

		featureValueGroupCounter += 1;
		const groupKey = `group${String(featureValueGroupCounter)}`;
		const id = buildFeatureValueId(columnId, groupKey);
		addDefaultMarker(columnId, groupKey);

		const templateMarker = markers.value.get(buildFeatureValueId(columnId, uniqueValues[0]));
		if (templateMarker) {
			markers.value.set(id, { ...templateMarker, id });
			updateCssVariable({ id, colorCode: templateMarker.colorCode });
		}

		const group: FeatureValueGroupInterface = {
			id,
			columnId,
			label: label ?? `Group ${String(featureValueGroupCounter)}`,
			values: uniqueValues,
		};
		featureValueGroups.value.set(id, group);
		markerSettings.value.triggerRepaint = true;
		return group;
	}

	function addValueToFeatureValueGroup(groupId: string, value: string) {
		const group = featureValueGroups.value.get(groupId);
		if (!group || group.values.includes(value)) return;
		detachValueFromFeatureValueGroups(group.columnId, value);
		featureValueGroups.value.set(groupId, { ...group, values: [...group.values, value] });
		markerSettings.value.triggerRepaint = true;
	}

	function removeValueFromFeatureValueGroup(groupId: string, value: string) {
		const group = featureValueGroups.value.get(groupId);
		if (!group) return;
		updateFeatureValueGroupValues(
			group,
			group.values.filter((entry) => entry !== value),
		);
	}

	function renameFeatureValueGroup(groupId: string, label: string) {
		const group = featureValueGroups.value.get(groupId);
		if (!group) return;
		featureValueGroups.value.set(groupId, { ...group, label });
	}

	function serializeFeatureValueGroups(): Array<SerializedFeatureValueGroup> {
		return [...featureValueGroups.value.values()].map(({ columnId, label, values }) => ({
			columnId,
			label,
			values,
		}));
	}

	function restoreFeatureValueGroups(groups: Array<SerializedFeatureValueGroup>) {
		[...featureValueGroups.value.keys()].forEach((id) => {
			dissolveFeatureValueGroup(id);
		});
		groups.forEach((group) => {
			createFeatureValueGroup(group.columnId, group.values, group.label);
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
		if (!markers.value.has(color.id)) return;
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
		featureValueGroups,
		getFeatureValueGroups,
		getFeatureValueGroup,
		isFeatureValueGroup,
		resolveMarkerId,
		createFeatureValueGroup,
		addValueToFeatureValueGroup,
		removeValueFromFeatureValueGroup,
		renameFeatureValueGroup,
		dissolveFeatureValueGroup,
		serializeFeatureValueGroups,
		restoreFeatureValueGroups,
	};
});
