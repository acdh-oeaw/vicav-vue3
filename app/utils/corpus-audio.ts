import type { PrefixDef } from "@/lib/api-client";

export function rawTeiSourceUrl(source: string): string | undefined {
	try {
		const url = new URL(source);
		if (url.protocol !== "https:") return undefined;
		if (url.hostname === "github.com") {
			const match = /^\/([^/]+)\/([^/]+)\/blob\/(.+)$/.exec(url.pathname);
			return match?.[1] && match[2] && match[3]
				? `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}`
				: undefined;
		}
		return url.hostname === "raw.githubusercontent.com" ? url.href : undefined;
	} catch {
		return undefined;
	}
}

export function resolveCorpusAudio(
	xml: string,
	prefixes: Array<Pick<PrefixDef, "@ident" | "@matchPattern" | "@replacementPattern">>,
): Map<string, string> {
	const document = new DOMParser().parseFromString(xml, "application/xml");
	const urls = new Map<string, string>();
	for (const media of document.getElementsByTagNameNS("http://www.tei-c.org/ns/1.0", "media")) {
		const id =
			media.getAttributeNS("http://www.w3.org/XML/1998/namespace", "id") ??
			media.getAttribute("xml:id");
		const uri = media.getAttribute("url");
		if (!id?.endsWith("-audio-public") || !uri) continue;
		const split = uri.indexOf(":");
		const prefix = prefixes.find((item) => item["@ident"] === uri.slice(0, split));
		if (!prefix) continue;
		try {
			const pattern = new RegExp(prefix["@matchPattern"]);
			const value = uri.slice(split + 1);
			if (!pattern.test(value)) continue;
			const resolved = new URL(value.replace(pattern, prefix["@replacementPattern"]));
			if (resolved.protocol === "https:" || resolved.protocol === "http:")
				urls.set(id, resolved.href);
		} catch {
			// Ignore invalid or unsupported prefix definitions.
		}
	}
	return urls;
}

export function getCorpusAudioUrl(
	corresp: string | undefined,
	urls: ReadonlyMap<string, string>,
): string | undefined {
	return corresp
		?.trim()
		.split(/\s+/)
		.map((id) => urls.get(id.replace(/^#/, "")))
		.find(Boolean);
}
