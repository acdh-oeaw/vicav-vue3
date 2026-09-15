<script lang="ts" setup>
import { twMerge } from "tailwind-merge";
import { type HTMLAttributes, normalizeClass } from "vue";

import { useFormField } from "./useFormField.ts";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();

const { formDescriptionId } = useFormField();
</script>

<template>
	<p
		:id="formDescriptionId"
		:class="twMerge('text-sm text-muted-foreground', normalizeClass(props.class))"
	>
		<slot />
	</p>
</template>
