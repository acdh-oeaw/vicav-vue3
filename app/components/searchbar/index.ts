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

export function getTriggerOffset(text: string, cursorOffset: number, triggers: TriggerMap) {
	for (let i = cursorOffset; i >= 0; i--) {
		for (const trigger of [...triggers.keys()].toSorted((a, b) => b.length - a.length)) {
			if (text.substring(i - trigger.length + 1, i + 1) === trigger) {
				return i - trigger.length + 1;
			}
		}
	}
	return -1;
}

export function getTrigger(text: string, cursorOffset: number, triggers: TriggerMap) {
	for (const trigger of [...triggers.keys()].toSorted((a, b) => b.length - a.length)) {
		const triggerStart = cursorOffset - trigger.length;
		if (triggerStart >= 0 && text.substring(triggerStart, cursorOffset) === trigger) {
			return trigger;
		}
	}
	return null;
}

export function getSearchValue(text: string, cursorOffset: number, triggers: TriggerMap) {
	const offset = getTriggerOffset(text, cursorOffset, triggers);
	const trigger = getTrigger(text, cursorOffset, triggers);
	return text.slice(offset + (trigger?.length ?? 0), cursorOffset);
}

export function getAnchorRect(
	element: HTMLTextAreaElement,
	text: string,
	cursorOffset: number,
	triggers: TriggerMap,
) {
	const offset = getTriggerOffset(text, cursorOffset, triggers);
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
	operator?: string;
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

export function tokenToTagItem(clause: string, operator?: string): TagItem {
	const children = parseGroupChildren(clause);
	return { id: crypto.randomUUID(), rawValue: clause, operator, ...(children ? { children } : {}) };
}

export function parseGroupChildren(clause: string): Array<TagItem> | null {
	if (!clause.startsWith("(") || !clause.endsWith(")")) return null;
	const inner = clause.slice(1, -1).trim();
	return splitQueryIntoTokens(inner).map((childToken, j) =>
		tokenToTagItem(childToken.clause, j > 0 ? (childToken.operator ?? "AND") : undefined),
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

	// CQL format: [keyword=value] — featureKey is "[keyword=" so it matches the trigger key
	if (rest.startsWith("[")) {
		const eqIdx = rest.indexOf("=");
		if (eqIdx === -1) return null;
		return { prefix, featureKey: rest.slice(0, eqIdx + 1), rawValue: rest.slice(eqIdx + 1) };
	}

	// Wibarab format: feature:value
	const colonIdx = rest.indexOf(":");
	if (colonIdx === -1) return null;

	return {
		prefix,
		featureKey: rest.slice(0, colonIdx + 1),
		rawValue: rest.slice(colonIdx + 1),
	};
}

export function splitCqlQuery(query: string): Array<{ clause: string }> {
	const result: Array<{ clause: string }> = [];
	let i = 0;
	const q = query.trim();

	while (i < q.length) {
		if (/\s/.test(q[i]!)) {
			i++;
			continue;
		}

		if (q[i] === "[") {
			let token = "[";
			i++;
			let depth = 1;
			while (i < q.length && depth > 0) {
				const c = q[i]!;
				if (c === "[") {
					depth++;
					token += c;
					i++;
				} else if (c === "]") {
					depth--;
					token += c;
					i++;
				} else if (c === '"') {
					token += '"';
					i++;
					while (i < q.length && q[i] !== '"') {
						if (q[i] === "\\") {
							token += q[i++]!;
						}
						if (i < q.length) {
							token += q[i++]!;
						}
					}
					if (i < q.length) {
						token += '"';
						i++;
					}
				} else {
					token += c;
					i++;
				}
			}
			result.push({ clause: token });
			continue;
		}

		i++;
	}

	return result;
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
