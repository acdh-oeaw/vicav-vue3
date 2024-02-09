<script setup lang="ts"></script>

<template>
	<tfoot class="border-t bg-muted/50 font-medium [&>tr]:last:border-b-0" :class="$attrs.class">
		<slot />
	</tfoot>
</template>
