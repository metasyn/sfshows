import $ from 'jquery';

import Venues from '../../data/venues.json';
import { getEditDistance } from './Util';

export default class Parser {
  constructor() {
    this.yql = Parser.makeYQL();
  }

  parseData() {
    return fetch(this.yql).then(r => r.json())
      .then((success) => {
        const results = Parser.parseHTMLtoDOM(success);
        const dates = Parser.getDates(results);
        const organized = Parser.sortByDate(results, dates);
        const geojson = Parser.geojsonify(organized);
        return { organized, geojson, dates };
      })
      .catch(e => Error((e)));
  }

  static parseHTMLtoDOM(YQLResponse) {
    const results = YQLResponse.query.results.result.join('\n');
    const p = new DOMParser();
    return $(p.parseFromString(results, 'text/html'));
  }

  static makeYQL() {
    const urls = "'http://www.foopee.com/punk/the-list/by-date.0.html', 'http://www.foopee.com/punk/the-list/by-date.1.html'";
    const xpath = '//body/ul/li';
    const query = `select * from htmlstring where url in (${urls}) and xpath='${xpath}'`;
    const YQL = `https://query.yahooapis.com/v1/public/yql?format=json&q=${encodeURIComponent(query)}&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys`;
    return YQL;
  }

  static getDates($results) {
    const dates = [];
    $results.find('body > li > a').each((i, x) => {
      dates.push({ id: i, date: $.trim(x.text), checked: true });
    });
    return dates;
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
        $($shows[si]).find('a').each((_, x) => {
          things.push($.trim(x.text));
        });

        const deets = $.trim($shows[si].innerText.split('\n').slice(-3, -2));

        organized[dates[i].date].push({
          venue: things.shift(),
          date: dates[i].date,
          details: deets,
          bands: things,
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
                console.log(`"${showData.venue}" has been replaced with "${venueList[v]}"`);
                showData.venue = venueList[v];
              }
            }
          } catch (e) {
            console.log('Missing Venue?', e);
          }
        }

        const showString = `${dateKeys[i]} - ${showData.venue} | ${showData.bands.join(' | ')} | ${showData.details}`;
        const bandsString = showData.bands.map(x => (`- ${x} <br/>`)).join('');
        const showHTML = `<h2> ${dateKeys[i]} </h2><br/><h3> ${bandsString}<br/> ${showData.details}</h3>`;

        const show = {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: Venues[showData.venue] || [-122.422960, 37.826524],
          },
          properties: {
            sid: `${i}-${j}`,
            date: dateKeys[i],
            venue: showData.venue,
            bands: showData.bands,
            details: showData.details.replace(/ ,/g, ''), // fucking commas
            showString,
            showHTML,
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
