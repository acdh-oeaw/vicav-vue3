<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from "radix-vue";

const age: Ref<Array<number>> = defineModel("modelValue", {
	type: Array,
	default: [0, 100],
});
</script>

<template>
	<div class="my-2 flex flex-row px-3 py-2">
		<span>{{ age[0] }}</span>
		<SliderRoot
			v-model="age"
			class="relative mx-2 flex w-40 touch-none select-none items-center"
			:max="100"
			:min="0"
			:step="10"
		>
			<SliderTrack class="relative h-[3px] grow rounded-full bg-gray-400">
				<SliderRange class="absolute h-full rounded-full bg-primary" />
			</SliderTrack>
			<SliderThumb
				aria-label="Min age"
				class="block size-5 rounded-[10px] bg-white shadow-[0_2px_10px] focus:shadow-[0_0_0_2px]"
			/>
			<SliderThumb
				aria-label="Max age"
				class="block size-5 rounded-[10px] bg-white shadow-[0_2px_10px] shadow-primary focus:shadow-[0_0_0_2px] focus:shadow-gray-400"
			/>
		</SliderRoot>
		<span>{{ age[1] }}</span>
	</div>
</template>
