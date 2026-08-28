import { HighlightStyle, LanguageSupport, StreamLanguage } from "@codemirror/language";
import { Tag } from "@lezer/highlight";

const parenTag = Tag.define("paren");
const featureTag = Tag.define("feature");
const valueTag = Tag.define("value");
const operatorTag = Tag.define("operator");

export const cqlLanguage = StreamLanguage.define({
	startState: () => ({}),

	token(stream) {
		if (stream.eatSpace()) return null;

		// Logical operators & and |
		if (stream.match(/^[&|]/)) return operatorTag.toString();

		// Square brackets
		if (stream.match(/^[[\]]/)) return parenTag.toString();

		// = and !=
		if (stream.match(/^!?=/)) return null;

		// Quoted string values
		if (stream.match(/^"(?:[^"\\]|\\.)*"/)) return valueTag.toString();

		// Regex-style values /pattern/
		if (stream.match(/^\/[^/]*\//)) return valueTag.toString();

		// Attribute name followed by = or != — match word+operator, then back up past operator
		if (stream.match(/^\w+(?=\s*!?=)/)) return featureTag.toString();

		stream.next();
		return null;
	},

	tokenTable: {
		value: valueTag,
		feature: featureTag,
		operator: operatorTag,
		paren: parenTag,
	},
});

export const cqlHighlightStyle = HighlightStyle.define([
	{ tag: featureTag, class: "cm-feature" },
	{ tag: parenTag, class: "cm-paren" },
	{ tag: operatorTag, class: "cm-operator" },
	{ tag: valueTag, class: "cm-feature-value" },
]);

export const cqlLanguageSupport = new LanguageSupport(cqlLanguage);
