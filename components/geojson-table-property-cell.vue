<script setup lang="ts">
const props = defineProps<{
	value?: Record<string, unknown>;
}>();
</script>

<template>
	<Badge v-for="(key, value) in props.value" :key="value" class="mr-1" variant="outline">
		<div class="flex flex-col">
			<p class="line-clamp-1">{{ value }}</p>
			<Badge v-for="(subkey, subvalue) in key" :key="subvalue" class="ml-1" variant="secondary">
				<p class="line-clamp-1">{{ subvalue }}</p>
				<Badge v-for="(subsubkey, index) in subkey" :key="index" class="ml-1" variant="secondary">
					<Badge class="ml-1" variant="default">{{ subsubkey }}</Badge>
				</Badge>
			</Badge>
		</div>
	</Badge>
</template>
