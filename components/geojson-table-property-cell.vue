<script setup lang="ts">
const props = defineProps<{
	value: Record<string, unknown>;
}>();
</script>

<template>
	<Badge v-for="(key, value) in props.value" :key="value" variant="outline" class="mr-1">
		<div class="flex flex-col">
			<p class="line-clamp-1">{{ value }}</p>
			<Badge v-for="(subkey, subvalue) in key" :key="subvalue" variant="secondary" class="ml-1">
				<p class="line-clamp-1">{{ subvalue }}</p>
				<Badge v-for="(subsubkey, index) in subkey" :key="index" variant="secondary" class="ml-1">
					<Badge variant="default" class="ml-1">{{ subsubkey }}</Badge>
				</Badge>
			</Badge>
		</div>
	</Badge>
</template>
