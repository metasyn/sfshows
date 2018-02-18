import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class DateSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isChecked: true,
    };
  }

  toggleDateCheckboxChange = () => {
    const { handleCheckboxChange, date } = this.props;

    this.setState(({ isChecked }) => (
      {
        isChecked: !isChecked,
      }
    ));

    handleCheckboxChange(date);
  }

  render() {
    const { date } = this.props;
    const { isChecked } = this.state;
    return (
      <div>
        <input
          type="checkbox"
          name="filters"
          value={date}
          checked={isChecked}
          onChange={this.toggleDateCheckboxChange}
        /> {date}
      </div>
    );
  }
}

DateSelector.propTypes = {
  date: PropTypes.string.isRequired,
  handleCheckboxChange: PropTypes.func.isRequired,
};

