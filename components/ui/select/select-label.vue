<script setup lang="ts"></script>

<template>
	<SelectLabel :class="['py-1.5 pl-8 pr-2 text-sm font-semibold', $attrs.class]">
		<slot />
	</SelectLabel>
</template>
