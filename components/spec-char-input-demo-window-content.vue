<script setup>
const myString = ref("");
</script>

<template>
	<div>
		<div>
			<InputExtended v-model="myString" />
		</div>
		<div>
			{{ myString }}
		</div>
	</div>
</template>
