import React, { Component } from 'react';
import { render } from 'react-dom';

import $ from 'jquery';

import Parser from './components/Parser';
import Dates from './components/dates/Dates';
import ShowMap from './components/Map';

import '../css/stylish.css';

class Application extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dates: {},
    };
    this.toggleCheckbox = this.toggleCheckbox.bind(this);
  }

  componentWillMount() {
  }

  toggleCheckbox(date) {
    const idx = this.state.dates.findIndex((obj => obj.date === date));
    this.state.dates[idx].checked = !this.state.dates[idx].checked;
  }

  prepare() {
    const parsed = new Parser().parseData();

    // keys: organized, dates
    parsed.then((data) => {
      // Pass dates
      this.state.dates = data.dates;

      // Add the dates
      const dateEl = document.getElementById('date-selector-container');
      render(<Dates
        dates={this.state.dates}
        handleCheckboxChange={this.toggleCheckbox}
      />, dateEl);

      // Add the shows
      const mapEl = document.getElementById('app');
      render(<ShowMap
        dates={this.state.dates}
        geojson={data.geojson}
      />, mapEl);

      // Modals
      $('#filter-button').on('click', () => {
        $('#filterModal').toggleClass('hidden');
      });

      $('.close-filter-modal').on('click', () => {
        $('#filterModal').toggleClass('hidden');
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


  render() {
    this.prepare();
    return (
      <div />
    );
  }
}

render(<Application />, document.getElementById('app'));
