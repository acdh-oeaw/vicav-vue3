<script setup lang="ts"></script>

<template>
	<span :class="['ml-auto text-xs tracking-widest opacity-60', $attrs.class]">
		<slot />
	</span>
</template>
