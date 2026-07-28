<script setup lang="ts">
import { BookOpen } from "@lucide/vue";

import { BibliographyEntriesSchema, type WindowItem } from "@/types/global.ts";
import type { RenderedBibliographyReference } from "@/utils/dict-entry-rendering.ts";

const props = defineProps<{
	reference: RenderedBibliographyReference;
}>();

const openOrUpdateWindow = useOpenOrUpdateWindow();

function openBibliographyResults() {
	openOrUpdateWindow(
		{
			targetType: "BiblioEntries",
			params: {
				queryString: props.reference.queryString,
			},
		} as unknown as WindowItem,
		`Bibliography: ${props.reference.label}`,
		BibliographyEntriesSchema.shape.params,
		"queryString",
		true,
	);
}
</script>

<template>
	<TooltipProvider :delay-duration="0">
		<Tooltip>
			<TooltipTrigger as-child>
				<button
					:aria-label="`Open bibliography results for ${reference.label}`"
					class="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white/90 text-gray-700 shadow-xs hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
					type="button"
					@click.stop="openBibliographyResults"
				>
					<BookOpen aria-hidden="true" class="size-4" />
				</button>
			</TooltipTrigger>
			<TooltipContent class="border-black bg-black text-white">
				{{ reference.label }}
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
</template>
