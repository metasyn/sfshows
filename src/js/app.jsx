import React, { Component } from 'react';
import { render } from 'react-dom';

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
      console.log(data.geojson)
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
