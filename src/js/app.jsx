import React, { Component } from 'react';
import { render } from 'react-dom';

import _ from 'lodash';
import $ from 'jquery';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import Parser from './components/Parser';
import Dates from './components/dates/Dates';

import * as Util from './components/Util';

import '../css/stylish.css';

mapboxgl.accessToken = 'pk.eyJ1IjoibWV0YXN5biIsImEiOiIwN2FmMDNhNTRhOWQ3NDExODI1MTllMDk1ODc3NTllZiJ9.Bye80QJ4r0RJsKj4Sre6KQ';

const CLUSTER_RADIUS = 50;

class Application extends Component {
  constructor(props) {
    super(props);

    this.state = {
      query: '',
      dates: [],
      filteredByDate: [],
      filteredByMap: [],
      // filteredByQuery: [],
    };

    this.allShows = [];

    this.popup = new mapboxgl.Popup({
      closeButton: false,
    });

    this.bindMap = this.bindMap.bind(this);
    this.filterAll = this.filterAll.bind(this);
    this.filterToday = this.filterToday.bind(this);
    this.filterTomorrow = this.filterTomorrow.bind(this);
    this.toggleCheckbox = this.toggleCheckbox.bind(this);

    this.start = {
      lng: -122.416,
      lat: 37.76,
      zoom: 13,
    };
  }


  componentDidMount() {
    const parsed = new Parser().parseData();

    // keys: organized, dates
    parsed.then((data) => {
      // Set the selected dates
      this.setState({ dates: data.dates });
      this.allShows = data.geojson.features;


      this.setupMap(data.geojson, this.state.dates);

      // Modals
      $('#filter-button').on('click', () => {
        $('#filter-button').toggleClass('hidden');
        $('#hide-filter-button').toggleClass('hidden');
        $('#filters').toggleClass('hidden');
      });

      $('#hide-filter-button').on('click', () => {
        $('#filter-button').toggleClass('hidden');
        $('#hide-filter-button').toggleClass('hidden');
        $('#filters').toggleClass('hidden');
      });

      // Mobile only
      $('#see-list-button-mobile').on('click', () => {
        $('.map-overlay').css('height', '100%');
        $('#see-list-button').toggleClass('hidden');
      });

      $('.map-overlay .closebtn').on('click', () => {
        $('.map-overlay').css('height', 0);
        $('#see-list-button').toggleClass('hidden');
      });
    });
  }

  // Called on any state changes
  componentDidUpdate() {
    if (this.map) {
      // Get valid dates
      const checkedDates = _.filter(this.state.dates, _.matches({ checked: true }));
      const checkedDatesList = _.map(checkedDates, 'date');

      // Add the dates
      const dateEl = document.getElementById('date-selector-container');
      render(<Dates
        dates={this.state.dates}
        handleCheckboxChange={this.toggleCheckbox}
      />, dateEl);

      // Set filter for points
      this.map.setFilter('shows', ['in', 'date'].concat(checkedDatesList));

      // Update source, for clusters
      this.map.getSource('shows').setData({
        type: 'FeatureCollection',
        features: this.state.filteredByDate,
      });
    }
  }

