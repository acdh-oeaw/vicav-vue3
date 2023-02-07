<script setup lang="ts">
const { $api } = useNuxtApp();

let projectInfo = await $api.project.getProject({mode: "no-cors", headers: { ACCEPT: "application/json" }});

</script>
<template>
  <div>
    This is becoming VICAV on Nuxt.
    <p>{{ JSON.stringify(projectInfo.data) }}</p>
  </div>
</template>
