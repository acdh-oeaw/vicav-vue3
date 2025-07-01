<script setup lang="ts">
import type { UClass } from "@/types/corpus-as-json";

const props = defineProps<{
	utterance: UClass;
	inlineAnnotation: boolean;
	inlineTranslation: boolean;
}>();
</script>

<template>
	<div v-if="props.utterance.w" class="flex flex-col u">
		<TooltipProvider v-if="!inlineAnnotation" :delay-duration="0">
			<Tooltip>
				<TooltipTrigger>
					<div class="flex justify-center text-lg">
						{{ props.utterance.w["$"]
						}}{{
							props.utterance.w["@join"] === "right" && props.utterance.w["@rend"] === "withDash"
								? "-"
								: "&nbsp;"
						}}
					</div>
				</TooltipTrigger>
				<TooltipContent class="bg-primary" side="bottom">
					<p>{{ props.utterance.w.pos }}&nbsp;</p>
					<p>{{ props.utterance.w["@msd"] }}&nbsp;</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
		<div v-if="inlineAnnotation" class="flex justify-center text-lg">
			{{ props.utterance.w["$"]
			}}{{
				props.utterance.w["@join"] === "right" && props.utterance.w["@rend"] === "withDash"
					? "-"
					: "&nbsp;"
			}}
		</div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w.pos }}&nbsp;
		</div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w["@msd"] }}&nbsp;
		</div>
	</div>
	<div v-if="props.utterance.pc" class="flex flex-col u text-lg">
		<div>{{ props.utterance.pc["$"] }}</div>
	</div>
</template>

<style scoped>
@reference "@/styles/index.css";

.u {
	@apply hover:bg-primary/70 transition duration-300 ease-in-out hover:font-bold;
}
</style>
