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
    imageScroller.working = true;
    document.getElementById('loading-status').innerHTML = "Querying Map"
    document.getElementById('loading-bar').className = "loading m6"

    var holdUp = setInterval(function(){
      if(map.loaded()){
        clearInterval(holdUp)


        var visibleFeatures = []

        if (document.getElementById('render-markers').checked) markerHandler.renderMarkers(map)
        var markerFeats = markerHandler.getVisibleFeatures(map)
        var polyFeats   = polygonHandler.getVisibleFeatures(map)
        visibleFeatures = visibleFeatures.concat( markerFeats[1] )
        visibleFeatures = visibleFeatures.concat( polyFeats[1] )

        var totalFeats = markerFeats[0] + polyFeats[0]

        imageScroller.renderTweets(visibleFeatures, map)

        var imageHoldUp = setInterval(function(){
          if (!imageScroller.working){
            clearInterval(imageHoldUp)
            document.getElementById('loading-bar').className = "m6"
            document.getElementById('loading-status').innerHTML = `${visibleFeatures.length} Images`
          }else{
            document.getElementById('loading-status').innerHTML = `${visibleFeatures.length} Images...`
            //document.getElementById('loading-bar').className = "loading m6"
          }
        },100);

      }else{
        document.getElementById('loading-status').innerHTML = 'Loading Map...'
        document.getElementById('loading-bar').className = "loading m6"
      }
    },500)
  })
})
