import _ from 'lodash';
import {DateTime} from 'luxon';

// Compute the edit distance between the two given strings
export function getEditDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // increment along the first column of each row
  let i;
  for (i = 0; i <= b.length; i += 1) {
    matrix[i] = [i];
  }

  // increment each column in the first row
  let j;
  for (j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (i = 1; i <= b.length; i += 1) {
    for (j = 1; j <= a.length; j += 1) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1,
          ),
        ); // deletion
      }
    }
  }

  return matrix[b.length][a.length];
}


export function normalize(x) {
  if (Array.isArray(x)) {
    return x.map(y => y.trim().toLowerCase());
  }
  return x.trim().toLowerCase();
}

export function getUniqueFeatures(array, comparatorProperty) {
  const existingFeatureKeys = {};
  // Because features come from tiled vector data, feature geometries may be split
  // or duplicated across tile boundaries and, as a result, features may appear
  // multiple times in query results.
  const uniqueFeatures = array.filter((el) => {
    if (existingFeatureKeys[el.properties[comparatorProperty]]) {
      return false;
    }
    existingFeatureKeys[el.properties[comparatorProperty]] = true;
    return true;
  });

  return uniqueFeatures;
}

export function addPopup(map, venue, features, popup) {
  const venueHtml = `<h1>${venue}</h1><br/>`;
  const sortedFeatures = getUniqueFeatures(features, 'sid').sort((a, b) => {
    const key = a.properties.sid > b.properties.sid;
    return key ? -1 : 1;
  });

  const html = _.map(sortedFeatures, 'properties.showModalHTML').reverse().join('<hr><br/>');
  const point = features[0].geometry.coordinates;
  popup.setLngLat(point)
    .setHTML(venueHtml + html)
    .addTo(map);
}

export function getMinMaxDates(dates) {
  const minDate = dates[0];
  const maxDate = dates.slice(-1)[0];
  const minMonth = new Date(minDate).getMonth();
  const maxMonth = new Date(maxDate).getMonth();
  const minYear = new Date().getFullYear();
  // In the rare case that the max date is a different year
  const maxYear = (minMonth === 11 && maxMonth === 0) ? minYear + 1 : minYear;

  const minTime = new Date(`${minDate} ${minYear}`).getTime();
  const maxTime = new Date(`${maxDate} ${maxYear}`).getTime();
  return {
    minDate,
    minTime,
    maxDate,
    maxTime,
  };
}

export function getWeekDay(date) {
  // Create an array containing each day, starting with Sunday.
  const weekdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
  ];
  // Use the getDay() method to get the day.
  const day = date.getDay();
  // Return the element that corresponds to that index.
  return weekdays[day];
}

export function formatDate(dateString) {
  const date = DateTime.fromISO(dateString); // force pacific timezone
  date.setZone('America/Los_Angeles');
  return `${date.month}-${date.day} ${date.weekdayShort} `;
}