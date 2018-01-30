import $ from 'jquery';

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
        return { organized, dates };
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
      dates.push($.trim(x.text));
    });
    return dates;
  }

  static sortByDate($results, dates) {
    // grab the dates to use as keys
    const organized = {};

    for (let i = 0; i < dates.length; i += 1) {
      organized[dates[i]] = [];

      // Array is zero indexed but nth-child starts at 1
      const index = i + 1;
      const $shows = $results.find(`body > li:nth-child(${index})`).find('li');

      for (let si = 0; si < $shows.length; si += 1) {
        const things = [];
        $($shows[si]).find('a').each((_, x) => {
          things.push($.trim(x.text));
        });

        const deets = $.trim($shows[si].innerText.split('\n').slice(-3, -2));

        organized[dates[i]].push({
          venue: things.shift(),
          date: dates[i],
          details: deets,
          bands: things,
        });
      }
    }

    return organized;
  }
}
