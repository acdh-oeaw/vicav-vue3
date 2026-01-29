import openapi from "@/assets/openapi.json";

type OpenApiSchema = Record<string, unknown>;
interface OpenApiDocument {
	components?: {
		schemas?: Record<string, OpenApiSchema>;
	};
}

const openapiDocument = openapi as OpenApiDocument;

const refPrefix = "#/components/schemas/";

const isObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const getSchemaByRef = (ref: string) => {
	if (!ref.startsWith(refPrefix)) return undefined;
	const name = ref.slice(refPrefix.length);
	return openapiDocument.components?.schemas?.[name];
};

const resolveSchema = (schema: unknown, seen: Map<string, unknown>): unknown => {
	if (Array.isArray(schema)) {
		return schema.map((item) => resolveSchema(item, seen));
	}
	if (!isObject(schema)) return schema;

	const ref = typeof schema.$ref === "string" ? schema.$ref : undefined;
	if (ref) {
		if (seen.has(ref)) return seen.get(ref);
		const target = getSchemaByRef(ref);
		if (!target) return schema;
		//we need this to handle cyclic references
		const placeholder: Record<string, unknown> = {};
		seen.set(ref, placeholder);
		const resolved = resolveSchema(target, seen);
		if (isObject(resolved)) Object.assign(placeholder, resolved);
		return placeholder;
	}

	const resolvedObject: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(schema)) {
		resolvedObject[key] = resolveSchema(value, seen);
	}
	return resolvedObject;
};

export function useOpenapiSchema(name: string) {
	const schema = openapiDocument.components?.schemas?.[name];
	if (!schema) return undefined;
	return resolveSchema(schema, new Map()) as OpenApiSchema;
}
