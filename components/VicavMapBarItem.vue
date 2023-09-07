<script setup lang="ts">

import {IMapBarItem} from "~/store/appData";

const hover = ref(false);

const props = defineProps<{
  item: IMapBarItem;
}>();
</script>

<template>
    <span :id="item.id"
          :class="{ active: hover }"
          @mouseover="hover = true"
          @mouseleave="hover = false">
      <font-awesome-icon :icon="item.icon" aria-hidden="true"/>
      {{ item.title }}
    </span>
</template>

<style scoped lang="scss">
span {
  margin-right: 15px;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.1s ease-in;
}

.active {
  color: #252771;
}
</style>
