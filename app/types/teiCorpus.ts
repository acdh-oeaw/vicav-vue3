import { z } from "zod";

import type { TeiHeader } from "@/lib/api-client/index.ts";
import { DataTypesEnum } from "@/types/global";

const SimplePersonSchema = z.object({
	name: z.string(),
	sex: z.string(),
	age: z.string(),
});
export type simplePerson = z.infer<typeof SimplePersonSchema>;

const AuthorSchema = z.object({
	given: z.string(),
	family: z.string(),
});
export type Author = z.infer<typeof AuthorSchema>;

const XmlTextNodeSchema = z.object({
	$: z.string(),
});
export const TeiHeaderSchema = z.custom<TeiHeader>();

export const TeiDateSchema = z.object({
	$: z.string().optional(),
	"@when": z.string().optional(),
	"@type": z.string().optional(),
	"@from": z.string().optional(),
	"@to": z.string().optional(),
	note: XmlTextNodeSchema,
});
export type TeiDate = z.infer<typeof TeiDateSchema>;

export const SimpleTEIMetadataSchema = z.object({
	id: z.string(),
	label: z.string(),
	title: z.string(),
	author: z.array(AuthorSchema),
	recording: z.array(AuthorSchema),
	principal: z.array(AuthorSchema),
	transcription: z.array(AuthorSchema),
	"transfer to ELAN": z.array(AuthorSchema),
	dataType: DataTypesEnum,
	category: z.string(),
	resp: z.string(),
	pubDate: z.union([z.string(), TeiDateSchema]),
	recordingDate: z.union([z.string(), TeiDateSchema]).optional(),
	duration: z.string().optional(),
	audioAvailability: z.string(),
	place: z.object({
		settlement: z.string(),
		country: z.string(),
		region: z.string(),
	}),
	person: z.array(SimplePersonSchema),
	"@hasTEIw": z.string(),
	teiHeader: TeiHeaderSchema,
	publication: z.object({
		refType: z.enum(["external", "internal"]),
		type: z.string(),
		bibl: z.object({
			author: z.array(AuthorSchema),
			editor: z.array(AuthorSchema).optional(),
			title: z.string(),
			"container-title": z.string().optional(),
			issued: z.array(z.string()),
			page: z.string().optional(),
			volume: z.string().optional(),
			publisherPlace: z.string().optional(),
		}),
	}),
});
export type simpleTEIMetadata = z.infer<typeof SimpleTEIMetadataSchema>;
