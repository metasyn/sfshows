import React, { Component } from 'react';
import PropTypes from 'prop-types';

import DateSelector from './DateSelector';

export default class Dates extends Component {
  constructor(props) {
    super(props);
    this.makeDateSelectors = this.makeDateSelectors.bind(this);
  }

  makeDateSelectors(dates) {
    const selectors = [];
    for (let d = 0; d < dates.length; d += 1) {
      const selector = (<DateSelector
        date={dates[d].date}
        key={dates[d].id}
        isChecked={dates[d].checked}
        handleCheckboxChange={this.props.handleCheckboxChange}
        handleOnlyIsolation={this.props.handleOnlyIsolation}
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
  handleOnlyIsolation: PropTypes.func.isRequired,
};
