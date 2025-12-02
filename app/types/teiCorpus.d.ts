/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { TeiHeader, XmlTextNode } from "@/lib/api-client/index.ts";

type simplePerson = {
	name: string;
	sex: string;
	age: string;
};
type Author = {
	given: string;
	family: string;
};
export type simpleTEIMetadata = {
	id: string;
	label: string;
	title: string;
	author: Array<Author>;
	recording: Array<Author>;
	principal: Array<Author>;
	transcription: Array<Author>;
	"transfer to ELAN": Array<Author>;
	dataType: DataTypesEnum;
	category: string;
	resp: string;
	pubDate: string | TeiDate;
	recordingDate?: string | TeiDate;
	duration?: string;
	audioAvailability: string;
	place: {
		settlement: string;
		country: string;
		region: string;
	};
	person: Array<simplePerson>;
	"@hasTEIw": string;
	teiHeader: TeiHeader;
	publication: {
		refType: "external" | "internal";
		type: string;
		bibl: {
			author: Array<Author>;
			editor?: Array<Author>;
			title: string;
			"container-title"?: string;
			issued: Array<string>;
			page?: string;
			volume?: string;
			publisherPlace?: string;
		};
	};
};

// We need to find one example of this in real data...
export type TeiDate = {
	$?: string;
	"@when"?: string;
	"@type"?: string;
	"@from"?: string;
	"@to"?: string;
	note: XmlTextNode;
};
