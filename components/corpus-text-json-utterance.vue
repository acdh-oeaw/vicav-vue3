<script setup lang="ts">
const props = defineProps<{
	utterance: Record<string, never>;
	inlineAnnotation: boolean;
}>();
</script>

<template>
	<div v-if="props.utterance.w" class="flex flex-col u">
		<TooltipProvider v-if="!inlineAnnotation" :delay-duration="0">
			<Tooltip>
				<TooltipTrigger>
					<div class="flex justify-center">
						{{ props.utterance.w["$"]
						}}{{ props.utterance.w["@join"] === "right" ? "-" : "&nbsp;" }}
					</div>
				</TooltipTrigger>
				<TooltipContent class="bg-primary" side="bottom">
					<p>{{ props.utterance.w.pos }}&nbsp;</p>
					<p>{{ props.utterance.w["@msd"] }}&nbsp;</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
		<div v-if="inlineAnnotation" class="flex justify-center">
			{{ props.utterance.w["$"] }}{{ props.utterance.w["@join"] === "right" ? "-" : "&nbsp;" }}
		</div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w.pos }}&nbsp;
		</div>
		<div v-if="inlineAnnotation" class="flex justify-center text-xs text-gray-500">
			{{ props.utterance.w["@msd"] }}&nbsp;
		</div>
	</div>
</template>

<style scoped>
@reference "@/styles/index.css";

.u {
	@apply hover:bg-primary/70 transition duration-300 ease-in-out hover:font-bold;
}
</style>
