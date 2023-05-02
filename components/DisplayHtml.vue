<script setup lang="ts">
/* params.content: string - the HTML code to be displayed
 */
	const props = defineProps(['params'])
</script>

<template>
	<div v-html="props.params.content"></div>
</template>
