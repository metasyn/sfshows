import $ from 'jquery';

import mapboxgl from 'mapbox-gl';
import MapboxglSpiderfier from 'mapboxgl-spiderifier';

function createOverlay(markerObject) {
  const offset = 10;
  const iconOffsetX = markerObject.spiderParam.x;
  const iconOffsetY = markerObject.spiderParam.y;

  function offsetVariant(offsetAmount, variantX, variantY) {
    return [offsetAmount[0] + (variantX || 0), offsetAmount[1] + (variantY || 0)];
  }

  const popupOverlay = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: false,
    offset: {
      top: offsetVariant([0, offset], iconOffsetX, iconOffsetY),
      'top-left': offsetVariant([offset, offset], iconOffsetX, iconOffsetY),
      'top-right': offsetVariant([-offset, offset], iconOffsetX, iconOffsetY),
      bottom: offsetVariant([0, -offset], iconOffsetX, iconOffsetY),
      'bottom-left': offsetVariant([offset, -offset], iconOffsetX, iconOffsetY),
      'bottom-right': offsetVariant([-offset, -offset], iconOffsetX, iconOffsetY),
      left: offsetVariant([offset, -offset], iconOffsetX, iconOffsetY),
      right: offsetVariant([-offset, -offset], iconOffsetX, iconOffsetY),
    },
  });

  return popupOverlay;
}

export default function setupSpiderify(map) {
  const spiderifier = new MapboxglSpiderfier(mapboxgl.Marker, map, {
    animate: true,
    animationSpeed: 200,
    spiralLengthFactor: 20,
    onClick(e, marker) {
      console.log(marker);
    },

    initializeMarker(markerObject) {
      const el = markerObject.elements.marker;
      el.className = 'marker';

      let popupOverlay;
      $(el)
        .on('mouseenter', () => {
          popupOverlay = createOverlay(markerObject);

          popupOverlay.setHTML(markerObject.properties.showHTML)
            .addTo(map);

          markerObject.mapboxMarker.setPopup(popupOverlay);
        })
        .on('mouseleave', () => {
          if (popupOverlay) {
            popupOverlay.remove();
          }
        });
    },
  });
  return spiderifier;
}
