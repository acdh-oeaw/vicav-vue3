<script setup lang="ts"></script>

<template>
	<th
		class="text-muted-foreground h-12 px-4 text-left align-middle font-bold [&:has([role=checkbox])]:pr-0"
		:class="$attrs.class"
	>
		<p class="line-clamp-1">
			<slot />
		</p>
	</th>
</template>
