<script lang="ts" setup>
import { toValue } from "vue";

import { useFormField } from "./useFormField.ts";

const { name, formMessageId } = useFormField();
</script>

<template>
	<p :id="formMessageId" class="text-destructive text-sm font-medium" :name="toValue(name)" />
</template>
