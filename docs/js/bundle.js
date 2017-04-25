(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*

  Functions to handle adding images to maps and scaling appropriately

  Things to do here:
  > Scale appropriately based on zoom level

  Things not do here: call _map_

*/

module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim

  this.activeSources = []

  this.buildCoordinates = function(coords, zoom){
    /*
      Input: point coordinates & zoom level
      Return: Array of ul,ur,lr,ll coordinates to scale image for zoom level
    */
    var lon = coords[0]
    var lat = coords[1]

    //TODO: overhaul this logic, make it scale appropriately with the projection,
    //and more zoom levels?
    var zoomScales = {
      0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 0.1, 6: 0.5, 7: 0.06,
      8: 0.05, 9: 0.04, 10: 0.03, 11: 0.02, 12: 0.01,
      13: 0.008, 14: 0.003, 15: 0.001, 16: 0.0008, 17: 0.0003,  18: 0.0001,  19: 0.00003
    }
    var scale = zoomScales[zoom]

    //ul,ur,lr,ll
    return [
      [lon - scale, lat + scale],
      [lon + scale, lat + scale],
      [lon + scale, lat - scale],
      [lon - scale, lat - scale]
    ]
  }

  this.buildImageSrc = function(feature, zoom){
    return {
      "type": "image",
      "url":  this.img_dir + "/" + feature.properties.id + this.extension,
      "coordinates": this.buildCoordinates(feature.geometry.coordinates, zoom)
    }
  }
}

},{}],2:[function(require,module,exports){
var popup = new mapboxgl.Popup({

})
module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim

  this.activeMarkers = {}

  //https://www.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
  this.buildMarker = function(feature, zoom, map){

    //Scale logic could go here
    //h = this.img_height
    //w = this.img_width

    var that = this

    var markerDiv  = document.createElement('div')
        markerDiv.className = 'marker';
        markerDiv.style.backgroundImage = 'url(' + `${this.img_dir}/${feature.properties.id}${this.extension}` + ')';
        markerDiv.style.width  = this.img_width+'px';
        markerDiv.style.height = this.img_height+'px';

        markerDiv.addEventListener('mouseenter', function() {
            popup.setLngLat(feature.geometry.coordinates)
                 .setHTML(that.prettyPopUp(feature.properties))
                 .addTo(map)

        });

        markerDiv.addEventListener('mouseleave', function() {
          popup.remove();
        });

    var marker = new mapboxgl.Marker(markerDiv, {offset: [-50,-50]})
      .setLngLat(feature.geometry.coordinates)
      .addTo(map)

    this.activeMarkers[feature.properties.id] = marker

    return marker
  }

  this.resize = function(id){
    this.activeMarkers[id]._element.style.width = this.img_width+'px'
    this.activeMarkers[id]._element.style.height = this.img_width+'px'
  }

  this.prettyPopUp = function(properties){
    var htmlString = ''
    htmlString += JSON.stringify(properties)
    return htmlString
  }
}

},{}],3:[function(require,module,exports){
'use strict';

var util           = require('../lib/functions.js')
var ImageHandler   = require('./image_maps.js')
var MarkerHandler  = require('./image_markers.js')

//Deprecated, but leaving here for posterity
// var imageHandler = new ImageHandler({
//   img_height: 150,
//   img_width:  150,
//   img_dir:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/map_images',
//   geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis-insta1000.geojson',
//   load_lim:   100,
//   extension:  ".jpg"
// })

var markerHandler = new MarkerHandler({
  img_height: 150,
  img_width:  150,
  img_dir:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/map_images',
  geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis-insta10000.geojson',
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

/*
  Image rendering logic, careful, this gets called a lot :)
*/
var resize, newImages, zoom, prevZoom;
var prevFeatures = new Set();
function renderMarkers(uniqueFeatures){

  var features = map.queryRenderedFeatures({layers: ['tweets-layer']})
  if (!features.length) return //If no features exist here, return

  //Since we have vector tiles, need to only handle unique features
  var uniqueFeatures = util.getUniqueGeometries(features).slice(0,markerHandler.load_lim); //Only ever take the load limit

  //If markers go away, they need to be removed.
  var theseFeatures = new Set();

  uniqueFeatures.forEach(function(feature){

    zoom = Math.floor(map.getZoom()) //This should function at 0.5 levels too
    if(zoom!=prevZoom){
      resize = true;
      prevZoom = zoom;
    }

    if (markerHandler.activeMarkers.hasOwnProperty(feature.properties.id)){
      //marker exists... do something about it?
      theseFeatures.add(feature.properties.id)
      if (resize) {
        markerHandler.resize(feature.properties.id);
      }
      theseFeatures.add(feature.properties.id)
    }else{
      markerHandler.buildMarker(feature, zoom, map)

      //Save it here
      theseFeatures.add(feature.properties.id)
    }
  })
  if(prevFeatures.size > 0){ //If there is a previous set
    var difference = new Set([...prevFeatures].filter(x => !theseFeatures.has(x)));

    difference.forEach(function(id) {
      markerHandler.activeMarkers[id].remove()
      delete markerHandler.activeMarkers[id];
    });
  }
  prevFeatures = new Set(theseFeatures)
}

document.getElementById('image_size').addEventListener('change',function(e){
  markerHandler.img_width = e.target.value;
  markerHandler.img_height = e.target.value;
  resize = true;
  renderMarkers();
})

//Deprecated
/*var resize, newImages, zoom, prevZoom;
var prevFeatures = new Set();
function renderImages(uniqueFeatures){
  resize = false

  // Two types of events will fire this: zooming and panning.
  zoom = Math.floor(map.getZoom()) //This should function at 0.5 levels too

  if(zoom!=prevZoom){
    resize = true;
    prevZoom = zoom;
  }

  //Testing out the set action so that out of view features are dropped
  var theseFeatures = new Set();

  //Iterate over each feature, check if it exists yet.
  uniqueFeatures.forEach(function(feature){

    //If this source exists on the map, don't add it.
    if (map.getSource("img_" + feature.properties.id)){

      //The source exists, but it may be invisible, so turn it back on and call a resize
      if( map.getLayoutProperty("img_"+feature.properties.id+"_layer",'visibility')=='none'){
        map.setLayoutProperty("img_"+feature.properties.id+"_layer",'visibility','visible')
        resize=true
      }

      //Check if the image needs to be resized (we have changed zoom levels)
      if(resize){
        map.getSource("img_"+feature.properties.id).setCoordinates(
          imageHandler.buildCoordinates(feature.geometry.coordinates, zoom)
        );
      }
      theseFeatures.add(feature.properties.id)

    //The source does not exist, so we must add it.
    }else{

      //Wrap it in an error handler for safety
      try{
        map.addSource("img_"+feature.properties.id, imageHandler.buildImageSrc(feature, zoom))
        imageHandler.activeSources.push("img_"+feature.properties.id)
        //Once source is added, add the layer
        try{
          map.addLayer({
            id: "img_" + feature.properties.id + '_layer',
            source: "img_" + feature.properties.id,
            type: 'raster',
            paint: {"raster-opacity": 0.9}
          })
          theseFeatures.add(feature.properties.id)
        }catch(e){
          console.log("Error adding LAYER: ","img_" + feature.properties.id + '_layer')
        }
      }catch(e){
        console.log("Error adding SOURCE ","img_"+feature.properties.id)
      }
    }
  })

  //So which features are no longer visible?
  //This will add and remove items as needbe (perhaps we don't want to keep adding and removing sources, but just layers?)
  if(prevFeatures.size > 0){ //If there is a previous set
    var difference = new Set([...prevFeatures].filter(x => !theseFeatures.has(x)));

    difference.forEach(function(id) {
      map.setLayoutProperty("img_"+id+"_layer",'visibility','none')
      // map.removeSource("img_"+id)
    });
  }
  prevFeatures = new Set(theseFeatures)
}
*/

map.on('load', function () {

  map.addSource('tweets',{
    "type": "geojson",
    "data": markerHandler.geojson
  })

  map.addLayer({
    "id": "tweets-layer",
    "type": "circle",
    "source": 'tweets'
  });

  // The worker
  map.on('moveend',function(){
    renderMarkers()
  })

});

var initialRender = setInterval(function(){
  if(map.loaded()){
    renderMarkers()
    clearInterval(initialRender)
    console.log("Rendering")
  }else{
    console.log("Waiting on map...")
  }
},1000)

},{"../lib/functions.js":4,"./image_maps.js":1,"./image_markers.js":2}],4:[function(require,module,exports){
module.exports = {
  /* https://www.mapbox.com/mapbox-gl-js/example/filter-features-within-map-view/ */
  getUniqueFeatures: function(array, comparatorProperty) {
      var existingFeatureKeys = {};
      // Because features come from tiled vector data, feature geometries may be split
      // or duplicated across tile boundaries and, as a result, features may appear
      // multiple times in query results.
      var uniqueFeatures = array.filter(function(el) {
          if (existingFeatureKeys[el.properties[comparatorProperty]]) {
              return false;
          } else {
              existingFeatureKeys[el.properties[comparatorProperty]] = true;
              return true;
          }
      });

      return uniqueFeatures;
  },

  getUniqueGeometries: function(array) {
      var existingFeatureKeys = {};
      // Because features come from tiled vector data, feature geometries may be split
      // or duplicated across tile boundaries and, as a result, features may appear
      // multiple times in query results.
      var uniqueFeatures = array.filter(function(el) {
          if (existingFeatureKeys[el.geometry.coordinates.join(",")]) {
              return false;
          } else {
              existingFeatureKeys[el.geometry.coordinates.join(",")] = true;
              return true;
          }
      });

      return uniqueFeatures;
  }
}

},{}]},{},[3]);
