// Adapted from https://reka-ui.com/examples/combobox-textarea

import { storeToRefs } from "pinia";

import { useGeojsonStore } from "@/stores/use-geojson-store.ts";

const GeojsonStore = useGeojsonStore();
const { tables } = storeToRefs(GeojsonStore);
const url = "https://raw.githubusercontent.com/wibarab/wibarab-data/main/wibarab_varieties.geojson";

function getFeatureList() {
	const table = tables.value.get(url);
	if (!table) return [];
	const features = table
		.getAllLeafColumns()
		.filter((column) => column.getCanFilter())
		.map((column) => ({
			value: `${column.id}:`,
			listValue: column.columnDef.header!,
			col: column,
		}));
	return features;
}
const features = computed(() => getFeatureList());

function getValueList(columns: typeof features.value) {
	return columns
		.map((item) =>
			[...item.col.getFacetedUniqueValues().keys()].map((key: string) => ({
				value: `:"${key}"`,
				listValue: key,
				col: item.col,
			})),
		)
		.flat();
}

function getTriggerOffset(element: HTMLTextAreaElement, triggers = defaultTriggers.value) {
	const { value, selectionStart } = element;
	for (let i = selectionStart; i >= 0; i--) {
		for (const trigger of triggers) {
			if (value.substring(i - trigger.length + 1, i + 1) === trigger) {
				return i - trigger.length + 1;
			}
		}
	}
	return -1;
}

function getTrigger(element: HTMLTextAreaElement, triggers = defaultTriggers.value) {
	const { value, selectionStart } = element;
	for (const trigger of triggers) {
		const triggerStart = selectionStart - trigger.length;
		if (triggerStart >= 0 && value.substring(triggerStart, selectionStart) === trigger) {
			const secondPreviousChar = value[triggerStart - 1];
			const isIsolated = !secondPreviousChar || /\s/.test(secondPreviousChar);
			if (isIsolated) {
				return trigger;
			}
		}
	}
	return null;
}

function getSearchValue(element: HTMLTextAreaElement, triggers = defaultTriggers.value) {
	const offset = getTriggerOffset(element, triggers);
	const trigger = getTrigger(element, triggers);
	if (offset === -1) return "";
	return element.value.slice(offset + (trigger?.length ?? 0), element.selectionStart);
}

function getAnchorRect(element: HTMLTextAreaElement, triggers = defaultTriggers.value) {
	const offset = getTriggerOffset(element, triggers);
	const { left, top, height } = getCaretCoordinates(element, offset + 1);
	const { x, y } = element.getBoundingClientRect();
	return {
		x: left + x - element.scrollLeft,
		y: top + y - element.scrollTop,
		height,
	};
}

function replaceValue(
	prevValue: string,
	offset: number,
	searchValue: string,
	displayValue: string,
	triggerValue: string,
) {
	const nextValue = `${
		prevValue.slice(0, offset) + displayValue
	}${triggerValue === ":" ? "" : " "}${prevValue.slice(offset + triggerValue.length + searchValue.length + 1)}`;
	return nextValue;
}

// reference: https://github.com/component/textarea-caret-position/blob/master/index.js
interface CaretCoordinates {
	top: number;
	left: number;
	height: number;
}

interface CaretOptions {
	debug?: boolean;
}

const properties: Array<keyof CSSStyleDeclaration> = [
	"direction",
	"boxSizing",
	"width",
	"height",
	"overflowX",
	"overflowY",
	"borderTopWidth",
	"borderRightWidth",
	"borderBottomWidth",
	"borderLeftWidth",
	"borderStyle",
	"paddingTop",
	"paddingRight",
	"paddingBottom",
	"paddingLeft",
	"fontStyle",
	"fontVariant",
	"fontWeight",
	"fontStretch",
	"fontSize",
	"fontSizeAdjust",
	"lineHeight",
	"fontFamily",
	"textAlign",
	"textTransform",
	"textIndent",
	"textDecoration",
	"letterSpacing",
	"wordSpacing",
	"tabSize",
];

