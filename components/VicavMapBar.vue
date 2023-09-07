<script setup lang="ts">
import { useAppDataStore } from '~~/store/appData';
const AppDataStore = useAppDataStore();

const funcItems = [
  {"id": "sub-nav-expand", "icon": "fa fa-expand", "title": "Expand Panels Over Map"},
  {"id": "sub-nav-close", "icon": "fa fa-window-close", "title": "Close All"},
  {"id": "sub-nav-share", "icon": "fa fa-link", "title": "Share Current View"},
]
</script>

<template>
  <div class="sub-nav">
    <div class="container-fluid">
      <div class="sub-nav-map-items">
        <VicavMapBarItem v-for="item in AppDataStore.mapBarMenu" :item="item"></VicavMapBarItem>
      </div>
      <div class="sub-nav-actions">
        <VicavMapBarItem v-for="item in funcItems" :item="item"></VicavMapBarItem>
      </div>
      <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault">
        <label class="form-check-label" for="flexSwitchCheckDefault">Map Mode Switch</label>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sub-nav {
  background-color: rgb(168, 93, 143);
  color: #fff;
  padding: 5px 20px;
  box-shadow: 1px 1px 1px #cacaca;
  margin-bottom: 1px;
  position: fixed;
  top: 68px;
  width: 100%;
  z-index: 1000;
}

.sub-nav .container-fluid {
  display: flex;
}

.sub-nav-actions {
  margin-left: auto;
}

.form-check-label {
  margin-right: 15px;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.1s ease-in;
}

</style>
