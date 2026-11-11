<script lang="ts" setup>
import { toValue } from "vue";

import { useFormField } from "./useFormField.ts";

const { name, formMessageId } = useFormField();
</script>

<template>
	<p :id="formMessageId" class="text-sm font-medium text-destructive" :name="toValue(name)" />
</template>
