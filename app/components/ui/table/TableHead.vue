<script setup lang="ts"></script>

<template>
	<th
		class="h-12 px-4 text-left align-middle font-semibold text-foreground has-[[role=checkbox]]:pr-0"
		:class="$attrs.class"
	>
		<p class="line-clamp-1">
			<slot />
		</p>
	</th>
</template>
