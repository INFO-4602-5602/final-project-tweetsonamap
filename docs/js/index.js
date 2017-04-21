'use strict';

console.log("HI")

window.mapboxgl = require('mapbox-gl');
var tilebelt = require('tilebelt');

// Map!
mapboxgl.accessToken = 'pk.eyJ1IjoiamVubmluZ3NhbmRlcnNvbiIsImEiOiIzMHZndnpvIn0.PS-j7fRK3HGU7IE8rbLT9A';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-96, 37.8],
    zoom: 3
});

map.on('load', function () {

  map.addSource('tweets',{
    "type": "geojson",
    "data": {
        "type": "FeatureCollection",
        "features": [{
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-100.03238901390978, 32.913188059745586]
            }
        }, {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [-115.414, 27.776]
            }
        }]
      }
  })

  map.addLayer({
    "id": "tweets-layer",
    "type": "circle",
    "source": 'tweets'
  });
});


//Put our other scripts here to require and they will get bundled?
