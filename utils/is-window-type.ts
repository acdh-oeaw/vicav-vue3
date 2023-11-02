import type { ItemType } from "@/lib/api-client";

type WindowType = Exclude<NonNullable<ItemType["componentName"]>, "UnknownTypeWarning">;

export const windowTypeMap: Record<WindowType, WindowItemKind> = {
	BiblioQuery: "bibliography-query",
	CorpusQuery: "corpus-query",
	CorpusText: "corpus-text",
	CrossDictQuery: "cross-dictionary-query",
	DataList: "data-list",
	DictQuery: "dictionary-query",
	SampleText: "sample-text",
	Text: "text",
	WMap: "geo-map",
};

export function isWindowType(value: string | undefined): value is WindowType {
	return value != null && Object.keys(windowTypeMap).includes(value);
}
