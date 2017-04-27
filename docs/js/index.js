'use strict';

console.log("STARTING")

var util           = require('../lib/functions.js')
var ImageHandler   = require('./image_maps.js')
var MarkerHandler  = require('./image_markers.js')
var PolygonHandler = require('./polygon_layers.js')
var PolyCentersHandler = require('./polygon-centers_layer.js')
var ImageScroller  = require('./image_scroller.js')


var Timeline = require('./timeline.js')

var tweetTimeline = new Timeline()
tweetTimeline.createTimeline()


var markerHandler = new MarkerHandler({
  img_height: 100,
  img_width:  100,
  geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/geotagged-tweets.geojson',
  load_lim:   100,
  title:      'geotagged-point-images'
})

var polygonHandler = new PolygonHandler({
  img_height: 150,
  img_width:  150,
  geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/polygon-features.geojson',
  load_lim:   100,
  extension:  ".jpg"
})

var polyCentersHandler = new PolyCentersHandler({
  img_height: 150,
  img_width:  150,
  geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/polygon-centers-no-tweets.geojson',
  load_lim:   100
})

var imageScroller = new ImageScroller({
  load_lim: 30
})

// Map!
mapboxgl.accessToken = 'pk.eyJ1IjoiamVubmluZ3NhbmRlcnNvbiIsImEiOiIzMHZndnpvIn0.PS-j7fRK3HGU7IE8rbLT9A';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-96, 37.8],
    zoom: 3,
    minZoom: 2,
    hash:true
});

var initialLoading = setInterval(function(){
  if(map.loaded()){
    clearInterval(initialLoading)
    // document.getElementById('blocker').style="display:none;"
    console.log("Map loaded")

    //Fire it up...
    map.fire('moveend')
  }else{
    console.log("Waiting on map...")
  }
},1000)

map.addControl(new MapboxGeocoder({
  accessToken: mapboxgl.accessToken
}));

// document.getElementById('image_size').addEventListener('change',function(e){
//   markerHandler.img_width = e.target.value;
//   markerHandler.img_height = e.target.value;
//   resize = true;
//   renderMarkers();
// })

document.getElementById('toggle-markers').addEventListener('click', function(){
  // if(markerHandler.on){
  //   markerHandler.remove(map)
  // }else{
  //   markerHandler.addMarkerLayer(map)
  // }
})

document.getElementById('toggle-polygons').addEventListener('click', function(){
  // if(polygonHandler.on){
  //   polygonHandler.remove(map)
  // }else{
  //   polygonHandler.addPolygonLayers(map)
  // }
})

document.getElementById('images').addEventListener('scroll', function(){
  if(polygonHandler.on){
    imageScroller.loadMore()
  }
})

map.on('load', function () {

  //Add sources
  markerHandler.addSource(map)
  polygonHandler.addSource(map)
  polyCentersHandler.addSource(map)

  //Add the markers
  markerHandler.addMarkerLayer(map)
  //Add the Polygons
  polygonHandler.addPolygonLayers(map)

  //Add the centers
  // polyCentersHandler.addCirclesLayer(map)

  //Add the Markers
  // markerHandler.addMarkerLayer(map)

  // The worker to control the images.  Needs to check EVERY layer
  map.on('moveend',function(){
    console.log("Firing moveend")
    var visibleFeatures = []

    if(markerHandler.on){
      // markerHandler.renderMarkers(map)
      visibleFeatures = visibleFeatures.concat( markerHandler.getVisibleFeatures(map) )
    }
    if(polygonHandler.on){
      visibleFeatures = visibleFeatures.concat( polygonHandler.getVisibleFeatures(map) )
    }

    console.log("Calling image scroller with ", visibleFeatures.length)
    imageScroller.renderTweets(visibleFeatures, map)

  })
});