  setupMap(geojson, dates) {
    const { lng, lat, zoom } = this.start;

    const map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/dark-v9',
      center: [lng, lat],
      zoom,
    });

    this.map = map;

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
        data: geojson,
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
          'circle-color': '#4CAF50',
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

      const getCheckedDatesList = () => {
        const checkedDates = _.filter(dates, _.matches({ checked: true }));
        return _.map(checkedDates, 'date');
      };

      /*
      const showAllShows = (data) => {
        map.getSource('shows').setData(data);
        map.setFilter('shows', ['has', 'sid']);
      };
      */

      const loadOnscreenShows = () => {
        const bounds = map.getBounds();
        const features = this.state.filteredByDate.filter(x =>
          inBounds(x.geometry.coordinates, bounds) &&
          _.includes(getCheckedDatesList(), x.properties.date));

        if (features) {
          const uniqueFeatures = Util.getUniqueFeatures(features, 'bands');
          // Populate features for the listing overlay.
          this.setState({ filteredByMap: uniqueFeatures });
        }
      };

      map.on('moveend', loadOnscreenShows);

      // We are in 'load' listener already
      this.setState({ filteredByDate: geojson.features });
      loadOnscreenShows();
      // Set state for first load


      map.on('click', 'clusters', (e) => {
        map.easeTo({
          center: e.features[0].geometry.coordinates,
          zoom: map.getZoom() + 1,
        });
      });

      map.on('click', (e) => {
        const m = 50;
        const bbox = [[e.point.x - m, e.point.y - m], [e.point.x + m, e.point.y + m]];
        const features = map.queryRenderedFeatures(bbox, { layers: ['shows'] });

        this.popup.remove();
        if (features.length) {
          this.addPopupAndEase(map, { features });
          // Hack to make popups work everytime
          // eslint-disable-next-line
          e.target._listeners['click'].pop();
        }
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


  searchBarKeyup(e) {
    const value = Util.normalize(e.target.value);
    // Unset filter if empty
    if (value === '') {
      // showAllShows(geojson);
    }

    if (this.popup.getLngLat()) {
      this.popup.remove();
    }

    // Filter visible features that don't match the input value.
    const filtered = this.state.filteredByMap.filter((feature) => {
      const match = (x) => {
        const prop = Util.normalize(feature.properties[x]);
        return prop.indexOf(value) > -1;
      };
      return Object.keys(feature.properties).some(match);
    });


    // Filter on source, for clusters
    this.map.getSource('shows').setData({
      type: 'FeatureCollection',
      features: filtered,
    });

    // Set the filter to populate features into the layer.
    const filteredShows = filtered.map(feature => feature.properties.sid);
    this.map.setFilter('shows', ['in', 'sid'].concat(filteredShows));

    // this.setState({ filteredByQuery: filtered });
  }

  toggleCheckbox(date) {
    const { dates } = this.state;
    const idx = dates.findIndex((obj => obj.date === date));
    dates[idx].checked = !dates[idx].checked;

    this.updateFilteredByDate(dates);
    this.setState({ dates });
  }

  addPopupAndEase(map, e) {
    // Change the cursor style as a UI indicator.
    // eslint-disable-next-line
    map.getCanvas().style.cursor = 'pointer';

    if (this.popup.getLngLat()) {
      this.popup.remove();
    }

    // This is potentially a bug - since we don't know if the bounding box
    // around the venue happened to return values from a different venue.
    // Not really sure how to fix it right now though...
    const point = e.features[0].geometry.coordinates;
    const singleVenue = e.features[0].properties.venue;

    map.easeTo({
      center: point,
      zoom: 15,
      duration: 1000,
    });

    // Populate the popup and set its coordinates based on the feature.
    if (!e.features[0].properties.cluster) {
      const singleVenueShows = e.features.filter(f => f.properties.venue === singleVenue);
      Util.addPopup(map, singleVenue, singleVenueShows, this.popup);
    }
  }

  updateFilteredByDate(dates) {
    const checkedDates = _.filter(dates, _.matches({ checked: true }));
    const checkedDatesList = _.map(checkedDates, 'date');

    const filteredByDate = this.allShows.filter(feature =>
      _.includes(checkedDatesList, feature.properties.date));

    this.setState({ filteredByDate });
  }


  filterAll() {
    const { dates } = this.state;
    const allDates = _.map(dates, (date) => {
      date.checked = true; return date;
    });

    this.setState({
      dates: allDates,
      query: '',
    });

    this.updateFilteredByDate(dates);

    $('#hide-filter-button').click();
  }

  filterDate(newDate) {
    const { dates } = this.state;

    const newDates = _.map(dates, (dateObj) => {
      const someday = newDate.toString().slice(0, 10);
      const somedayList = someday.split(' ');
      somedayList[2] = String(parseInt(somedayList[2], 10));
      const date = somedayList.join(' ');
      dateObj.checked = dateObj.date === date;
      return dateObj;
    });

    this.setState({ dates: newDates });
    this.updateFilteredByDate(dates);
    $('#hide-filter-button').click();
  }

  filterToday() {
    this.filterDate(new Date());
  }

  filterTomorrow() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.filterDate(tomorrow);
  }

  bindMap(el) {
    this.mapContainer = el;
  }

  render() {
    // Update the listings
    const listings = [];
    const { filteredByDate, filteredByMap } = this.state;
    const intersection = _.intersection(filteredByDate, filteredByMap);

    if (intersection.length) {
      intersection.forEach((feature) => {
        const prop = feature.properties;

        // add listener
        const venue = `<h1>${prop.venue}</h1><br/>`;
        const popupMouseOver = () => {
          // Highlight corresponding feature on the map
          this.popup.setLngLat(feature.geometry.coordinates)
            .setHTML(venue + prop.showHTML)
            .addTo(this.map);
        };

        const item = (
          <p key={prop.sid} onMouseOver={popupMouseOver} onFocus={popupMouseOver} >
            {prop.showString}
          </p>
        );
        listings.push(item);
      });
    } else {
      const text = this.state.query === '' ? 'Drag the map to populate results' : 'No shows match criteria.';
      listings.push(<p key="empty">{text}</p>);
    }

    return (
      <div>
        <div ref={this.bindMap} className="absolute top right left bottom" />

        <div id="see-list-button-mobile">
          <div className="button-container">
            <button href="#" id="open-list" className="button overlay-item">See List</button>
          </div>
        </div>


        <div className="map-overlay">
          <button className="closebtn">&#215;</button>

          <fieldset>
            <input
              value={this.state.query}
              onKeyUp={this.searchBarKeyup}
              className="overlay-item"
              id="feature-filter"
              type="text"
              placeholder="Search results"
            />
          </fieldset>


          <div className="button-container">
            <button id="filter-button" className="button overlay-item">Filter shows</button>
            <button id="hide-filter-button" className="hidden button overlay-item">Hide filters</button>
          </div>

          <div id="filters" className="hidden">
            <div className="button-container">
              <button id="filter-today" onClick={this.filterToday} className="button">Today</button>
              <button id="filter-tomorrow" onClick={this.filterTomorrow} className="button">Tomorrow</button>
              <button id="filter-all" onClick={this.filterAll} className="button">All Shows</button>
            </div>
            <div>
              <div id="date-selector-container" />
            </div>
          </div>


          <div id="feature-listing" className="listing">
            { listings }
          </div>
        </div>
      </div>
    );
  }
}

render(<Application />, document.getElementById('app'));
