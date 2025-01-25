<script setup lang="ts">
import "@citation-js/plugin-csl";

import { Cite, type CSLItemType, type CSLName } from "@citation-js/core";

interface Props {
	author: Array<CSLName>;
	type?: string;
	title?: string;
	editor?: Array<CSLName>;
	containerTitle?: string;
	issued?: Array<number>;
	url?: string;
}
const props = defineProps<Props>();
const date = new Date();

const entry = new Cite({
	type: props.type as CSLItemType,
	editor: props.editor as Array<CSLName>,
	"container-title": props.containerTitle,
	title: props.title,
	author: props.author as Array<CSLName>,
	issued: { "date-parts": [props.issued] },
});

const citation = entry.format("bibliography", {
	format: "html",
	template: "apa",
	// prepend (entry) {
	//   return `[${entry.id}]: `
	// },
	append: ` [Available online at ${props.url}.
	Accessed on ${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getFullYear())}.]`,
});
</script>

<template>
	<div v-html="citation" />
</template>
