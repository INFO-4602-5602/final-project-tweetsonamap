'use strict';

console.log("HI")

window.mapboxgl = require('mapbox-gl');
var tilebelt    = require('tilebelt');

var util = require('../lib/functions.js')

// Map!
mapboxgl.accessToken = 'pk.eyJ1IjoiamVubmluZ3NhbmRlcnNvbiIsImEiOiIzMHZndnpvIn0.PS-j7fRK3HGU7IE8rbLT9A';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-96, 37.8],
    zoom: 3,
    hash:true
});


map.on('load', function () {

  map.addSource('tweets',{
    "type": "geojson",
    "data": 'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis-tmp.geojson'
  })

  map.addLayer({
    "id": "tweets-layer",
    "type": "circle",
    "source": 'tweets'
  });

  map.on('moveend',function(e){

    var resize    = false;
    var newImages = false;

    // Two types of events will fire this: zooming and panning.
    var zoom = Math.floor(map.getZoom())

    if(zoom!=prev_zoom){
      resize = true;
      prev_zoom = zoom;
    }

    //Add a safety check here to only re-render if something major has changed (like a new feature or zoom level)

    var features = map.queryRenderedFeatures({layers: ['tweets-layer']})
    if (!features.length) return

    var uniqueFeatures = util.getUniqueFeatures(features, "id");

    uniqueFeatures.forEach(function(feature){

      if (map.getSource("tweet_" + feature.properties.id)){
        if(resize){
          map.getSource("tweet_"+feature.properties.id).setCoordinates(buildCoords(feature.geometry.coordinates,zoom))
        }
      }else{

        try{
          console.log("Source does not exist, building: ",feature.properties.id)

          buildImageSrc(feature, zoom)

        }catch(e){
          console.log("error adding layer",feature.properties.id)
        }
      }
    })
  })
});

var prev_zoom
map.once('load',function(){
  //Kick everything off and initialize
  var zoom = Math.floor(map.getZoom())
  prev_zoom = zoom

  var features = map.queryRenderedFeatures({layers: ['tweets-layer']})
  if (!features.length) return

  var uniqueFeatures = util.getUniqueFeatures(features, "id");
  prev_features = uniqueFeatures.map(function(x){return x.properties.id})

  uniqueFeatures.forEach(function(feature){
    try{
      buildImageSrc(feature, zoom)
    }catch(e){
      console.log(e)
      console.log("error adding layer",feature.properties.id)
    }
  })
})


//TODO
//This needs a MAJOR overhaul...
var zoomScales = {
  0: 1,
  1: 1,
  2: 1,
  3: 1,
  4: 1,
  5: 0.1,
  6: 0.07,
  7: 0.06,
  8: 0.05,
  9: 0.04,
  10: 0.03,
  11: 0.02,
  12: 0.01,
  13: 0.008,
  14: 0.003,
  15: 0.001,
  16: 0.0008
}


function buildCoords(coords, zoom){
  var lon = coords[0]
  var lat = coords[1]
  var scale = zoomScales[zoom]

  //ul,ur,lr,ll
  return [
    [lon - scale, lat + scale],
    [lon + scale, lat + scale],
    [lon + scale, lat - scale],
    [lon - scale, lat - scale]
  ]

}

function buildImageSrc(feature,zoom){

  map.addSource("tweet_" + feature.properties.id,{
    "type": "image",
     "url": "http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/thumbnails/t_120x120_"+feature.properties.id+".jpg",
     "coordinates": buildCoords(feature.geometry.coordinates, zoom)
  })

  map.addLayer({
    id: feature.properties.id + '_layer',
    source: "tweet_" + feature.properties.id,
    type: 'raster',
    paint: {"raster-opacity": 0.9}
  })
}

//Put our other scripts here to require and they will get bundled?
