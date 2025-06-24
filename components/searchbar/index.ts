// Adapted from https://reka-ui.com/examples/combobox-textarea
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

export type TriggerMap = Map<
	string,
	Array<{
		value: string;
		displayValue: string;
	}>
>;

export function getTriggerOffset(element: HTMLTextAreaElement, triggers: TriggerMap) {
	const { value, selectionStart } = element;
	for (let i = selectionStart; i >= 0; i--) {
		for (const trigger of [...triggers.keys()].toSorted((a, b) => b.length - a.length)) {
			if (value.substring(i - trigger.length + 1, i + 1) === trigger) {
				return i - trigger.length + 1;
			}
		}
	}
	return -1;
}

export function getTrigger(element: HTMLTextAreaElement, triggers: TriggerMap) {
	const { value, selectionStart } = element;
	for (const trigger of [...triggers.keys()].toSorted((a, b) => b.length - a.length)) {
		const triggerStart = selectionStart - trigger.length;
		if (triggerStart >= 0 && value.substring(triggerStart, selectionStart) === trigger) {
			const secondPreviousChar = value[triggerStart - 1];
			const isIsolated = !secondPreviousChar || /\W/.test(secondPreviousChar);
			if (isIsolated) {
				return trigger;
			}
		}
	}
	return null;
}

export function getSearchValue(element: HTMLTextAreaElement, triggers: TriggerMap) {
	const offset = getTriggerOffset(element, triggers);
	const trigger = getTrigger(element, triggers);
	if (offset === -1) return "";
	return element.value.slice(offset + (trigger?.length ?? 0), element.selectionStart);
}

export function getAnchorRect(element: HTMLTextAreaElement, triggers: TriggerMap) {
	const offset = getTriggerOffset(element, triggers);
	const { left, top, height } = getCaretCoordinates(element, offset + 1);
	const { x, y } = element.getBoundingClientRect();
	return {
		x: left + x - element.scrollLeft,
		y: top + y - element.scrollTop,
		height,
	};
}

export function replaceValue(
	prevValue: string,
	offset: number,
	searchValue: string,
	selectedValue: string,
	triggerValue: string,
) {
	const nextValue = `${
		prevValue.slice(0, offset) + selectedValue
	}${triggerValue === "" ? "" : " "}${prevValue.slice(offset + triggerValue.length + searchValue.length)}`;
	return nextValue;
}

export function getList(trigger: string | null, triggers: TriggerMap) {
	return triggers.get(trigger ?? "") ?? [];
}

export function getValue(listValue: string, trigger: string | null, triggers: TriggerMap) {
	return triggers.get(trigger ?? "")?.find((item) => item.value === listValue);
}
