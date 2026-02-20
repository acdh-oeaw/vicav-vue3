import type { Completion } from "@codemirror/autocomplete";
import { HighlightStyle, LanguageSupport, StreamLanguage } from "@codemirror/language";
import { hoverTooltip, type Tooltip, type TooltipView } from "@codemirror/view";
import { Tag } from "@lezer/highlight";

import type { TriggerMap } from "@/components/searchbar";

// Define custom tags
const featureTag = Tag.define("feature");
const filterTag = Tag.define("filter");
const operatorTag = Tag.define("operator");
const valueTag = Tag.define("value");
const parenTag = Tag.define("paren");

export const queryLanguage = StreamLanguage.define({
	startState() {
		return {};
	},

	token(stream) {
		// Whitespace
		if (stream.eatSpace()) return null;

		// Parentheses
		if (stream.match("(") || stream.match(")")) {
			return parenTag.toString();
		}

		// Logical operators
		if (stream.match(/^(AND|OR|NOT)\b/i)) {
			return operatorTag.toString();
		}

		// Feature keys (ft_q, ft_k, etc.)
		if (stream.match(/^ft_\w+:/)) {
			return featureTag.toString();
		}

		// Filter names (ageGroup, tribe, etc.)
		if (stream.match(/^[^ft_]\w+:/)) {
			return filterTag.toString();
		}

		// Quoted strings: "..."
		if (stream.match(/^"(?:[^"\\]|\\.)*"/)) {
			return valueTag.toString();
		}

		// Slash patterns: /g/, /k/ and /č/
		if (stream.match(/^\/[^/]*\//)) {
			return valueTag.toString();
		}

		// Quantors (ALL, ANY)
		if (stream.match(/ALL|ANY/)) {
			return valueTag.toString();
		}

		// Anything else → consume one char to avoid infinite loop
		stream.next();
		return null;
	},
	tokenTable: {
		value: valueTag,
		feature: featureTag,
		filter: filterTag,
		operator: operatorTag,
		paren: parenTag,
	},
});

// Create a custom highlight style for your query language
export const queryHighlightStyle = HighlightStyle.define([
	{ tag: featureTag, class: "cm-feature" },
	{ tag: filterTag, class: "cm-filter" },
	{ tag: operatorTag, class: "cm-operator" },
	{ tag: valueTag, class: "cm-feature-value" },
]);

// Completion provider factory - takes the triggers map
export function createQueryCompletion(
	triggers: Map<string, Array<{ value: string; displayValue: string }>>,
) {
	return () => {
		const completions: Array<Completion> = [];
		triggers.get("")!.forEach((item) => {
			completions.push({
				label: item.value,
				detail: item.displayValue,
				type: "feature",
			});
		});

		return {
			from: 0,
			options: completions,
		};
	};
}

export const queryLanguageSupport = new LanguageSupport(queryLanguage);

export const wordHover = (triggers: TriggerMap) =>
	hoverTooltip((view, pos, side) => {
		const { from, to, text } = view.state.doc.lineAt(pos);
		let start = pos,
			end = pos;
		while (start > from && /\w/.test(text[start - from - 1] ?? "")) start--;
		while (end < to && /\w/.test(text[end - from] ?? "")) end++;
		if ((start === pos && side < 0) || (end === pos && side > 0)) return null;
		const textContent = text.slice(start - from, end - from);
		const trigger = triggers.get("")?.find((val) => val.value === `${textContent}:`);
		if (trigger)
			return {
				pos: start,
				end,
				above: true,
				create() {
					const dom = document.createElement("div");
					dom.textContent = trigger.displayValue;
					return { dom } satisfies TooltipView;
				},
			} satisfies Tooltip;
		return null;
	});
