// globals

var data;
var map;
var resp;
var geojson;
var organized;
var myLayer;
var overlays;
var filters;
var selectedDatesList;
var geoResponse;

// the scrape

var urls = "'http://www.foopee.com/punk/the-list/by-date.0.html', 'http://www.foopee.com/punk/the-list/by-date.1.html'";
var xpath = "//body/ul/li";
var query = "select * from htmlstring where url in (" + urls + ") and xpath='" + xpath + "'";
var yql_url = "https://query.yahooapis.com/v1/public/yql?format=json&q=" + encodeURIComponent(query) + "&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";


////////////
// foopee /
//////////

function get(url) {

    // Return a new promise.
    return new Promise(function(resolve, reject) {

        var req = new XMLHttpRequest();
        req.open('GET', url);

        req.onload = function() {
            if (req.status == 200) {
                resp = JSON.parse(req.response);
                organized = sortByDate(resp);
                resolve(console.log('Request success.'));;
            } else {
                reject(console.log(Error(req.statusText)));
            }
        };

        // Handle network errors
        req.onerror = function() {
            reject(Error("Network Error"));
        };

        req.send();
    });
}


////////////
// MAPBOX /
//////////

// defaults
function ModifiedClusterGroup() {
    return new L.MarkerClusterGroup({
        spiderfyOnMaxZoom: true,
        maxClusterRadius: 1,
        spiderfyDistanceMultiplier: 3
            /* custom icons ?
            iconCreateFunction: function(cluster) {
              return L.mapbox.marker.icon({
                // show the number of markers in the cluster on the icon.
                'marker-symbol': cluster.getChildCount(),
                'marker-color': '#a0d6b4'
              });
            }
            */
    });
}


function setupMap() {
    // Return a new promise
    return new Promise(function(resolve, reject) {

        // easy to change online though if we suspect abuse
        L.mapbox.accessToken = 'pk.eyJ1IjoibWV0YXN5biIsImEiOiIwN2FmMDNhNTRhOWQ3NDExODI1MTllMDk1ODc3NTllZiJ9.Bye80QJ4r0RJsKj4Sre6KQ';

        // Init map
        map = L.mapbox.map('map', 'mapbox.dark', {
                maxZoom: 17
            })
            .setView([37.7600, -122.416], 13);

        // Locate me button
        L.control.locate().addTo(map);


        if (map) {
            resolve(console.log('Map is loaded.'));
        } else {
            reject(console.log(Error('Map not loaded!')));
        }
    });
}

// filters

function populateDates(organized) {
    // grab form
    var form = document.getElementById('date-selector');
    var dates = Object.keys(organized);

    // lazy
    form.innerHTML = '<div>'
    for (var d = 0; d < dates.length; d++) {
        var le_radio = "<input type='checkbox' name='filters' onclick='showShows();' value='" + dates[d] + "' checked> " + dates[d]
        form.innerHTML = form.innerHTML + le_radio
    }
    form.innerHTML += '</div>'
    filters = document.getElementById('date-selector').filters;
}



function showShows() {

    selectedDatesList = [];
    // first collect all of the checked boxes and create an array of strings
    for (var i = 0; i < filters.length; i++) {
        if (filters[i].checked) selectedDatesList.push(filters[i].value);
    }
    // then remove any previously-displayed marker groups
    overlays.clearLayers();
    // create a new marker group
    var clusterGroup = ModifiedClusterGroup().addTo(overlays);
    // and add any markers that fit the filtered criteria to that group.
    myLayer.eachLayer(function(layer) {
        if (selectedDatesList.indexOf(layer.feature.properties.date) !== -1) {
            clusterGroup.addLayer(layer);
        }
    });

    // update coordinates box
    onmove();

}




/////////////
// helpers /
///////////

function parseHTMLToDOM(j){
    var res = j['query']['results']['result'];
    var results = res.join('\n');

    // array of dates
    p = new DOMParser();
    results = p.parseFromString(results, 'text/html');
    $results = $(results);

    return $results;
}

function sortByDate(j) {

    $results = parseHTMLToDOM(j);
    console.log($results)

    // grab the dates to use as keys
    dates = $results.find('body > li > a').map(function() {
        return $.trim(this.text);
    }).get();

    organized = {};

    console.log(dates.length)

    for (var i = 0; i < dates.length; i++) {

        // empty date
        organized[dates[i]] = [];

        // Array is zero indexed but nth-child starts at 1
        var index = i + 1
        var $shows = $results.find('body > li:nth-child(' + index + ')').find('li');

        for (var si = 0; si < $shows.length; si++) {

            // god save us all, i'm so sorry
            var things= $($shows[si]).find('a').map(function() {
                return $.trim(this.text);
            }).get();

            // really, I am
            var venue = things.shift();
            var bands = things;
            var deets = $.trim($shows[si].innerText.split('\n').slice(-3, -2));
            
            organized[dates[i]].push({
                'venue': venue,
                'date': dates[i],
                'details': deets,
                'bands': bands,
            });
        }
    }

    // lol "organized"
    return organized;
}


// Compute the edit distance between the two given strings
function getEditDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    var matrix = [];

    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
};


