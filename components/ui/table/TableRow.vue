<script setup lang="ts"></script>

<template>
	<tr
		class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
		:class="$attrs.class"
	>
		<slot />
	</tr>
</template>
