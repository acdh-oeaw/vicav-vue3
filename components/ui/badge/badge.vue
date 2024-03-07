<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { type BadgeVariants, badgeVariants } from "./index.ts";

const props = defineProps<{
	variant?: BadgeVariants["variant"];
	class?: HTMLAttributes["class"];
}>();
</script>

<template>
	<div :class="[badgeVariants({ variant }), props.class]">
		<slot />
	</div>
</template>
