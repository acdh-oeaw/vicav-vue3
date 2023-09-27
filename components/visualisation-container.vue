<script lang="ts" setup>
import { ref } from "vue";

const elementRef = ref<HTMLElement | null>(null);

const dimensions = useElementDimensions(elementRef);
</script>

<template>
	<div
		ref="elementRef"
		class="relative isolate grid h-full w-full overflow-hidden"
		data-visualisation-container
	>
		<slot v-if="dimensions != null" :width="dimensions.width" :height="dimensions.height" />
	</div>
</template>
