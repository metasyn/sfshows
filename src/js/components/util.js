export default class Util {
  static populateDates(dates) {
    const form = document.getElementById('date-selector');
    form.innerHTML = '<div>';
    for (let d = 0; d < dates.length; d += 1) {
      const radio = `<input type='checkbox' name='filters' onclick='showShows();' value=' ${dates[d]}' checked> ${dates[d]}`;
      form.innerHTML += radio;
    }
    form.innerHTML += '</div>';
    // TODO: handle filters
    // filters = document.getElementById('date-selector').filters;
  }
}
