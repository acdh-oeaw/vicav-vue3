<script setup lang="ts"></script>

<template>
	<td class="p-4 align-middle [&:has([role=checkbox])]:pr-0" :class="$attrs.class">
		<slot />
	</td>
</template>
