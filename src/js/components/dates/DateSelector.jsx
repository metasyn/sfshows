import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class DateSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isChecked: true,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(e) {
    // Update dates in application for map to use
    this.props.handleCheckboxChange(e.target.value);
    // Handle local state
    this.setState(({ isChecked }) => (
      {
        isChecked: !isChecked,
      }
    ));
  }

  render() {
    const { date } = this.props;
    return (
      <div>
        <input
          type="checkbox"
          name="filters"
          value={date}
          checked={this.state.isChecked}
          onChange={this.handleChange}
        /> {date}
      </div>
    );
  }
}

DateSelector.propTypes = {
  date: PropTypes.string.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
};

