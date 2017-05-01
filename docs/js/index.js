'use strict';

console.log("STARTING")

var siteConfig         = require('../config.js')

var util               = require('../lib/functions.js')

var GeoTaggedHandler   = require('./geotagged.js')
var GeoLocatedHandler  = require('./geolocated.js')

var ImageScroller      = require('./image_scroller.js')
var Timeline           = require('./timeline.js')


//Initialize the timeline
var tweetTimeline = new Timeline({
  dataset : siteConfig.tweets_per_day
})

var geotaggeHandler = new GeoTaggedHandler({
  img_height: 100,
  img_width:  100,
  geojson:    siteConfig.markers,
  img_url:    siteConfig.img_root,
  load_lim:   100,
  title:      'geotagged-point-images'
})

var geolocatedHandler = new GeoLocatedHandler({
  geojson:    siteConfig.polyon_features_as_points,
  load_lim:   100
})

var imageScroller = new ImageScroller({
  load_lim: 40,
  img_root : siteConfig.img_root
})

// Map!
mapboxgl.accessToken = siteConfig.mapboxAccessToken;

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-73.054, 18.429],
    zoom: 6.5,
    minZoom: 2,
    hash:true
});

tweetTimeline.createTimeline(map)

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
        geotaggeHandler.renderMarkers(map)
      }else{
        console.log(".")
      }
    },500)
  }else{
    console.log("Don't render markers")
    geotaggeHandler.removeAllMarkers(map)
  }
});

document.getElementById('show-geotagged-tweets').addEventListener('change', function(e){
  if (e.target.checked){
    map.setLayoutProperty('marker-layer', 'visibility', 'visible')
  }else{
    map.setLayoutProperty('marker-layer', 'visibility', 'none')

    if (document.getElementById('render-markers').checked){
      document.getElementById('render-markers').checked = null;
      geotaggeHandler.removeAllMarkers(map)
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

document.getElementById('show-geolocated-tweets').addEventListener('change', function(e){
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

var tweetPopUp = new mapboxgl.Popup({closeOnClick : 'true'})

document.getElementById('images').addEventListener('scroll', function(){
  imageScroller.loadMore(map, tweetPopUp)
});

map.once('load', function () {

  //Add sources
  geotaggeHandler.addSource(map)
  geolocatedHandler.addSource(map)

  //Add the markers
  geotaggeHandler.addMarkerLayer(map)

  //Add the Poly Points
  geolocatedHandler.addPolyPoints(map)


  // The worker to control the images. Checks all layers

  map.on('moveend',function(){
    imageScroller.working = true;
    document.getElementById('loading-status').innerHTML = "Querying Map"
    document.getElementById('loading-bar').className = "loading m6"

    var holdUp = setInterval(function(){
      if(map.loaded()){
        clearInterval(holdUp)

        var visibleFeatures = []

        if (document.getElementById('render-markers').checked) geotaggeHandler.renderMarkers(map)
        var markerFeats = geotaggeHandler.getVisibleFeatures(map)
        // var polyFeats   = polygonHandler.getVisibleFeatures(map)
        var polyFeats   = geolocatedHandler.getVisibleFeatures(map)
        visibleFeatures = visibleFeatures.concat( markerFeats )
        visibleFeatures = visibleFeatures.concat( polyFeats )

        imageScroller.renderTweets(visibleFeatures, map, tweetPopUp)

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
