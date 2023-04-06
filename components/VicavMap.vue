<template>
	<l-map ref="map" :center="[19.064, 24.544]" :zoom="4">
		<l-tile-layer
			url="https://api.mapbox.com/styles/v1/acetin/cjb22mkrf16qf2spyl3u1vee3/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWNldGluIiwiYSI6ImNqYjIybG5xdTI4OWYyd285dmsydGFkZWQifQ.xG4sN5u8h-BoXaej6OjkXw"
			:maxZoom="20"
		/>
		<l-feature-group @click="overlapHandler">
			<l-marker
				v-for="(marker, index) in markers"
				:key="index"
				:draggable="false"
				:latLng="marker.coords"
				:options="marker.options"
			></l-marker>
		</l-feature-group>
	</l-map>
</template>

<style scoped></style>

<script>
// DON'T load Leaflet components here!
// Its CSS is needed though, if not imported elsewhere in your application.
import "leaflet/dist/leaflet.css";
import { LMap, LMarker, LTileLayer, LFeatureGroup } from "@vue-leaflet/vue-leaflet";

import { overlapHandler } from "../lib/overlap";
import { splitCoords, convertDMSToDD, parseStringToDMS } from "../lib/coords";

import axios from "axios";

export default {
	components: {
		LMap,
		LMarker,
		LTileLayer,
		LFeatureGroup,
	},
	data() {
		return {
			markers: [],
		};
	},
	methods: {
		overlapHandler: overlapHandler,
	},
	async created() {
		axios({
			baseURL: "http://" + import.meta.env.VITE_BASEURL,
			url: "/feature_markers",
			type: "GET",
		})
			.then(response => {
				let responseDoc = new DOMParser().parseFromString(response.data, "application/xml");
				Array.from(responseDoc.getElementsByTagName("r")).forEach((r, index) => {
					let coord = {};
					let sID = r.getAttribute("xml:id");
					console.log(r.getElementsByTagName("alt")[0].childNodes[0]);
					let sAlt = r.getElementsByTagName("alt")[0]
						? r.getElementsByTagName("alt")[0].childNodes[0].nodeValue
						: "";

					Array.from(r.getElementsByTagName("loc")).forEach(l => {
						if (l.childNodes[0] && l.childNodes[0].nodeValue) {
							coord = splitCoords(l.childNodes[0].nodeValue);
						}
					});

					let dmslat = parseStringToDMS(coord.lat);
					let declat = convertDMSToDD(dmslat.deg, dmslat.min, dmslat.sec, dmslat.dir);

					let dmslng = parseStringToDMS(coord.lng);
					let declng = convertDMSToDD(dmslng.deg, dmslng.min, dmslng.sec, dmslng.dir);
					this.markers.push({
						coords: [declat, declng],
						options: { alt: sAlt, id: sID, type: "feature" },
					});
				});
			})
			.catch(errorThrown => {
				console.error("Error loading feature marker: " + errorThrown.message);
			});
	},
	async beforeMount() {
		// HERE is where to load Leaflet components!
		// And now the Leaflet circleMarker function can be used by the options:
		this.mapIsReady = true;
	},
};
</script>
