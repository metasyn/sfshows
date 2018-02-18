import React, { Component } from 'react';
import PropTypes from 'prop-types';

import _ from 'lodash';
import $ from 'jquery';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'mapboxgl-spiderifier/lib/mapboxgl-spiderifier.css';

import * as Util from './Util';

mapboxgl.accessToken = 'pk.eyJ1IjoibWV0YXN5biIsImEiOiIwN2FmMDNhNTRhOWQ3NDExODI1MTllMDk1ODc3NTllZiJ9.Bye80QJ4r0RJsKj4Sre6KQ';

const CLUSTER_RADIUS = 50;

class ShowMap extends Component {
  constructor(props) {
    super(props);

    // Centered on SF
    this.state = {
      lng: -122.416,
      lat: 37.76,
      zoom: 13,
    };

    this.onscreenShows = [];

    this.popup = new mapboxgl.Popup({
      closeButton: false,
    });

    this.filterEl = document.getElementById('feature-filter');
    this.listingEl = document.getElementById('feature-listing');

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
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: CLUSTER_RADIUS,
      });

      // Main layer
      map.addLayer({
        id: 'shows',
        type: 'circle',
        source: 'shows',
        paint: {
          'circle-color': '#11b4da',
          'circle-radius': 10,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
        },
      });


      function inBounds(coordinates, bounds) {
        // coordinates is always lngLat
        // eslint-disable-next-line
        const ew = _.inRange(coordinates[0], bounds._sw.lng, bounds._ne.lng);
        // eslint-disable-next-line
        const ns = _.inRange(coordinates[1], bounds._sw.lat, bounds._ne.lat);
        return ns && ew;
      }

      const showAllShows = (data) => {
        // todo
        _.each(this.props.dates, x => _.set(x, 'checked', true));
        map.getSource('shows').setData(data);
        map.setFilter('shows', ['has', 'sid']);
      };

      map.on('moveend', () => {
        const bounds = map.getBounds();
        const checkedDates = _.filter(this.props.dates, _.matches({ checked: true }));
        const checkedDatesList = _.map(checkedDates, 'date');
        const features = this.props.geojson.features.filter(x =>
          inBounds(x.geometry.coordinates, bounds) && _.includes(checkedDatesList, x.properties.date));

        if (features) {
          const uniqueFeatures = Util.getUniqueFeatures(features, 'bands');
          // Populate features for the listing overlay.
          this.renderListings(map, uniqueFeatures);

          // Store the current features in sn `onscreenShows` variable to
          // later use for filtering on `keyup`.
          this.onscreenShows = uniqueFeatures;
        }
      });


      map.on('click', 'clusters', (e) => {
        map.easeTo({
          center: e.features[0].geometry.coordinates,
          zoom: map.getZoom() + 1,
        });
      });

      map.on('click', 'shows', e => this.addPopupAndEase(map, e));

      this.filterEl.addEventListener('keyup', (e) => {
        const value = Util.normalize(e.target.value);
        // Unset filter if empty
        if (value === '') {
          showAllShows(this.props.geojson);
        }

        if (this.popup.getLngLat()) {
          this.popup.remove();
        }

        // Filter visible features that don't match the input value.
        //
        const checkedDates = _.filter(this.props.dates, _.matches({ checked: true }));
        const checkedDatesList = _.map(checkedDates, 'date');
        const filtered = this.onscreenShows.filter((feature) => {
          const selected = _.includes(checkedDatesList, feature.properties.date);
          const match = (x) => {
            const prop = Util.normalize(feature.properties[x]);
            return prop.indexOf(value) > -1 && selected;
          };
          return Object.keys(feature.properties).some(match);
        });


        // Populate the sidebar with filtered results
        this.renderListings(map, filtered);

        // Filter on source, for clusters
        map.getSource('shows').setData({
          type: 'FeatureCollection',
          features: filtered,
        });

        // Set the filter to populate features into the layer.
        const filteredShows = filtered.map(feature => feature.properties.sid);
        map.setFilter('shows', ['in', 'sid'].concat(filteredShows));
      });

      // Call this function on initialization
      // passing an empty array to render an empty state
      this.renderListings(map, []);

      $('#filter-all').on('click', () => {
        // Util.toggleDates('all');
        showAllShows(this.props.geojson);
        this.filterEl.value = '';
        $('.close-filter-modal').click();
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'shows',
        filter: ['has', 'point_count'],
        paint: {
          // Use step expressions (https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
          // with three steps to implement three types of circles:
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6',
            50,
            '#f1f075',
            100,
            '#f28cb1',
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            50,
            30,
            100,
            40,
          ],
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'shows',
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 12,
        },
      });
    });
  }

  addPopupAndEase(map, e) {
    // Change the cursor style as a UI indicator.
    // eslint-disable-next-line
    map.getCanvas().style.cursor = 'pointer';

    if (this.popup.getLngLat()) {
      this.popup.remove();
    }

    const point = e.features[0].geometry.coordinates;

    map.easeTo({
      center: point,
      zoom: 15,
      duration: 1000,
    });

    // Populate the popup and set its coordinates based on the feature.
    if (!e.features[0].properties.cluster) {
      Util.addPopup(map, e.features, this.popup);
    }
  }


  bindMap(el) {
    this.mapContainer = el;
  }

  renderListings(map, features) {
    // Clear any existing listings
    this.listingEl.innerHTML = '';
    if (features.length) {
      features.forEach((feature) => {
        const prop = feature.properties;
        const item = document.createElement('p');
        item.textContent = prop.showString;
        const venue = `<h1>${prop.venue}</h1><br/>`;
        item.addEventListener('mouseover', () => {
          // Highlight corresponding feature on the map
          this.popup.setLngLat(feature.geometry.coordinates)
            .setHTML(venue + prop.showHTML)
            .addTo(map);
        });
        this.listingEl.appendChild(item);
      });

      // Show the filter input
      this.filterEl.parentNode.style.display = 'block';
    } else {
      const empty = document.createElement('p');
      const text = this.filterEl.value === '' ? 'Drag the map to populate results' : 'No shows match criteria.';
      empty.textContent = text;
      this.listingEl.appendChild(empty);

      // Hide the filter input
      this.filterEl.parentNode.style.display = 'block';

      // remove features filter
      map.setFilter('shows', ['has', 'sid']);
    }
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
  // eslint-disable-next-line
  geojson: PropTypes.object.isRequired,
  dates: PropTypes.array.isRequired,
};

export default ShowMap;
