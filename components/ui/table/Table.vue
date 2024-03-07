<script setup lang="ts"></script>

<template>
	<div class="relative w-full overflow-visible">
		<table class="w-full caption-bottom text-sm" :class="$attrs.class">
			<slot />
		</table>
	</div>
</template>
