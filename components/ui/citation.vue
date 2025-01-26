<script setup lang="ts">
import "@citation-js/plugin-csl";

import { Cite, type CSLDate, type CSLJSON, type CSLName } from "@citation-js/core";
import { Quote } from "lucide-vue-next";

import type { simpleTEIMetadata } from "@/types/teiCorpus";

interface Props {
	type: string;
	header?: simpleTEIMetadata;
}

const { data: config } = useProjectInfo();

const props = defineProps<Props>();
const date = new Date();

const data = computed<CSLJSON>(() =>
	props.type === "entry" && props.header
		? {
				type: "entry",
				editor: config.value?.projectConfig?.editors as Array<CSLName>,
				"container-title": config.value?.projectConfig?.title as string,
				title: props.header.title as string,
				author: props.header.author as Array<CSLName>,
				issued: { "date-parts": [[2025, 2, 1]] } as CSLDate,
			}
		: {
				type: "software",
				editor: config.value?.projectConfig?.editors as Array<CSLName>,
				title: config.value?.projectConfig?.title,
				issued: { "date-parts": [[2025, 2, 1]] } as CSLDate,
			},
);

const url = window.location.href.replace(/(https?:\/\/.+)[/?].*/, "$1");

const citation = computed(() =>
	new Cite(data.value).format("bibliography", {
		format: "html",
		template: "apa",
		// prepend (entry) {
		//   return `[${entry.id}]: `
		// },
		append: ` [Available online at ${url}.
	Accessed on ${String(date.getFullYear())}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.]`,
	}),
);
</script>

<template>
	<div class="mx-4 -mb-10 mt-4 flex gap-3 rounded-sm border-gray-300 bg-gray-100 p-4">
		<div><Quote class="h-4" /></div>
		<!-- eslint-disable vue/no-v-html -->
		<div v-html="citation" />
	</div>
</template>
