import openapi from "@/assets/openapi.json";

type OpenApiSchema = Record<string, unknown>;
interface OpenApiDocument {
	components?: {
		schemas?: Record<string, OpenApiSchema>;
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
	if (!schema || !allSchemas) return undefined;

	const defs: Record<string, OpenApiSchema> = {};
	for (const [key, value] of Object.entries(allSchemas)) {
		defs[key] = mapRefsToDefs(value) as OpenApiSchema;
	}

	return {
		$ref: `${defsPrefix}${name}`,
		$defs: defs,
	} as OpenApiSchema;
}
