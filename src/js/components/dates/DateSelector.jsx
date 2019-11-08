import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { formatDate } from '../util';

export default class DateSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isChecked: this.props.isChecked,
    };
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { isChecked } = nextProps;
    this.setState({ isChecked });
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
        /> {formatDate(date)}
      </div>
    );
  }
}

DateSelector.propTypes = {
  date: PropTypes.string.isRequired,
  isChecked: PropTypes.bool.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
};

