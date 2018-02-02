export default class Plotter {
  static plotShows(organized) {
    return organized;
  }
}

/*
function plotShows(geojson) {
  // update function for coordinates infobox
  window.onmove = function onmove() {
    // Get the map bounds - the top-left and bottom-right locations.
    const inBounds = [],
      bounds = map.getBounds();
    clusterGroup.eachLayer((marker) => {
      // For each marker, consider whether it is currently visible by comparing
      // with the current map bounds.
      if (bounds.contains(marker.getLatLng()) && selectedDatesList.indexOf(marker.feature.properties.date) !== -1) {
        const feature = marker.feature;
        const coordsTemplate = L.mapbox.template('{{properties.date}} - {{properties.venue}} |{{#properties.bands}} {{.}} |{{/properties.bands}}{{properties.details}}', feature);
        inBounds.push(coordsTemplate);
      }
    });
    // Display a list of markers.
    inBounds.reverse();
    document.getElementById('coordinates').innerHTML = inBounds.join('\n');
  };

  // attach data
  const myLayer = L.mapbox.featureLayer(geojson);

  // make clustergroup
  const clusterGroup = ModifiedClusterGroup();
  // add features
  clusterGroup.addLayer(myLayer);
  overlays = L.layerGroup().addTo(map);
  // add cluster layer
  // overlays are multiple layers
  // add in showShows()
  showShows();

  // for each layer in feature layer
  myLayer.eachLayer((e) => {
    const marker = e;
    const feature = e.feature;

    // Create custom popup content
    const popupContent = L.mapbox.template('<h1> {{properties.venue}} </h1><br><h3> {{properties.date}} </h3><br><h2> {{#properties.bands}} - {{.}} <br> {{/properties.bands}} </h2><br><h2> {{properties.details}} </h2><br>', feature);

    marker.bindPopup(popupContent, {
      closeButton: true,
      minWidth: 320,
    });
  });


  map.on('move', onmove);
  // call onmove off the bat so that the list is populated.
  // otherwise, there will be no markers listed until the map is moved.
  window.onmove();
}

function ModifiedClusterGroup() {
  return new L.MarkerClusterGroup({
    spiderfyOnMaxZoom: true,
    maxClusterRadius: 1,
    spiderfyDistanceMultiplier: 3,
  });
}
*/
