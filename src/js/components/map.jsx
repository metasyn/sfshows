import React, { Component } from 'react';
import PropTypes from 'prop-types';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import Venues from '../../data/venues.json';

mapboxgl.accessToken = 'pk.eyJ1IjoibWV0YXN5biIsImEiOiIwN2FmMDNhNTRhOWQ3NDExODI1MTllMDk1ODc3NTllZiJ9.Bye80QJ4r0RJsKj4Sre6KQ';

class ShowMap extends Component {
  constructor(props) {
    super(props);

    // Centered on SF
    this.state = {
      lng: -122.416,
      lat: 37.76,
      zoom: 13,
    };

    this.bindMap = this.bindMap.bind(this);
  }

  componentDidMount() {
    const { lng, lat, zoom } = this.state;

    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [lng, lat],
      zoom,
    });

    // Add locator control
    map.addControl(new mapboxgl.GeolocateControl({
      positionOpionts: {
        enableHighAccuracy: true,
      },
      trackUserLocation: true,
    }));

    // Add the actual shows
    map.on('load', () => {
      map.addSource('shows', {
        type: 'geojson',
        data: this.props.geojson,
      });
    });

    map.on('move', () => {
      const center = map.getCenter();

      this.setState({
        lng: center.lng.toFixed(4),
        lat: center.lat.toFixed(4),
        zoom: map.getZoom().toFixed(2),
      });
    });

    ShowMap.plotMarkers(this.props.geojson, map);
  }

  bindMap(el) {
    this.mapContainer = el;
  }

  static plotMarkers(geojson, map) {
    geojson.features.forEach((marker) => {
      const el = document.createElement('div');
      el.className = 'marker';

      const lngLat = Venues[marker.geometry.coordinates];
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(marker.properties.showHTML)

      if (lngLat) {
        try {
          new mapboxgl.Marker(el)
            .setLngLat(lngLat)
            .setPopup(popup)
            .addTo(map);
        } catch (e) {
          console.log(e)
        }
      }
    });
  }


  render() {
    return (
      <div>
        <div ref={this.bindMap} className="absolute top right left bottom" />
      </div>
    );
  }
}

ShowMap.propTypes = {
  geojson: PropTypes.object.isRequired,
};

export default ShowMap;
