<script setup lang="ts">
const hover = ref(false);
const navItems = [
  {"id": "subNavBiblGeoMarkers", "icon": "fa fa-map", "title": "Bibl. Locations"},
  {"id": "subNavBiblRegMarkers", "icon": "fa fa-map", "title": "Bibl. Regions"},
  {"id": "subNavDictGeoRegMarkers", "icon": "fa fa-map", "title": "Bibl. (Dictionaries)"},
  {"id": "subNavTextbookGeoRegMarkers", "icon": "fa fa-map", "title": "Bibl. (Textbooks)"},
  {"id": "subNavProfilesGeoRegMarkers", "icon": "fa fa-map", "title": "Profiles"},
  {"id": "subNavFeaturesGeoRegMarkers", "icon": "fa fa-map", "title": "Features"},
  {"id": "subNavSamplesGeoRegMarkers", "icon": "fa fa-map", "title": "Samples"},
  {"id": "subNavVicavDictMarkers", "icon": "fa fa-map", "title": "VICAV Dictionaries"}
]

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
        <VicavMapBarItem v-for="item in navItems" :item="item"></VicavMapBarItem>
      </div>
      <div class="sub-nav-actions">
        <VicavMapBarItem v-for="item in funcItems" :item="item"></VicavMapBarItem>
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
  right: 0;
  left: 0;
  z-index: 1000;
}

.sub-nav .container-fluid {
  display: flex;
}

.sub-nav-actions {
  margin-left: auto;
}


</style>
