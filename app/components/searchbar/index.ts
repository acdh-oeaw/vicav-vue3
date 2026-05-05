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

function getSelectionOffset(element: HTMLElement) {
	element.focus();
	if ((document.getSelection()?.rangeCount ?? -1) <= 0) return 0;
	const _range = document.getSelection()?.getRangeAt(0);
	if (!_range) return -1;
	const range = _range.cloneRange();
	range.selectNodeContents(element);
	range.setEnd(_range.endContainer, _range.endOffset);
	return range.toString().length;
}
// Source - https://stackoverflow.com/a/3866442
// Posted by Nico Burns, modified by community. See post 'Timeline' for change history
// Retrieved 2026-02-12, License - CC BY-SA 3.0

export function setEndOfContenteditable(element: HTMLElement) {
	const range = document.createRange(); //Create a range (a range is a like the selection but invisible)
	range.selectNodeContents(element); //Select the entire contents of the element with the range
	range.collapse(false); //collapse the range to the end point. false means collapse to end rather than the start
	const selection = window.getSelection(); //get the selection object (allows you to change selection)
	selection?.removeAllRanges(); //remove any selections already made
	selection?.addRange(range); //make the range you have just created the visible selection
}

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
	div.textContent = element.textContent.substring(0, position);
	if (isInput) div.textContent = div.textContent.replace(/\s/g, "\u00A0");

	const span = document.createElement("span");
	span.textContent = element.textContent.substring(position) || ".";
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
	const value = element.textContent;
	const selectionStart = getSelectionOffset(element);
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
	const value = element.textContent;

	const selectionOffset = getSelectionOffset(element);
	for (const trigger of [...triggers.keys()].toSorted((a, b) => b.length - a.length)) {
		const triggerStart = selectionOffset - trigger.length;
		if (triggerStart >= 0 && value.substring(triggerStart, selectionOffset) === trigger) {
			// const secondPreviousChar = value[triggerStart - 1];
			// const isIsolated = !secondPreviousChar || /\W/.test(secondPreviousChar);
			// console.log("Tested trigger: ", `*${trigger}*`, value, selectionStart, secondPreviousChar);
			// if (isIsolated) {
			return trigger;
			// }
		}
	}
	return null;
}

export function getSearchValue(element: HTMLTextAreaElement, triggers: TriggerMap) {
	const offset = getTriggerOffset(element, triggers);
	const trigger = getTrigger(element, triggers);
	// if (offset === -1) return "";
	return element.textContent.slice(offset + (trigger?.length ?? 0), getSelectionOffset(element));
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

// ---- Tag-searchbar shared types and pure utilities ----

export const OPERATORS = ["AND", "OR", "AND NOT", "OR NOT"] as const;
export type Operator = (typeof OPERATORS)[number];

export interface TagItem {
	id: string;
	rawValue: string;
	/** Operator connecting this tag to the one before it (undefined for the first tag). */
	operator?: Operator;
	/** If set, this tag is a parenthesized group containing these sub-tags. */
	children?: Array<TagItem>;
}

export type RenderToken =
	| { kind: "operator"; tag: TagItem }
	| { kind: "open-paren"; tag: TagItem }
	| { kind: "close-paren"; tag: TagItem }
	| { kind: "chip"; tag: TagItem };

export function splitQueryIntoTokens(query: string): Array<{ operator?: string; clause: string }> {
	const result: Array<{ operator?: string; clause: string }> = [];
	let depth = 0;
	let inQuote = false;
	let currentClause = "";
	let pendingOperator: string | undefined = undefined;
	let i = 0;
	const q = query.trim();

	while (i < q.length) {
		const ch = q[i]!;

		if (ch === '"' && !inQuote) {
			inQuote = true;
			currentClause += ch;
			i++;
			continue;
		}
		if (ch === '"' && inQuote) {
			inQuote = false;
			currentClause += ch;
			i++;
			continue;
		}
		if (inQuote) {
			currentClause += ch;
			i++;
			continue;
		}
		if (ch === "(") {
			depth++;
			currentClause += ch;
			i++;
			continue;
		}
		if (ch === ")") {
			depth--;
			currentClause += ch;
			i++;
			continue;
		}

		if (depth === 0) {
			const rest = q.slice(i);
			const m = /^(AND NOT|OR NOT|AND|OR)\b/i.exec(rest);
			if (m) {
				const clause = currentClause.trim();
				if (clause) result.push({ operator: pendingOperator, clause });
				pendingOperator = m[1]!.toUpperCase();
				currentClause = "";
				i += m[0].length;
				while (i < q.length && q[i] === " ") i++;
				continue;
			}
		}

		currentClause += ch;
		i++;
	}

	const last = currentClause.trim();
	if (last) result.push({ operator: pendingOperator, clause: last });

	return result;
}

export function buildRawValue(items: Array<TagItem>): string {
	return items
		.map((t, i) => {
			const prefix = i > 0 && t.operator ? `${t.operator} ` : "";
			if (t.children) return `${prefix}(${buildRawValue(t.children)})`;
			return `${prefix}${t.rawValue}`;
		})
		.join(" ");
}

export function tokenToTagItem(clause: string, operator?: Operator): TagItem {
	const children = parseGroupChildren(clause);
	return { id: crypto.randomUUID(), rawValue: clause, operator, ...(children ? { children } : {}) };
}

export function parseGroupChildren(clause: string): Array<TagItem> | null {
	if (!clause.startsWith("(") || !clause.endsWith(")")) return null;
	const inner = clause.slice(1, -1).trim();
	return splitQueryIntoTokens(inner).map((childToken, j) =>
		tokenToTagItem(
			childToken.clause,
			j > 0 ? ((childToken.operator as Operator | undefined) ?? "AND") : undefined,
		),
	);
}

export function parseTagClause(
	clause: string,
): { prefix: string; featureKey: string; rawValue: string } | null {
	let prefix = "";
	let rest = clause.trim();

	if (rest.toUpperCase().startsWith("NOT ")) {
		prefix = "NOT ";
		rest = rest.slice(4).trim();
	}

	if (rest.startsWith("(")) return null;

	const colonIdx = rest.indexOf(":");
	if (colonIdx === -1) return null;

	return {
		prefix,
		featureKey: rest.slice(0, colonIdx + 1),
		rawValue: rest.slice(colonIdx + 1),
	};
}

export function getFlatTags(tag: TagItem): Array<TagItem> {
	if (tag.children) return [tag, ...tag.children.flatMap((child) => getFlatTags(child))];
	return [tag];
}

export function flatRender(items: Array<TagItem>): Array<RenderToken> {
	const result: Array<RenderToken> = [];
	for (const tag of items) {
		if (tag.operator) result.push({ kind: "operator", tag });
		if (tag.children?.length) {
			result.push({ kind: "open-paren", tag });
			result.push(...flatRender(tag.children));
			result.push({ kind: "close-paren", tag });
		} else {
			result.push({ kind: "chip", tag });
		}
	}
	return result;
}
