import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DateSelector from './DateSelector';

export default class Dates extends Component {
  makeDateSelectors = (dates) => {
    const selectors = [];
    for (let d = 0; d < dates.length; d += 1) {
      const selector = (<DateSelector
        date={dates[d].date}
        key={dates[d].id}
        handleCheckboxChange={this.props.handleCheckboxChange}
      />);
      selectors.push(selector);
    }
    return selectors;
  }
  render() { return this.makeDateSelectors(this.props.dates); }
}

Dates.propTypes = {
  // eslint-disable-next-line
  dates: PropTypes.array.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
};
