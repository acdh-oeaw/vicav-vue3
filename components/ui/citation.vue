<script setup lang="ts">
import "@citation-js/plugin-csl";

import { Cite, type CSLDate, type CSLJSON, type CSLName } from "@citation-js/core";
import { Quote } from "lucide-vue-next";

import type { simpleTEIMetadata } from "@/types/teiCorpus";

interface Props {
	type: string;
	refType?: "internal" | "external";
	header?: simpleTEIMetadata;
	bibl?: {
		author: Array<CSLName>;
		editor?: Array<CSLName>;
		title: string;
		"container-title"?: string;
		issued?: Array<string>;
		publisherPlace?: string;
		page?: string;
		volume?: string;
	};
}

const { data: config } = useProjectInfo();

const props = defineProps<Props>();
const date = new Date();

const data = computed<CSLJSON>(() => {
	if (props.type === "entry" && props.header) {
		return {
			type: "entry",
			editor: config.value?.projectConfig?.editors as Array<CSLName>,
			"container-title": config.value?.projectConfig?.title as string,
			title: props.header.title as string,
			author: (props.header.author ?? props.header.transcription ?? []) as Array<CSLName>,
			issued: { "date-parts": [config.value?.projectConfig?.pubDate] } as CSLDate,
		};
	} else if (props.type === "book" && props.bibl) {
		return {
			type: "book",
			title: props.bibl.title as string,
			author: props.bibl.author as Array<CSLName>,
			issued: { "date-parts": [props.bibl.issued?.map((i) => parseInt(i))] } as CSLDate,
			publisherPlace: props.bibl.publisherPlace!,
		};
	} else if (props.type === "chapter" && props.bibl) {
		return {
			type: "chapter",
			editor: props.bibl.editor as Array<CSLName>,
			"container-title": props.bibl["container-title"] ? props.bibl["container-title"] : "",
			title: props.bibl.title as string,
			author: props.bibl.author as Array<CSLName>,
			issued: { "date-parts": [props.bibl.issued?.map((i) => parseInt(i))] } as CSLDate,
			publisherPlace: props.bibl.publisherPlace,
			page: props.bibl.page,
		};
	} else if (props.type === "journalArticle" && props.bibl) {
		return {
			type: "article-journal",
			editor: props.bibl.editor as Array<CSLName>,
			"container-title": props.bibl["container-title"] ? props.bibl["container-title"] : "",
			title: props.bibl.title as string,
			author: props.bibl.author as Array<CSLName>,
			issued: { "date-parts": [props.bibl.issued?.map((i) => parseInt(i))] } as CSLDate,
			publisherPlace: props.bibl.publisherPlace,
			page: props.bibl.page,
			volume: props.bibl.volume,
		};
	} else {
		return {
			type: "software",
			editor: config.value?.projectConfig?.editors as Array<CSLName>,
			title: config.value?.projectConfig?.title,
			issued: { "date-parts": [config.value?.projectConfig?.pubDate] } as CSLDate,
		};
	}
});

const url = window.location.href.replace(/(https?:\/\/.+)[/?].*/, "$1");

const cite = new Cite(data.value);
const appendText =
	props.refType === "external"
		? ""
		: ` [Available online at ${url}. Accessed on ${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.]`;

const citation = computed(() =>
	cite.format("bibliography", {
		format: "html",
		template: "apa",
		// prepend (entry) {
		//   return `[${entry.id}]: `
		// },
		append: appendText,
	}),
);
const citationText = computed(() =>
	cite.format("bibliography", {
		format: "text",
		template: "apa",
		// prepend (entry) {
		//   return `[${entry.id}]: `
		// },
		append: appendText,
	}),
);

/** Paste richly formatted text.
 *
 * @param {string} rich - the text formatted as HTML
 * @param {string} plain - a plain text fallback
 */
async function copyToClipboard(e: Event) {
	e.preventDefault();
	const html = new Blob([citation.value], { type: "text/html" });
	const text = new Blob([citationText.value], { type: "text/plain" });
	const data = new ClipboardItem({ "text/html": html, "text/plain": text });
	await navigator.clipboard.write([data]);
}
</script>

<template>
	<!-- eslint-disable vue/no-v-html -->
	<div v-if="props.refType === 'external'" v-html="citation" />
	<div v-else class="m-4 flex flex-wrap gap-3 rounded-sm border-gray-300 bg-gray-100 p-4">
		<div class="flex-none"><Quote class="h-4" /></div>
		<!-- eslint-disable vue/no-v-html -->
		<div class="flex-1" v-html="citation" />
		<a class="w-full text-right text-sm" href="#" @click="copyToClipboard"
			>Copy citation to clipboard</a
		>
	</div>
</template>
