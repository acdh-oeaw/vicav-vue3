<script setup lang="ts"></script>

<template>
	<th
		class="text-muted-foreground h-12 px-4 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0"
		:class="$attrs.class"
	>
		<slot />
	</th>
</template>
