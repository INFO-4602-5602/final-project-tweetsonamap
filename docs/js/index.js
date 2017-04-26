'use strict';

var util           = require('../lib/functions.js')
var ImageHandler   = require('./image_maps.js')
var MarkerHandler  = require('./image_markers.js')
var PolygonHandler = require('./polygon_layers.js')

var markerHandler = new MarkerHandler({
  img_height: 100,
  img_width:  100,
  img_dir:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/map_images',
  geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis-insta10000.geojson',
  load_lim:   100,
  extension:  ".jpg"
})

var polygonHandler = new PolygonHandler({
  img_height: 150,
  img_width:  150,
  img_dir:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/map_images',
  geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/poly-full.geojson',
  load_lim:   100,
  extension:  ".jpg"
})

// Map!
mapboxgl.accessToken = 'pk.eyJ1IjoiamVubmluZ3NhbmRlcnNvbiIsImEiOiIzMHZndnpvIn0.PS-j7fRK3HGU7IE8rbLT9A';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-96, 37.8],
    zoom: 3,
    hash:true
});

document.getElementById('image_size').addEventListener('change',function(e){
  markerHandler.img_width = e.target.value;
  markerHandler.img_height = e.target.value;
  resize = true;
  renderMarkers();
})

document.getElementById('toggle-markers').addEventListener('click', function(){
  if(markerHandler.on){
    markerHandler.remove(map)
  }else{
    markerHandler.addMarkerLayer(map)
  }
})

document.getElementById('toggle-polygons').addEventListener('click', function(){
  if(polygonHandler.on){
    polygonHandler.remove(map)
  }else{
    polygonHandler.addPolygonLayers(map)
  }
})

map.on('load', function () {

  map.addSource('tweets',{
    "type": "geojson",
    "data": markerHandler.geojson
  })

  polygonHandler.addSource(map)

  //Add the Polygons
  polygonHandler.addPolygonLayers(map)

  //Add the Markers
  //markerHandler.addMarkerLayer(map)
  markerHandler.on = false;

  // The worker
  map.on('moveend',function(){
    if(markerHandler.on) markerHandler.renderMarkers(map)
    if(polygonHandler.on) polygonHandler.list_visible_features(map)
  })

});
