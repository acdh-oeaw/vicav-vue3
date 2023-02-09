<script setup lang="ts">
interface Menu {
  id: string,
  title: string,
  item: Object[]
}

interface Props {
  menu: Menu[];
}

const props = withDefaults(defineProps<Props>(), {
  menu: () => [],
})
</script>

<template>
  <nav class="navbar navbar-expand-md navbar-dark fixed-top">
    <div class="container-fluid">
      <a class="navbar-brand mr-0 mr-md-2" aria-label="Vicav" href="/"><img alt="logo" src="~/assets/vicav_logo.svg"></a>
      <p>{{ menu }}</p>
      <p>sdlfh</p>
    </div>
  </nav>
</template>