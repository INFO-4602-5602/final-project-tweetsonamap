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
var util = require("../lib/functions.js")

var popup = new mapboxgl.Popup()

module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim
  this.on         = true;

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

  this.remove = function(map){
    if(this.on){
      this.on = false;
      var that = this;
      Object.keys(that.activeMarkers).forEach(function(id){
        that.activeMarkers[id].remove()
        delete that.activeMarkers[id];
      })
      map.removeLayer('marker-layer')
    }
  }

  this.addMarkerLayer = function(map){
    this.on = true
    map.addLayer({
      "id": "marker-layer",
      "type": "circle",
      "source": 'tweets'
    });
    var that = this;
    var initialRender = setInterval(function(){
      if(map.loaded()){
        that.renderMarkers(map)
        clearInterval(initialRender)
        console.log("Rendering")
      }else{
        console.log("Waiting on map...")
      }
    },1000)
  }

  var resize, newImages, prevZoom, zoom;
  var prevFeatures = new Set();

  this.renderMarkers = function(map){
    var features = map.queryRenderedFeatures({layers: ['marker-layer']})
    if (!features.length) return //If no features exist here, return

    //Since we have vector tiles, need to only handle unique features
    var uniqueFeatures = util.getUniqueGeometries(features).slice(0,this.load_lim); //Only ever take the load limit

    //If markers go away, they need to be removed.
    var theseFeatures = new Set();

    zoom = Math.floor(map.getZoom()) //This should function at 0.5 levels too
    if(zoom!=prevZoom){
      resize = true;
      prevZoom = zoom;
    }

    var that = this;

    uniqueFeatures.forEach(function(feature){
      if (that.activeMarkers.hasOwnProperty(feature.properties.id)){
        //marker exists... do something about it?
        theseFeatures.add(feature.properties.id)
        if (resize) {
          that.resize(feature.properties.id);
        }
        theseFeatures.add(feature.properties.id)
      }else{
        that.buildMarker(feature, zoom, map)

        //Save it here
        theseFeatures.add(feature.properties.id)
      }
    })
    if(prevFeatures.size > 0){ //If there is a previous set
      var difference = new Set([...prevFeatures].filter(x => !theseFeatures.has(x)));

      difference.forEach(function(id) {
        that.activeMarkers[id].remove()
        delete that.activeMarkers[id];
      });
    }
    prevFeatures = new Set(theseFeatures)
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

},{"../lib/functions.js":5}],3:[function(require,module,exports){
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

},{"../lib/functions.js":5,"./image_maps.js":1,"./image_markers.js":2,"./polygon_layers.js":4}],4:[function(require,module,exports){
var util = require("../lib/functions.js")

var popup = new mapboxgl.Popup({

})

module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim
  this.title      = 'polygon-tweets'

  this.on         = true;

  this.addSource = function(map){
    map.addSource(this.title,{
      type: "geojson",
      data: this.geojson
    })
  }

  var layers = ['xxl-polygons','xl-polygons', 'l-polygons','m-polygons','s-polygons']

  this.addPolygonLayers = function(map){
    this.on=true;
    //Add the 6 different layers for various zoom performance
    map.addLayer({
      'id': "xxl-polygons",
      'type': "fill",
      'source': 'polygon-tweets',
      'paint':{
        'fill-opacity':0.1,
        'fill-color': 'salmon'
      },
      'filter': ['>', 'area', 40000],
      'maxzoom': 4.5
    })
    map.addLayer({
      'id': "xl-polygons",
      'type': "fill",
      'source': 'polygon-tweets',
      'paint':{
        'fill-opacity':0.1,
        'fill-color': 'salmon'
      },
      'filter': ['all',
        ['>', 'area', 20000],
        ['<=','area', 40000]
      ],
      'maxzoom': 8.5
    })
    map.addLayer({
      'id': "l-polygons",
      'type': "fill",
      'source': 'polygon-tweets',
      'paint':{
        'fill-opacity':0.1,
        'fill-color': 'salmon'
      },
      'filter': ['all',
        ['>', 'area', 10000],
        ['<=','area',20000]
      ],
      'maxzoom': 8.5
    })
    map.addLayer({
      'id': "m-polygons",
      'type': "fill",
      'source': 'polygon-tweets',
      'paint':{
        'fill-opacity':0.3,
        'fill-color': 'salmon'
      },
      'filter': ['all',
        ['>', 'area', 1000],
        ['<=','area',10000]
      ],
      'maxzoom': 9.5,
      'minzoom': 4
    })
    map.addLayer({
      'id': "s-polygons",
      'type': "fill",
      'source': 'polygon-tweets',
      'paint':{
        'fill-opacity':0.5,
        'fill-color': 'salmon'
      },
      'filter': ['<=', 'area', 1000],
      'minzoom': 5
    })

    // map.addLayer({
    //       "id": "polygon-fills-hover",
    //       "type": "fill",
    //       "source": "polygon-tweets",
    //       "layout": {},
    //       "paint": {
    //           "fill-color": "#627BC1",
    //           "fill-opacity": 0.5
    //       },
    //       "filter": ["==", "displayName", ""]
    //   });


    var that = this;
    that.polyPopup = new mapboxgl.Popup({closeOnClick:false}).addTo(map);
    layers.forEach(function(layer){
      map.on('click',layer,function(e){
        that.polygonClick(e, map)
      })
    });
  }

  this.polygonClick = function(e, map){
    map.getCanvas().style.cursor = 'pointer';
    //map.setFilter('polygon-fills-hover', ["==", "displayName", e.features[0].properties.displayName])
    this.polyPopup.setLngLat(e.features[0].geometry.coordinates[0][1])
        .setHTML(`<h4>Name: ${e.features[0].properties.displayName}</h4>
          <h4>Area: ${e.features[0].properties.area}</h4>
          <h4>Tweets: ${e.features[0].properties.count}</h4>`)
        .addTo(map);
  }

  this.list_visible_features = function(map){
    var features = map.queryRenderedFeatures({layers:layers})
    if (!features.length) return

    var limit = 100;

    //Clear the current list of images
    var list = document.getElementById('images')
    list.innerHTML = "";

    //Creating a new list of unique Tweets
    var uniqueTweets = {}

    //Loop through the features, find unique ids, exit if necessary.
    featureLoop:
      for (var f_idx=0; f_idx < features.length; f_idx++){
        //Get the tweets array back from the original feature
        var tweets = JSON.parse(features[f_idx].properties.tweets)
        for(var i=0; i<tweets.length; i++){
          //Check if we've seeen this tweet?
          if(!uniqueTweets.hasOwnProperty(tweets[i].id)){
            uniqueTweets[tweets[i].id] = tweets[i]
            if (Object.keys(uniqueTweets).length >= limit){
              break featureLoop
            }
          }
        }
      }

    //Now loop through these features and build the tweets.
    Object.keys(uniqueTweets).slice(0,15).forEach(function(id){
      var li = document.createElement('li')
        li.className = 'visible-image'
        li.innerHTML = `<p>Tweet:</p><p>${uniqueTweets[id].id}</p>`
        li.style.backgroundImage = 'url(' + `${uniqueTweets[id].thumb}` + ')';
        delete uniqueTweets[id]
      list.appendChild(li)
    })

    this.extraImages = uniqueTweets

  }

  /*
    This function will be called when the 'next' arrow is pressed to load more images for a given area
  */
  this.loadNextScreen = function(){
    console.log("There are another " + Object.keys(this.extraImages).length + " tweets to load")
  }

  this.remove = function(map){
    this.on = false;
    var that = this
    layers.forEach(function(layer){
      map.removeLayer(layer)
    })
    // map.removeLayer("polygon-fills-hover")
  }


}

},{"../lib/functions.js":5}],5:[function(require,module,exports){
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
  },

}

},{}]},{},[3]);