function geojsonify(data) {
    // this function returns a geojson object

    var features = []
    var dateKeys = Object.keys(data)

    // loop through dates
    for (var i = 0; i < dateKeys.length; i++) {

        // loop through shows
        for (var j = 0; j < data[dateKeys[i]].length; j++) {


            var showData = data[dateKeys[i]][j];
            var venueList = Object.keys(lonlatDictionary);

            // check for misspellings
            if (!lonlatDictionary[showData['venue']]) {
                try {
                    for (var v = 0; v < venueList.length; v++) {
                        var misspelled = showData['venue'].replace(/\W/g, '')
                        var spelledCorrect = venueList[v].replace(/\W/g, '')
                        var editDistance = getEditDistance(misspelled, spelledCorrect);
                        if (editDistance <= 3) {
                            console.log('"' + showData['venue'] + '" has been replaced with "' + venueList[v] + '"');
                            showData['venue'] = venueList[v];
                        }
                    }
                } catch (e) {
                    console.log('Missing Venue?', e);
                }
            }

            var show = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": lonlatDictionary[showData['venue']] || [-122.422960, 37.826524]
                },
                "properties": {
                    "date": dateKeys[i],
                    "venue": showData['venue'],
                    "bands": showData['bands'],
                    "details": showData['details'].replace(/ ,/g, ''), // fucking commas
                    'marker-color': '#33CC33', //+Math.floor(Math.random()*16777215).toString(16), //random colors !
                    'marker-size': 'large',
                    'marker-symbol': 'music'
                }
            }

            // add show to features array
            features.push(show)

        }
    }

    // format for valid geojson
    var geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    return geojson
}



function plotShows(json) {

    return new Promise(function(resolve, reject) {


        // update function for coordinates infobox
        window.onmove = function onmove() {
            // Get the map bounds - the top-left and bottom-right locations.
            var inBounds = [],
                bounds = map.getBounds();
            clusterGroup.eachLayer(function(marker) {
                // For each marker, consider whether it is currently visible by comparing
                // with the current map bounds.
                if (bounds.contains(marker.getLatLng()) && selectedDatesList.indexOf(marker.feature.properties.date) !== -1) {
                    var feature = marker.feature;
                    var coordsTemplate = L.mapbox.template('{{properties.date}} - {{properties.venue}} |{{#properties.bands}} {{.}} |{{/properties.bands}}{{properties.details}}', feature)
                    inBounds.push(coordsTemplate);
                }
            });
            // Display a list of markers.
            inBounds.reverse()
            document.getElementById('coordinates').innerHTML = inBounds.join('\n');
        }


        // get that geojson
        geojson = geojsonify(organized);

        // attach data
        myLayer = L.mapbox.featureLayer(geojson)

        // make clustergroup
        var clusterGroup = ModifiedClusterGroup();
        // add features
        clusterGroup.addLayer(myLayer);
        overlays = L.layerGroup().addTo(map);
        // add cluster layer
        // overlays are multiple layers
        // add in showShows()
        showShows();

        // for each layer in feature layer
        myLayer.eachLayer(function(e) {

            var marker = e;
            var feature = e.feature;

            // Create custom popup content
            var popupContent = L.mapbox.template('<h1> {{properties.venue}} </h1><br><h3> {{properties.date}} </h3><br><h2> {{#properties.bands}} - {{.}} <br> {{/properties.bands}} </h2><br><h2> {{properties.details}} </h2><br>', feature)

            marker.bindPopup(popupContent, {
                closeButton: true,
                minWidth: 320
            });
        });




        map.on('move', onmove);
        // call onmove off the bat so that the list is populated.
        // otherwise, there will be no markers listed until the map is moved.
        window.onmove();


        if (geojson) {
            resolve(console.log('Shows plotted.'))
        } else {
            reject(console.log(Error('Shows cannot be plotted.')));
        }
    });
}


function toggleDate(desc) {
    for (var i = 0; i < filters.length; i++) {

        if (desc == 'today') {
            var day = Date().slice(0, 10) // this gives us the foopee time format
        } else if (desc == 'tomorrow') {
            var d = new Date();
            var day = new Date(((d.getTime() / 1000) + (60 * 60 * 24)) * 1000); // milliseconds not seconds
            day = day.toString().slice(0, 10);
        }

        // lol, so foopee puts its date with no zero padding:
        if (day) {
            var day_list = day.split(' ');
            day_list[2] = String(parseInt(day_list[2]));
            day = day_list.join(' ');
        }

        if (filters[i].value == day) {
            filters[i].checked = 1;
        } else {
            filters[i].checked = 0;
        }

        if (desc == 'all') {
            filters[i].checked = 1
        }
    }

    // update
    showShows();

}
////////////////
// vex modal //
///////////////

vex.defaultOptions.className = 'vex-theme-flat-attack';


function modalPop() {
    var modalMessage = $('#modal-template').html();
    $('#q').on("click hover", vex.dialog.alert(modalMessage))
}


///////////////////
// control logic /
/////////////////

get(yql_url).then(function(resolve) {
    try {
        setupMap();
    } catch (err) {
        vex.dialog.alert('OH SHIT SOMETHINGS BROKEN. The List could be down, rawgit could be mad, or my code could be broken.')
    }
    populateDates(organized);
    plotShows(resp);
    modalPop();
})



///////////////
// gmaps api /
/////////////

// Note: I don't think I want to use these because they were pretty inacurate when using the venue descriptions
// from foopee. But I'm going to leave them here in case they get used as a catchall once the locations are all
// added to the lonlat dictionary.


function fetchGeo(venue) {

    return new Promise(function(resolve, reject) {

        // api key
        var apiKey = "AIzaSyDCyj1LQMqFPcQhgfW92vR8BtXhlDIvF-4";
        // request
        var geocoder = "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(venue) + "&key=" + apiKey;

        //clear
        geoResponse = '';

        $.getJSON(geocoder, function(response) {

            if (response) {
                geoResponse = response;
                resolve(console.log('Looked up venue.'))
            } else {
                reject(console.log(Error('Venue lookup failure.')));
            }
        })
    })
}

function getLonLat(venue) {

    fetchGeo(venue).then(function(resolve) {
        geoResponse = [geoResponse.results[0].geometry.location.lng, geoResponse.results[0].geometry.location.lat]
    })
}
