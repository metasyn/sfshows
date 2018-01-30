import React, { Component } from 'react';
import { render } from 'react-dom';

import Parser from './components/parser';
import Util from './components/util';
import ShowMap from './components/map';

import '../css/stylish.css';

class Application extends Component {
  static plot() {
    const parsed = new Parser().parseData();

    parsed.then((data) => {
      Util.populateDates(data.dates);
    });
  }

  render() {
    Application.plot();
    return (
      <ShowMap />
    );
  }
}


render(<Application />, document.getElementById('app'));
