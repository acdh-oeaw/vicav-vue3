import type { JSONSchema } from "zod/v4/core";

import openapi from "@/assets/openapi.json";

interface OpenApiDocument {
	components?: {
		schemas?: Record<string, JSONSchema.JSONSchema>;
	};
}

const openapiDocument = openapi as OpenApiDocument;

const refPrefix = "#/components/schemas/";
const defsPrefix = "#/$defs/";

const isObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const mapRefsToDefs = (schema: unknown): unknown => {
	if (Array.isArray(schema)) return schema.map((item) => mapRefsToDefs(item));
	if (!isObject(schema)) return schema;

	const ref = typeof schema.$ref === "string" ? schema.$ref : undefined;
	if (ref?.startsWith(refPrefix)) {
		return { ...schema, $ref: `${defsPrefix}${ref.slice(refPrefix.length)}` };
	}

	const mapped: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(schema)) {
		mapped[key] = mapRefsToDefs(value);
	}
	return mapped;
};

export function useOpenapiSchema(name: string) {
	const schema = openapiDocument.components?.schemas?.[name];
	const allSchemas = openapiDocument.components?.schemas;
	if (!schema || !allSchemas) return false;

	const defs: Record<string, JSONSchema.JSONSchema> = {};
	for (const [key, value] of Object.entries(allSchemas)) {
		defs[key] = mapRefsToDefs(value) as JSONSchema.JSONSchema;
	}

	return {
		$ref: `${defsPrefix}${name}`,
		$defs: defs,
	} as JSONSchema.JSONSchema;
}
