<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import {
	PopoverContent,
	type PopoverContentEmits,
	type PopoverContentProps,
	PopoverPortal,
	useForwardPropsEmits,
} from "reka-ui";
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes, normalizeClass } from "vue";

defineOptions({
	inheritAttrs: false,
});

const props = withDefaults(
	defineProps<PopoverContentProps & { class?: HTMLAttributes["class"]; usePortal?: boolean }>(),
	{
		align: "center",
		sideOffset: 4,
		usePortal: false,
	},
);
const emits = defineEmits<PopoverContentEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<PopoverPortal v-if="usePortal">
		<PopoverContent
			v-bind="{ ...forwarded, ...$attrs }"
			:class="
				twMerge(
					'z-50 w-72 origin-(--reka-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
					normalizeClass(props.class),
				)
			"
			data-slot="popover-content"
		>
			<slot />
		</PopoverContent>
	</PopoverPortal>
	<PopoverContent
		v-else
		v-bind="{ ...forwarded, ...$attrs }"
		:class="
			twMerge(
				'z-50 w-72 origin-(--reka-popover-content-transform-origin) rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-hidden data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
				normalizeClass(props.class),
			)
		"
		data-slot="popover-content"
	>
		<slot />
	</PopoverContent>
</template>
