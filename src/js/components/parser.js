import $ from 'jquery';

import Venues from '../../data/venues.json';
import { getEditDistance, formatDate } from './util';

export default class Parser {
  constructor() {
    this.list = 'https://metasyn.pw/s/shows.json';
  }

  parseData() {
    return fetch(this.list)
      .then(r => r.json())
      .then((data) => {
        const organized = Parser.sortByDateForReal(data);
        const dates = Parser.getDates(organized);
        const geojson = Parser.geojsonify(organized);
        console.log(geojson);
        return { organized, geojson, dates };
      })
      .catch(e => Error(e));
  }

  static getDates(organized) {
    const dates = [];
    // eslint-disable-next-line array-callback-return
    Object.keys(organized).map((x, i) => {
      dates.push({ id: i, date: $.trim(x), checked: true });
    });
    return dates;
  }

  static sortByDateForReal(data) {
    const organized = {};
    for (let i = 0; i < data.length; i += 1) {
      if (!organized[data[i].date]) {
        organized[data[i].date] = [];
      }
      organized[data[i].date].push(data[i]);
    }
    return organized;
  }

  static sortByDate($results, dates) {
    // grab the dates to use as keys
    const organized = {};

    for (let i = 0; i < dates.length; i += 1) {
      organized[dates[i].date] = [];

      // Array is zero indexed but nth-child starts at 1
      const index = i + 1;
      const $shows = $results.find(`body > li:nth-child(${index})`).find('li');

      for (let si = 0; si < $shows.length; si += 1) {
        const things = [];
        $($shows[si])
          .find('a')
          .each((_, x) => {
            things.push($.trim(x.text));
          });

        const deets = $.trim($shows[si].innerText.split('\n').slice(-3, -2));

        organized[dates[i].date].push({
          venue: things.shift(),
          date: dates[i].date,
          details: deets,
          artists: things,
        });
      }
    }

    return organized;
  }

  static geojsonify(data) {
    const features = [];
    const dateKeys = Object.keys(data);

    // loop through dates
    for (let i = 0; i < dateKeys.length; i += 1) {
      // loop through shows
      console.log(data[dateKeys[i]]);
      for (let j = 0; j < data[dateKeys[i]].length; j += 1) {
        const showData = data[dateKeys[i]][j];
        const venueList = Object.keys(Venues);

        // check for misspellings
        if (!Venues[showData.venue]) {
          try {
            for (let v = 0; v < venueList.length; v += 1) {
              const misspelled = showData.venue.replace(/\W/g, '');
              const spelledCorrect = venueList[v].replace(/\W/g, '');
              const editDistance = getEditDistance(misspelled, spelledCorrect);
              if (editDistance <= 3) {
                console.log(`'${showData.venue}' has been replaced with '${venueList[v]}'`);
                showData.venue = venueList[v];
              }
            }
          } catch (e) {
            console.log('Missing Venue?', e);
          }
        }

        const formattedDate = formatDate(dateKeys[i]);
        const artistsString = showData.artists
          .map(x => `- ${x} <br/>`)
          .join('');
        const showModalHTML = `<h2> ${formattedDate} </h2><br/><h3> ${artistsString}<br/> ${showData.details}</h3>`;

        const show = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: Venues[showData.venue] || [-122.42296, 37.826524], // alcatraz
          },
          properties: {
            sid: `${i}-${j}`,
            date: dateKeys[i],
            venue: showData.venue,
            artists: showData.artists,
            details: showData.details.replace(/ ,/g, ''), // fucking commas
            showModalHTML,
          },
        };

        // add show to features array
        features.push(show);
      }
    }

    // format for valid geojson
    const geojson = {
      type: 'FeatureCollection',
      features,
    };
    return geojson;
  }
}
