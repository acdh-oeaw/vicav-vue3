<script setup lang="ts"></script>

<template>
	<tbody class="[&_tr:last-child]:border-0" :class="$attrs.class">
		<slot />
	</tbody>
</template>
