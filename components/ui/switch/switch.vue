<script setup lang="ts">
import { SwitchRoot, type SwitchRootEmits, type SwitchRootProps, SwitchThumb } from "radix-vue";

const props = defineProps<SwitchRootProps>();

const emit = defineEmits<SwitchRootEmits>();

const emitAsProps = useEmitAsProps(emit);
</script>

<template>
	<SwitchRoot
		v-bind="{ ...props, emitAsProps }"
		class="peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
	>
		<SwitchThumb
			class="pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
		/>
	</SwitchRoot>
</template>
