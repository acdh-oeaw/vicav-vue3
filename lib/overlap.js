import {getEntity} from '../lib/data'

export function overlapHandler(e) {
    console.log(e)
    function ptDistanceSq(pt1, pt2) {
        let dx = pt1.x - pt2.x
        let dy = pt1.y - pt2.y
        return dx * dx + dy * dy
    }

    let mainMap = e.target._map

    let marker = e.layer
    let featureGroup = Object.values(marker._eventParents)[0]
    let distance = Math.floor(1.5 * mainMap.getZoom())

    mainMap.closePopup();

    let nearbyMarkerData = []
    let nonNearbyMarkers = []
    let pxSq = distance * distance
    let markerPt = mainMap.latLngToLayerPoint(marker.getLatLng())
    Object.values(featureGroup._layers).forEach(m => {
        if (mainMap.hasLayer(m)){
            let mPt = mainMap.latLngToLayerPoint(m.getLatLng())
            if (ptDistanceSq(mPt, markerPt) < pxSq){
              nearbyMarkerData.push({marker: m, markerPt: mPt})
            }
            else {
              nonNearbyMarkers.push(m)
            }   
        }
    })

    //console.log(nearbyMarkerData)

    if (nearbyMarkerData.length == 1) { // 1 => the one clicked => none nearby
        getEntity(marker.options.type, marker.options.alt, marker.options.id).then(e => {
            this.$emit('input', e)
        })
    } else {
        let popupContent = '<h5>Near locations</h5><ul class="overlapping-markers">'
        nearbyMarkerData.sort((a,b) => { 
            return a.marker.options.alt.localeCompare(b.marker.options.alt); }
        ).forEach(data => {
            let typeLink = exploreDataStrings[data.marker.options.type].single_selector
            popupContent += '<li class="overlapping-marker-label"><a href="#" ' + typeLink +'="'+data.marker.options.id + '">' + data.marker.options.alt + '</a></li>'
        })

        popupContent = popupContent + '</ul>';
        console.log(popupContent);
        marker.bindPopup(popupContent).openPopup()
      }
}
