import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DateSelector from './DateSelector';

export default class Dates extends Component {
  constructor(props) {
    super(props);
    this.makeDateSelectors = this.makeDateSelectors.bind(this);
    this.showShows = this.showShows.bind(this);
  }

  // eslint-disable-next-line
  showShows(){}

  makeDateSelectors(dates) {
    const selectors = [];
    for (let d = 0; d < dates.length; d += 1) {
      const selector = (<DateSelector
        showShows={this.showShows}
        date={dates[d]}
        key={dates[d]}
      />);
      selectors.push(selector);
    }
    return selectors;
  }
  render() { return this.makeDateSelectors(this.props.dates); }
}

Dates.propTypes = {
  dates: PropTypes.array.isRequired,
};
