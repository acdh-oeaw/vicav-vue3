import type { ItemType } from "@/lib/api-client";

type WindowType = Exclude<NonNullable<ItemType["targetType"]>, "UnknownTypeWarning">;

export const windowTypeMap: Record<WindowType, WindowItemKind> = {
	BiblioQuery: "bibliography-query",
	BiblioEntries: "bibliography-entries",
	CorpusQuery: "corpus-query",
	CorpusText: "corpus-text",
	CrossDictQuery: "cross-dictionary-query",
	DataList: "data-list",
	DictQuery: "dictionary-query",
	SampleText: "sample-text",
	Text: "text",
	WMap: "geo-map",
	Profile: "profile",
	Feature: "feature",
};

export function isWindowType(value: string | undefined): value is WindowType {
	return value != null && Object.keys(windowTypeMap).includes(value);
}
