import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class DateSelector extends Component {
  render() {
    return (
      <div>
        <input
          type="checkbox"
          name="filters"
          value={this.props.date}
          defaultChecked
        /> { this.props.date }
      </div>
    );
  }
}

DateSelector.propTypes = {
  date: PropTypes.string.isRequired,
};

