<script setup lang="ts">
import { VicavWinBox } from "~/components/VicavWinBox.client";
const options = {
  x: 500,
  y: 200
}
</script>
<template>
  <client-only>
    <VicavWinBox :options="options"></VicavWinBox>
  </client-only>
this is a test page
</template>
