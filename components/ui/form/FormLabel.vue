<script lang="ts" setup>
import type { LabelProps } from "radix-vue";
import { twMerge } from "tailwind-merge";
import type { HTMLAttributes } from "vue";

import { useFormField } from "./useFormField.ts";

const props = defineProps<LabelProps & { class?: HTMLAttributes["class"] }>();

const { error, formItemId } = useFormField();
</script>

<template>
	<label :class="twMerge(error && 'text-destructive', props.class)" :for="formItemId">
		<slot />
	</label>
</template>
