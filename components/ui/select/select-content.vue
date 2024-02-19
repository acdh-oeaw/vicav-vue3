<script setup lang="ts">
import {
	SelectContent,
	type SelectContentEmits,
	type SelectContentProps,
	SelectPortal,
	SelectViewport,
	useEmitAsProps,
} from "radix-vue";

defineOptions({
	inheritAttrs: false,
});

const props = withDefaults(defineProps<SelectContentProps>(), {
	position: "popper",
});
const emits = defineEmits<SelectContentEmits>();

const emitAsProps = useEmitAsProps(emits);
</script>

<template>
	<SelectPortal>
		<SelectContent
			v-bind="{ ...props, ...emitAsProps }"
			:class="[
				{
					'min-w-32 bg-popover text-popover-foreground relative z-50 max-h-96 overflow-hidden rounded-md border shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2':
						position === 'popper',
				},
				'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
				$attrs.class,
			]"
		>
			<SelectScrollUpButton />
			<SelectViewport
				:class="[
					{ 'p-1': position === 'popper' },
					'h-[--radix-select-trigger-height] w-full min-w-[--radix-select-trigger-width]',
				]"
			>
				<slot />
			</SelectViewport>
			<SelectScrollDownButton />
		</SelectContent>
	</SelectPortal>
</template>
