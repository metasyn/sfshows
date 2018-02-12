import React, { Component } from 'react';
import { render } from 'react-dom';

import $ from 'jquery';

import Parser from './components/Parser';
import Dates from './components/dates/Dates';
import ShowMap from './components/Map';

import '../css/stylish.css';

class Application extends Component {
  static prepare() {
    const parsed = new Parser().parseData();

    // keys: organized, dates
    parsed.then((data) => {
      // Pop modal?
      // TODO

      // Add the dates
      const dateEl = document.getElementById('date-selector-container');
      render(<Dates dates={data.dates} />, dateEl);

      // Add the shows
      const mapEl = document.getElementById('app');
      render(<ShowMap geojson={data.geojson} />, mapEl);

      // Add listeners
      $('#filter-button').on('click', () => {
        $('.filters').toggleClass('hidden');
      });

      $('#see-list-button').on('click', () => {
        $('.map-overlay').css('height', '100%');
        $('#see-list-button').toggleClass('hidden');
      });

      $('.closebtn').on('click', () => {
        $('.map-overlay').css('height', 0);
        $('#see-list-button').toggleClass('hidden');
      });
    });
  }

  render() {
    Application.prepare();
    return (
      <div />
    );
  }
}


render(<Application />, document.getElementById('app'));
