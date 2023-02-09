<script setup lang="ts">
const { $api } = useNuxtApp();

$api.baseUrl = "https://vicav.acdh-ch-dev.oeaw.ac.at/vicav";
let menu = [];
try {
  let projectInfo = await $api.project.getProject({headers: { 'Accept': 'application/json' }});
  console.log(projectInfo);
} catch (error) {
  console.error(error)
}


</script>
<template>
  <div>
    <MainMenu :menu="menu" />
    <nuxt-page />
  </div>
</template>

<style>
</style>
