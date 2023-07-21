<script setup lang="ts">

</script>

<template>
  <div class="sub-nav">
    <div class="container-fluid">
      <div class="sub-nav-map-items">
        <span id="subNavBiblGeoMarkers" class=""><font-awesome-icon icon="fa fa-map" aria-hidden="true"/> Bibl. Locations</span>
        <span id="subNavBiblRegMarkers" class=""><font-awesome-icon icon="fa fa-map" aria-hidden="true"/> Bibl. Regions</span>
        <span  id="subNavDictGeoRegMarkers" class=""><font-awesome-icon icon="fa fa-map" aria-hidden="true"/> Bibl. (Dictionaries)</span>
        <span  id="subNavTextbookGeoRegMarkers" class=""><font-awesome-icon icon="fa fa-map" aria-hidden="true"/> Bibl. (Textbooks)</span>
        <span  id="subNavProfilesGeoRegMarkers" class=""><font-awesome-icon icon="fa fa-map" aria-hidden="true"/> Profiles</span>
        <span  id="subNavFeaturesGeoRegMarkers" class=""><font-awesome-icon icon="fa fa-map" aria-hidden="true"/> Features</span>
        <span  id="subNavSamplesGeoRegMarkers" class=""><font-awesome-icon icon="fa fa-map" aria-hidden="true"/> Samples</span>
        <span  id="subNavVicavDictMarkers" class="active"><font-awesome-icon icon="fa fa-map" aria-hidden="true"/> VICAV Dictionaries</span>
      </div>
      <div class="sub-nav-actions">
        <span id="sub-nav-expand" class=""><font-awesome-icon icon="fa fa-expand" aria-hidden="true"/> Expand Panels Over Map</span>
        <span id="sub-nav-close"><font-awesome-icon icon="fa fa-window-close" aria-hidden="true"/> Close All</span>
        <span id="sub-nav-share">
            <font-awesome-icon icon="fa fa-link" aria-hidden="true"/> Share Current View
            <span id="sub-nav-share-confirmation" style="display: none;">URL is copied to clipboard!</span>
          </span>
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

.sub-nav span {
  margin-right: 15px;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.1s ease-in;
}

.sub-nav .container-fluid {
  display: flex;
}

.sub-nav-actions {
  margin-left: auto;
}
</style>