const isBrowser = typeof window !== "undefined";
const isFirefox = isBrowser && window.navigator.userAgent.toLowerCase().includes("firefox");

function getCaretCoordinates(
	element: HTMLInputElement | HTMLTextAreaElement,
	position: number,
	options?: CaretOptions,
): CaretCoordinates {
	if (!isBrowser) {
		throw new Error(
			"textarea-caret-position#getCaretCoordinates should only be called in a browser",
		);
	}

	const debug = options?.debug ?? false;
	const isInput = element.nodeName === "INPUT";

	const div = document.createElement("div");
	div.id = "input-textarea-caret-position-mirror-div";
	document.body.appendChild(div);

	const style = div.style;
	const computed = window.getComputedStyle(element);

	style.whiteSpace = "pre-wrap";
	if (!isInput) style.wordBreak = "break-word";
	style.position = "absolute";
	if (!debug) style.visibility = "hidden";

	properties.forEach((prop) => {
		if (isInput && prop === "lineHeight") {
			handleInputLineHeight(style, computed);
		} else {
			// @ts-expect-error - length and parentRule are readonly
			style[prop] = computed[prop];
		}
	});

	if (isFirefox) {
		if (element.scrollHeight > parseInt(computed.height)) {
			style.overflowY = "scroll";
		}
	} else {
		style.overflow = "hidden";
	}

	div.textContent = element.value.substring(0, position);
	if (isInput) div.textContent = div.textContent.replace(/\s/g, "\u00A0");

	const span = document.createElement("span");
	span.textContent = element.value.substring(position) || ".";
	div.appendChild(span);

	const coordinates: CaretCoordinates = {
		top: span.offsetTop + parseInt(computed.borderTopWidth),
		left: span.offsetLeft + parseInt(computed.borderLeftWidth),
		height: parseInt(computed.lineHeight),
	};

	if (debug) {
		span.style.backgroundColor = "#aaa";
	} else {
		document.body.removeChild(div);
	}

	return coordinates;
}

function handleInputLineHeight(style: CSSStyleDeclaration, computed: CSSStyleDeclaration): void {
	if (computed.boxSizing === "border-box") {
		const height = parseInt(computed.height);
		const outerHeight =
			parseInt(computed.paddingTop) +
			parseInt(computed.paddingBottom) +
			parseInt(computed.borderTopWidth) +
			parseInt(computed.borderBottomWidth);
		const targetHeight = outerHeight + parseInt(computed.lineHeight);
		if (height > targetHeight) {
			style.lineHeight = `${String(height - outerHeight)}px`;
		} else if (height === targetHeight) {
			style.lineHeight = computed.lineHeight;
		} else {
			style.lineHeight = "0";
		}
	} else {
		style.lineHeight = computed.height;
	}
}

function getActiveFeatures(trigger: string) {
	const matchingFeatures = features.value.filter((feature) =>
		trigger.toLowerCase().includes(feature.value.toLowerCase()),
	);
	return matchingFeatures[0] ? [matchingFeatures[0]] : [];
}

const defaultTriggers = computed(() => [":"].concat(features.value.map((item) => item.value)));

function getList(trigger: string | null) {
	switch (trigger) {
		case ":":
			return features.value.map((item) => item.listValue);
		default:
			return getValueList(getActiveFeatures(trigger)).map((item) => item.listValue);
		case null:
			return [];
	}
}

function getValue(listValue: string, trigger: string | null) {
	const list = trigger === ":" ? features.value : getValueList(getActiveFeatures(trigger ?? ""));
	return list.find((item) => item.listValue === listValue)?.value;
}

export function useSearchbarAutocomplete() {
	return {
		defaultTriggers,
		getList,
		getValue,
		getTriggerOffset,
		getTrigger,
		getSearchValue,
		getAnchorRect,
		replaceValue,
	};
}
