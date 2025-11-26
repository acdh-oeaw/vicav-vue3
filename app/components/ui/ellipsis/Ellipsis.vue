<script setup lang="ts">
const props = withDefaults(
	defineProps<{
		maxLength?: number;
		cutWords?: "first" | "second" | false;
	}>(),
	{
		maxLength: 15,
		cutWords: false,
	},
);
const slots = defineSlots();
const ellipsedText = computed(() => {
	const text: string = slots.default()[0].children;
	if (text.length <= props.maxLength) return text;

	const firstHalf = text.split(" ").reduce((prev, curr, _idx, arr) => {
		if ([prev, curr].join(" ").length < props.maxLength / 2) {
			return [prev, curr].join(" ");
		} else {
			arr.splice(1);
			return prev;
		}
	});
	const secondHalf = text
		.split(" ")
		.reverse()
		.reduce((prev, curr, _idx, arr) => {
			if ([curr, prev].join(" ").length < props.maxLength / 2) {
				return [curr, prev].join(" ");
			} else {
				arr.splice(1);
				return prev;
			}
		});

	if (props.cutWords && firstHalf.length + secondHalf.length > props.maxLength) {
		if (props.cutWords === "first")
			return [firstHalf.slice(0, props.maxLength - secondHalf.length), secondHalf].join("... ");
		if (props.cutWords === "second")
			return [firstHalf, secondHalf.slice(-(props.maxLength - firstHalf.length))].join(" ...");
	}

	if (firstHalf.length + secondHalf.length + 5 > text.length) return text;

	return [firstHalf, secondHalf].join(" ... ");
});
</script>

<template>
	<TooltipProvider>
		<Tooltip>
			<TooltipTrigger as-child>
				<span>{{ ellipsedText }}</span>
			</TooltipTrigger>
			<TooltipContent class="bg-white"> <slot></slot> </TooltipContent
		></Tooltip>
	</TooltipProvider>
</template>
