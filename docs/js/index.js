'use strict';

var util               = require('../lib/functions.js')

var config         = require('../config.js')

var ds = util.qs(window.location.href.split("?")[1])['event']

var event = ds ? ds : 'matthew'

console.log(event)

var siteConfig     = config[event]

console.log("Site Configuration Loaded. Start date: "+siteConfig.start_date)


var GeoTaggedHandler   = require('./geotagged.js')
var GeoLocatedHandler  = require('./geolocated.js')

var ImageScroller      = require('./image_scroller.js')
var Timeline           = require('./timeline-d3v4.js')


//Initialize the timeline
var tweetTimeline = new Timeline({
  dataset : siteConfig.tweets_per_day,
  start_date : siteConfig.start_date
})

var geoTaggedHandler = new GeoTaggedHandler({
  img_height: 100,
  img_width:  100,
  geojson:    siteConfig.markers,
  img_url:    siteConfig.img_root,
  load_lim:   200,
  title:      'geotagged-point-images'
})

var geoLocatedHandler = new GeoLocatedHandler({
  geojson:    siteConfig.polyon_features_as_points,
  load_lim:   200
})

var imageScroller = new ImageScroller({
  load_lim: 80,
  img_root : siteConfig.img_root
})

// Map!
mapboxgl.accessToken = siteConfig.mapboxAccessToken;

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/light-v9',
  center: siteConfig.center || [-73.054, 18.429],
  zoom: siteConfig.zoom || 6.5,
  minZoom: 2,
  hash:true
});

//Launch the timeline
tweetTimeline.createTimeline(map, geoLocatedHandler)

var initialLoading = setInterval(function(){
  if(map.loaded()){
    clearInterval(initialLoading)
    document.getElementById('loading-status').innerHTML = 'Loaded'
    document.getElementById('loading-bar').className = "m6"

    //Fire it up...
    map.fire('moveend')
  }else{
    document.getElementById('loading-status').innerHTML = 'Loading Map'
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
        geoTaggedHandler.renderMarkers(map)
      }else{
        console.log(".")
      }
    },500)
  }else{
    console.log("Don't render markers")
    geoTaggedHandler.removeAllMarkers(map)
  }
});

document.getElementById('show-geotagged-tweets').addEventListener('change', function(e){
  if (e.target.checked){
    map.setLayoutProperty('marker-layer', 'visibility', 'visible')
  }else{
    map.setLayoutProperty('marker-layer', 'visibility', 'none')

    if (document.getElementById('render-markers').checked){
      document.getElementById('render-markers').checked = null;
      geoTaggedHandler.removeAllMarkers(map)
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
    geoLocatedHandler.show(map)
  }else{
    console.log("Turning polygons off")
    geoLocatedHandler.hide(map)
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
  geoTaggedHandler.addSource(map)
  geoLocatedHandler.addSource(map)

  //Add the markers
  geoTaggedHandler.addMarkerLayer(map)

  //Add the Poly Points
  geoLocatedHandler.addPolyPoints(map)


  // The worker to control the images. Checks all layers

  map.on('moveend',function(){
    imageScroller.working = true;
    document.getElementById('loading-status').innerHTML = "Querying Map"
    document.getElementById('loading-bar').className = "loading m6"

    var holdUp = setInterval(function(){
      if(map.loaded()){
        clearInterval(holdUp)

        var visibleFeatures = []

        if (document.getElementById('render-markers').checked) geoTaggedHandler.renderMarkers(map)

        var geoTagged = geoTaggedHandler.getVisibleFeatures(map)
        var geoLocated = geoLocatedHandler.getVisibleFeatures(map)

        visibleFeatures = visibleFeatures.concat( geoTagged[1] )
        visibleFeatures = visibleFeatures.concat( geoLocated[1] )

        var totalFeatures = geoTagged[0] + geoLocated[0]

        imageScroller.renderTweets(visibleFeatures, map, tweetPopUp)

        var imageHoldUp = setInterval(function(){
          if (!imageScroller.working){
            clearInterval(imageHoldUp)
            document.getElementById('loading-bar').className = "m6"
            document.getElementById('loading-status').innerHTML = `${totalFeatures} Images`
          }else{
            document.getElementById('loading-status').innerHTML = `${totalFeatures} Images...`
            //document.getElementById('loading-bar').className = "loading m6"
          }
        },100);

      }else{
        document.getElementById('loading-status').innerHTML = 'Loading Map...'
        document.getElementById('loading-bar').className = "loading m6"
      }
    },500)
  })

  map.on("mousemove", "marker-layer", function(e) {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on("mouseleave", "marker-layer", function(e) {
    map.getCanvas().style.cursor = '';
  });

  map.on("click", "marker-layer", function(e) {
    map.getCanvas().style.cursor = '';
    console.log(e.features[0])
    imageScroller.tweetClicked(e.features[0], map, null)
    console.log(e.features[0])
  });


  geoLocatedHandler.queryLayers.forEach(function(activeLayer){
    map.on("mousemove", activeLayer, function(e) {
      map.getCanvas().style.cursor = 'pointer';
    });

    map.on("mouseleave", activeLayer, function(e) {
      map.getCanvas().style.cursor = '';
    });

    map.on("click",activeLayer,function(e){
      var feat = e.features[0]

      console.log("area", feat.properties.area)
      var zoom = 10
      if(feat.properties.area > 40000){
        zoom = 5.5
      }else if (feat.properties.area > 20000){
        zoom = 8
      }else if (feat.properties.area > 10000){
        zoom = 7
      }else if (feat.properties.area > 1000){
        zoom = 9
      }
      console.log(zoom)
      map.flyTo({
        center: feat.geometry.coordinates,
        zoom: zoom
      })
    });
  });


})

var userFilter = false
window.toggleUserNameFilter = function(user){
  userFilter = !userFilter

  console.log(timeline.startDay, timeline.endDay)
  if (userFilter){
    map.setFilter('marker-layer',['all',[">=",'day',tweetTimeline.startDay],
                                        ["<",'day',tweetTimeline.endDay],
                                        ["==","user",user]])
    geoLocatedHandler.queryLayers.forEach(function(activeLayer){
      map.setFilter(activeLayer,['all',[">=",'day',tweetTimeline.startDay],
                                       ["<",'day',tweetTimeline.endDay],
                                       ["==","user",user]])
    })
  }else{
    map.setFilter('marker-layer',['all',[">=",'day',tweetTimeline.startDay],
                                        ["<",'day',tweetTimeline.endDay]])
    geoLocatedHandler.queryLayers.forEach(function(activeLayer){
      map.setFilter(activeLayer,['all',[">=",'day',tweetTimeline.startDay],
                                       ["<",'day',tweetTimeline.endDay]])
    });
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
}
