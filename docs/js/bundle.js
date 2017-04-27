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
  this.img_url    = config.img_url
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim
  this.on         = false;
  this.title      = config.title

  this.activeMarkers = {}

  this.addSource = function(map){
    map.addSource(this.title,{
      type: "geojson",
      data: this.geojson
    })
  }

  this.addMarkerLayer = function(map){
    this.on = true
    var that = this;
    map.addLayer({
      "id": "marker-layer",
      "type": "circle",
      "source": that.title
    });
  }

  this.getVisibleFeatures = function(map){
    if (map.getLayer('marker-layer')){
      var features = map.queryRenderedFeatures({layers: ['marker-layer']})
      if (!features.length) return [] //If no features exist here, return empty array

      var uniqueFeatures = util.getUniqueGeometries(features).slice(0,this.load_lim); //Only ever take the load limit

      return uniqueFeatures
    }else{
      return []
    }
  }

  //https://www.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
  this.buildMarker = function(feature, zoom, map){
    var that = this

    var markerDiv  = document.createElement('div')
        markerDiv.className = 'marker';
        markerDiv.style.backgroundImage = 'url(' + `${this.img_url}/small/${feature.properties.id}.jpg` + ')';
        markerDiv.style.width  = this.img_width+'px';
        markerDiv.style.height = this.img_height+'px';

        // markerDiv.addEventListener('mouseenter', function() {
        //     popup.setLngLat(feature.geometry.coordinates)
        //          .setHTML(that.prettyPopUp(feature.properties))
        //          .addTo(map)
        //
        // });
        //
        // markerDiv.addEventListener('mouseleave', function() {
        //   popup.remove();
        // });

    var marker = new mapboxgl.Marker(markerDiv, {offset: [-50,-50]})
      .setLngLat(feature.geometry.coordinates)
      .addTo(map)

    this.activeMarkers[feature.properties.id] = marker

    return marker
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

  this.removeAllMarkers = function(map){
    var that = this
    Object.keys(this.activeMarkers).forEach(function(id) {
      that.activeMarkers[id].remove()
      delete that.activeMarkers[id];
    });
    prevFeatures = new Set()
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

},{"../lib/functions.js":7}],3:[function(require,module,exports){
var util = require("../lib/functions.js")

module.exports = function(config){

  this.initial_load_size =  config.load_lim
  this.on         = true;
  this.extraTweets = []
  this.working    = false;

  this.renderTweets = function(tweets, map){

    //Clear the current list of images
    var list = document.getElementById('images')
    list.innerHTML = "";
    var that = this;
    tweets.slice(0,this.initial_load_size).forEach(function(tweet){
      var li = document.createElement('li')
        li.className = 'visible-image'
        //li.innerHTML = `<p>Tweet:</p><p>${tweet.properties.id}</p>`
        li.style.backgroundImage = 'url(' + `${tweet.properties.thumb}` + ')';
        li.addEventListener('click',function(){
          that.tweetClicked(tweet, map)
        })
        list.appendChild(li)
    })

    this.extraTweets = tweets.slice(this.initial_load_size,tweets.length)
    this.working = false;
    document.getElementById('loading-bar').className = "m6"
  }

  /*
    This function will be called when the 'next' arrow is pressed to load more images for a given area
  */
  this.loadMore = function(){
    if(this.extraTweets.length){
      console.log("There are another " + this.extraTweets.length + " tweets to load")

      var list = document.getElementById('images')
      var that = this;
      this.extraTweets.slice(0,20).forEach(function(tweet){
        var li = document.createElement('li')
          li.className = 'visible-image'
          li.style.backgroundImage = 'url(' + `${tweet.properties.thumb}` + ')';
          li.addEventListener('click',function(){
            that.tweetClicked(tweet, map)
          })
        list.appendChild(li)
      })
      this.extraTweets = this.extraTweets.slice(20,this.extraTweets.length)
    }else{
      return
    }
  }

  this.tweetClicked = function(tweet, map){
    console.log(tweet.geometry, tweet.properties)
  }

}

},{"../lib/functions.js":7}],4:[function(require,module,exports){
'use strict';

console.log("STARTING")

var util           = require('../lib/functions.js')
var ImageHandler   = require('./image_maps.js')
var MarkerHandler  = require('./image_markers.js')
var PolygonHandler = require('./polygon_layers.js')
var PolyCentersHandler = require('./polygon-centers_layer.js')
var ImageScroller  = require('./image_scroller.js')

var markerHandler = new MarkerHandler({
  img_height: 100,
  img_width:  100,
  geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/geotagged-tweets.geojson',
  img_url:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/map_images',
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
    document.getElementById('loading-status').innerHTML = 'Loaded'
    document.getElementById('loading-bar').className = "m6"

    //Fire it up...
    map.fire('moveend')
  }else{
    document.getElementById('loading-status').innerHTML = 'Loading map'
    document.getElementById('loading-bar').className = "loading m6"
  }
},1000)

map.addControl(new MapboxGeocoder({
  accessToken: mapboxgl.accessToken
}));

document.getElementById('render-markers').addEventListener('change', function(e){
  if(e.target.checked){
    //Double check, if show-geo-tagged-tweets isn't checked, it better be :)
    if(!document.getElementById('show-geotagged-tweets').checked ){
      console.log("GeoTagged tweets needs to be on first.")
      document.getElementById('show-geotagged-tweets').checked = 'checked'
      map.setLayoutProperty('marker-layer', 'visibility', 'visible')
    }
    var holdUp = setInterval(function(){
      if(map.loaded()){
        clearInterval(holdUp)
        markerHandler.renderMarkers(map)
      }else{
        console.log(".")
      }
    },500)
  }else{
    console.log("Don't render markers")
    markerHandler.removeAllMarkers(map)
  }
});

document.getElementById('show-geotagged-tweets').addEventListener('change', function(e){
  if (e.target.checked){
    map.setLayoutProperty('marker-layer', 'visibility', 'visible')
  }else{
    map.setLayoutProperty('marker-layer', 'visibility', 'none')

    if (document.getElementById('render-markers').checked){
      document.getElementById('render-markers').checked = null;
      markerHandler.removeAllMarkers(map)
    }
  }
  var holdUp = setInterval(function(){
    if(map.loaded()){
      clearInterval(holdUp)
      map.fire('moveend')
    }else{
      console.log(".")
    }
  },500)
});

document.getElementById('show-polygon-tweets').addEventListener('change', function(e){
  if (e.target.checked){
    console.log("Polygons on")
    polygonHandler.show(map)
    polyCentersHandler.show(map)
  }else{
    console.log("Turning polygons off")
    polygonHandler.hide(map)
    polyCentersHandler.hide(map)
  }
  var holdUp = setInterval(function(){
    if(map.loaded()){
      clearInterval(holdUp)
      map.fire('moveend')
    }else{
      document.getElementById('loading-status').innerHTML = 'Loading Tweets...'
      document.getElementById('loading-bar').className = "loading m6"
    }
  },500)
});


document.getElementById('images').addEventListener('scroll', function(){
  imageScroller.loadMore()
});

map.once('load', function () {

  //Add sources
  markerHandler.addSource(map)
  polygonHandler.addSource(map)
  polyCentersHandler.addSource(map)

  //Add the markers
  markerHandler.addMarkerLayer(map)

  //Add the Polygons
  polygonHandler.addPolygonLayers(map)

  //Add the centers
  polyCentersHandler.addCirclesLayer(map)

  // The worker to control the images.  Needs to check EVERY layer
  map.on('moveend',function(){

    var holdUp = setInterval(function(){
      if(map.loaded()){
        clearInterval(holdUp)

        document.getElementById('loading-status').innerHTML = "Loading Images..."

        var visibleFeatures = []

        if (document.getElementById('render-markers').checked) markerHandler.renderMarkers(map)
        visibleFeatures = visibleFeatures.concat( markerHandler.getVisibleFeatures(map) )
        visibleFeatures = visibleFeatures.concat( polygonHandler.getVisibleFeatures(map) )

        imageScroller.working = true;
        imageScroller.renderTweets(visibleFeatures, map)

        var imageHoldUp = setInterval(function(){
          if (!imageScroller.working){
            clearInterval(imageHoldUp)
            document.getElementById('loading-bar').className = "m6"
            document.getElementById('loading-status').innerHTML = `${visibleFeatures.length} Images`
          }else{
            document.getElementById('loading-status').innerHTML = `${visibleFeatures.length} Images...`
            document.getElementById('loading-bar').className = "loading m6"
          }
        },100);

      }else{
        document.getElementById('loading-status').innerHTML = 'Loading Map...'
        document.getElementById('loading-bar').className = "loading m6"
      }
    },500)
  })
})

},{"../lib/functions.js":7,"./image_maps.js":1,"./image_markers.js":2,"./image_scroller.js":3,"./polygon-centers_layer.js":5,"./polygon_layers.js":6}],5:[function(require,module,exports){
var util = require("../lib/functions.js")

var popup = new mapboxgl.Popup({})

var featureLevels = [
  {'name' : 'xxl-polygon', filter: ['>', 'area', 40000],
                                                   maxzoom: 4.5,  minzoom: 2},
  {'name' : 'xl-polygon',  filter: ['all',
                                                  ['>', 'area', 20000],
                                                  ['<=','area', 40000]
                                                ], maxzoom: 8.5,  minzoom: 2},
  {'name' : 'l-polygon',   filter: ['all',
                                                  ['>', 'area', 10000],
                                                  ['<=','area', 20000]
                                                ], maxzoom: 8.5, minzoom: 2},
  {'name' : 'm-polygon',   filter: ['all',
                                                  ['>', 'area', 1000],
                                                  ['<=','area',10000]
                                                ], maxzoom: 9.5, minzoom: 2},
  {'name' : 's-polygon',   filter:  ['<=', 'area', 1000],
                                                  maxzoom: 22, minzoom: 2}]


module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim
  this.title      = 'polygon-centers'

  this.on         = false;

  this.activeLayers = []


  this.addSource = function(map){
    map.addSource(this.title,{
      type: "geojson",
      data: this.geojson
    })
  }

  this.addCirclesLayer = function(map){

    this.on=true;

    var that = this

    this.circlePopup = new mapboxgl.Popup({closeOnClick:false}).addTo(map)

    featureLevels.forEach(function(level){

      map.addLayer({
        'id': level.name + "-center-circle-layer",
        'type': "circle",
        'source': 'polygon-centers',
        'paint' : {
          'circle-color' : 'salmon',
          'circle-opacity' : {
            'property': 'count',
            'stops'   : [[0,0.1],[100,1]]
          },
          'circle-radius' : {
            'property': 'area',
            'stops' : [[0,4],[9999999,100]]
          }
        },
        'filter': level.filter,
        'minzoom' : level.minzoom,
        'maxzoom' : level.maxzoom
      })

      that.activeLayers.push(level.name + "-center-circle-layer")

      map.on('click',level.name + "-center-circle-layer",function(e){
        that.circleClick(e, map)
      });

      // map.addLayer({
      //   'id': level.name + "-center-symbol-layer",
      //   'type': "symbol",
      //   'source': 'polygon-centers',
      //   'layout':{
      //     'text-field': '{count}'
      //   },
      //   'filter': level.filter
      // })

      // map.addLayer({
      //   'id': level.name + "-name-layer",
      //   'type': "symbol",
      //   'source': 'polygon-centers',
      //   'layout':{
      //     'text-field': '{displayName} ({count})'
      //   },
      //   'filter': level.filter,
      //   'minzoom' : 5
      // })
    })
  }

  this.circleClick = function(e, map){
    map.getCanvas().style.cursor = 'pointer';
    this.circlePopup.setLngLat(e.features[0].geometry.coordinates)
        .setHTML(`<h4>Name: ${e.features[0].properties.displayName}</h4>
          <h4>Area: ${e.features[0].properties.area}</h4>
          <h4>Tweets: ${e.features[0].properties.count}</h4>`)
        .addTo(map);
  }

  this.hide = function(map){
    console.log("Turning it off?")
    this.activeLayers.forEach(function(activeLayer){
      map.setLayoutProperty(activeLayer,'visibility','none')
    })
    this.on = false;
  }

  this.show = function(map){
    this.activeLayers.forEach(function(activeLayer){
      map.setLayoutProperty(activeLayer,'visibility','visible')
    })
    this.on = true;
  }
}

},{"../lib/functions.js":7}],6:[function(require,module,exports){
var util = require("../lib/functions.js")

var popup = new mapboxgl.Popup({})

var featureLevels = [
  {'name' : 'xxl-polygon', filter: ['>', 'area', 40000],
                                                   maxzoom: 4.5,
                                                   minzoom: 2  },
  {'name' : 'xl-polygon',  filter: ['all',
                                                  ['>', 'area', 20000],
                                                  ['<=','area', 40000]
                                                ], maxzoom: 8.5,
                                                   minzoom: 4  },
  {'name' : 'l-polygon',   filter: ['all',
                                                  ['>', 'area', 10000],
                                                  ['<=','area', 20000]
                                                ], maxzoom: 8.5,
                                                   minzoom: 4  },
  {'name' : 'm-polygon',   filter: ['all',
                                                  ['>', 'area', 1000],
                                                  ['<=','area',10000]
                                                ], maxzoom: 9.5,
                                                   minzoom: 5  },

  {'name' : 's-polygon',   filter:  ['<=', 'area', 1000],
                                                   maxzoom: 22,
                                                   minzoom: 6  }]

module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim
  this.title      = 'polygon-tweets'
  this.queryLayers = []

  this.on         = true;

  this.addSource = function(map){
    map.addSource(this.title,{
      type: "geojson",
      data: this.geojson
    })
  }

  this.addPolygonLayers = function(map){
    this.on=true;
    var that = this;

    featureLevels.forEach(function(level){

      //these are the queryable layers
      that.queryLayers.push(level.name + "-fill-layer")

      map.addLayer({
        'id': level.name + "-fill-layer",
        'type': "fill",
        'source': 'polygon-tweets',
        'paint':{
          'fill-opacity':0,
          'fill-color': 'salmon'
        },
        'filter': level.filter,
        'maxzoom': level.maxzoom,
        'minzoom': level.minzoom
      })
    })

    var that = this;
    that.polyPopup = new mapboxgl.Popup({closeOnClick:false}).addTo(map);
    featureLevels.forEach(function(layer){
      map.on('click',layer.name+"-fill-layer",function(e){
        that.polygonClick(e, map)
      })
    });
  }

  this.getVisibleFeatures = function(map){
    var features = map.queryRenderedFeatures( {layers:this.queryLayers} )
    if (!features.length) return []

    var uniqueTweetIDs = []
    var uniqueTweets = []

    //Loop through the features, find unique ids, exit if necessary.
    for (var f_idx=0; f_idx < features.length; f_idx++){
      //Get the tweets array back from the original feature
      var tweets = JSON.parse(features[f_idx].properties.tweets)
      for(var i=0; i<tweets.length; i++){
        //Check if we've seeen this tweet?
        if(uniqueTweetIDs.indexOf(tweets[i].id) < 0){
          uniqueTweetIDs.push(tweets[i].id)
          uniqueTweets.push({
            'geometry' : features[f_idx].geometry,
            'properties' : tweets[i]})
        }
        if (uniqueTweetIDs.length >= this.load_lim){
          return uniqueTweets
        }
      }
    }
    return uniqueTweets
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

  this.hide = function(map){
    console.log("Turning it off?")
    this.queryLayers.forEach(function(activeLayer){
      map.setLayoutProperty(activeLayer,'visibility','none')
    })
    this.on = false;
  }

  this.show = function(map){
    this.queryLayers.forEach(function(activeLayer){
      map.setLayoutProperty(activeLayer,'visibility','visible')
    })
    this.on = true;
  }
}

},{"../lib/functions.js":7}],7:[function(require,module,exports){
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

},{}]},{},[4]);
