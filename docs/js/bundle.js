(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  "matthew" : {
    "center"  : [-73.054, 18.429],
    "zoom"    : 6.5,
    "img_root" : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/matthew/map_images",
    "start_date" : "2016-9-25",
    "mapboxAccessToken" : "pk.eyJ1IjoiamVubmluZ3NhbmRlcnNvbiIsImEiOiIzMHZndnpvIn0.PS-j7fRK3HGU7IE8rbLT9A",
    "markers" : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/matthew/geotagged-tweets.geojson",
    "polygon_features": "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/matthew/polygon-features.geojson",
    "polygon_centers" : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/matthew/polygon-centers-no-tweets.geojson",
    "polyon_features_as_points" : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/matthew/polygon-tweets-individual-points.geojson",
    "tweets_per_day"  : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/matthew/matthew_tweets_per_day.csv"
 },
 "hajj"  : {
    "center" : [44.79, 24.50],
    "zoom" : 3.8,
    "img_root" : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/hajj/map_images",
    "start_date" : "2016-09-07",
    "mapboxAccessToken" : "pk.eyJ1IjoiamVubmluZ3NhbmRlcnNvbiIsImEiOiIzMHZndnpvIn0.PS-j7fRK3HGU7IE8rbLT9A",
    "markers" : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/hajj/geotagged-tweets.geojson",
    "polygon_features": "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/hajj/polygon-features.geojson",
    "polygon_centers" : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/hajj/polygon-centers-no-tweets.geojson",
    "polyon_features_as_points" : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/hajj/polygon-tweets-individual-points.geojson",
    "tweets_per_day"  : "http://epic-analytics.cs.colorado.edu:9000/tweetsonamap/hajj/tweets_per_day.csv"
  }
}

},{}],2:[function(require,module,exports){
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

  this.geojson    = config.geojson
  this.load_lim   = config.load_lim
  this.title      = 'geolocated-tweets'
  this.queryLayers = []

  this.on         = true;

  this.addSource = function(map){
    map.addSource(this.title,{
      type: "geojson",
      data: this.geojson
    })
  }

  this.addPolyPoints = function(map){
    this.on=true;
    var that = this;

    featureLevels.forEach(function(level){

      //these are the queryable layers
      that.queryLayers.push(level.name + "-circle-layer")

      map.addLayer({
        'id': level.name + "-circle-layer",
        'type': "circle",
        'source': that.title,
        'paint':{
          'circle-opacity':0.15,
          'circle-color': 'green',
          'circle-radius' : {
            'property': 'area',
            'stops' : [[0,4],[9999999,100]]
          }
        },
        'filter': level.filter,
        'maxzoom': level.maxzoom,
        'minzoom': level.minzoom
      })
    })

    var that = this;
    that.polyPopup = new mapboxgl.Popup({closeOnClick:false}).addTo(map);
    featureLevels.forEach(function(layer){
      map.on('click',layer.name+"-circle-layer",function(e){
        that.polygonClick(e, map)
      })
    });
  }

  this.getVisibleFeatures = function(map){
    var features = map.queryRenderedFeatures( {layers:this.queryLayers} )
    if (!features.length) return [0,[]]

    var uniqueTweetIDs = []
    var uniqueTweets = []

    var uniqueFeatures = util.getUniqueFeatures(features.slice(0,this.load_lim+25), 'id')

    return [uniqueFeatures.length, uniqueFeatures.slice(0,this.load_lim)]
  }

  this.hide = function(map){
    console.log("Turning off geolocated features")
    this.queryLayers.forEach(function(activeLayer){
      map.setLayoutProperty(activeLayer,'visibility','none')
    })
    this.on = false;
  }

  this.show = function(map){
    console.log("Turnign on geolocated features")
    this.queryLayers.forEach(function(activeLayer){
      map.setLayoutProperty(activeLayer,'visibility','visible')
    })
    this.on = true;
  }
}

},{"../lib/functions.js":7}],3:[function(require,module,exports){
var util = require("../lib/functions.js")

var popup = new mapboxgl.Popup()

module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_url
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
      "source": that.title,
      "paint":{
        'circle-color':'green',
        'circle-radius':6
      }
    });
  }

  this.getVisibleFeatures = function(map){
    if (map.getLayer('marker-layer')){
      var features = map.queryRenderedFeatures({layers: ['marker-layer']})
      if (!features.length) return [0,[]] //If no features exist here, return empty array

      var uniqueFeatures = util.getUniqueGeometries(features); //Only ever take the load limit

      return [uniqueFeatures.length, uniqueFeatures.slice(0,this.load_lim)]
    }else{
      return [0,[]]
    }
  }

  //https://www.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
  this.buildMarker = function(feature, zoom, map){
    var that = this

    var markerDiv  = document.createElement('div')
        markerDiv.className = 'marker';
        markerDiv.style.backgroundImage = 'url(' + `${this.img_dir}/`+'small/'+`${feature.properties.id}` + '.jpg)';
        markerDiv.style.width  = this.img_width+'px';
        markerDiv.style.height = this.img_height+'px';

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

},{"../lib/functions.js":7}],4:[function(require,module,exports){
var util = require("../lib/functions.js")

module.exports = function(config){

  this.initial_load_size =  config.load_lim
  this.on         = true;
  this.extraTweets = []
  this.working    = false;

  this.img_root   = config.img_root

  //This is the powerhouse function: It takes a list of map features and adds them to the image list.
  this.renderTweets = function(tweets, map, popup){

    console.log("Rendering Tweets: ",tweets.length)

    //Clear the current list of images
    var list = document.getElementById('images')
    list.innerHTML = "";
    var that = this;
    tweets.slice(0,this.initial_load_size).forEach(function(tweet){
      var li = document.createElement('li')
        li.className = 'visible-image'

        li.style.backgroundImage = 'url(' + `${that.img_root}/small/${tweet.properties.id}.jpg` + ')';
        li.addEventListener('click',function(){
          that.tweetClicked(tweet, map, popup)
        })
        li.addEventListener('mouseenter',function(){
          that.tweetMouseEnter(tweet, map, popup)
        })
        li.addEventListener('mouseleave',function(){
          that.tweetMouseExit(tweet, map, popup)
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
  this.loadMore = function(map, popup){
    if(this.extraTweets.length){
      console.log("There are another " + this.extraTweets.length + " tweets to load")

      var list = document.getElementById('images')
      var that = this;
      this.extraTweets.slice(0,50).forEach(function(tweet){
        var li = document.createElement('li')
          li.className = 'visible-image'
          li.style.backgroundImage = 'url(' + `${that.img_root}/small/${tweet.properties.id}.jpg` + ')';
          li.addEventListener('click',function(){
            that.tweetClicked(tweet, map, popup)
          })
          li.addEventListener('mouseenter',function(){
            that.tweetMouseEnter(tweet, map, popup)
          })
          li.addEventListener('mouseleave',function(){
            that.tweetMouseExit(tweet, map, popup)
          })
        list.appendChild(li)
      })
      this.extraTweets = this.extraTweets.slice(20,this.extraTweets.length)
    }else{
      return
    }
  }

  this.tweetMouseEnter = function(tweet, map, popup){
    //If the layer is already active, just update the data
    var r = 10;
    if (tweet.properties.hasOwnProperty('area')){
      r = Math.log(tweet.properties.area) * (map.getZoom())
    }
    if (map.getLayer('tweet-highlight-circle')){
      map.getSource('tweet-highlight-circle-coords').setData(tweet.geometry)
      map.setPaintProperty('tweet-highlight-circle','circle-radius',r)
      map.setLayoutProperty('tweet-highlight-circle','visibility','visible')
    }else{
      //Layer does not exist, add the source and the layer
      map.addSource('tweet-highlight-circle-coords',{
        "type" : 'geojson',
        "data" : tweet.geometry
      })
      map.addLayer({
        id:   "tweet-highlight-circle",
        type: "circle",
        source: 'tweet-highlight-circle-coords',
        "paint":{
          "circle-color":'salmon',
          "circle-radius" : r,
          "circle-opacity": 0.8
        }
      })
    }

  }


  this.tweetMouseExit = function(tweet, map, popup){
    if (map.getLayer('tweet-highlight-circle')){
      map.setLayoutProperty('tweet-highlight-circle','visibility','none')
    }
  }

  this.tweetClicked = function(tweet, map, popup){

    var imagePopUp = document.getElementById('image-popup')
      imagePopUp.style.display = 'block'
      imagePopUp.innerHTML =`<div class='image-popup'>
        <div id='image-container'>
          <a class="link" target="_blank" href="http://twitter.com/statuses/${tweet.properties.id}">
            <img id="selected-image" src="${this.img_root}/large/${tweet.properties.id}.jpg" />
          </a>
        </div>
        <p class="prose txt-s align-l">${tweet.properties.text}</p>
        <p class="prose txt-s align-l"><strong>User: </strong><span class="link"  id="toggleUserNameFilter" onClick="window.toggleUserNameFilter('${tweet.properties.user}')">${tweet.properties.user}</span></p>
   </div>`

    console.log(tweet.geometry, tweet.properties)
  }
}

},{"../lib/functions.js":7}],5:[function(require,module,exports){
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

},{"../config.js":1,"../lib/functions.js":7,"./geolocated.js":2,"./geotagged.js":3,"./image_scroller.js":4,"./timeline-d3v4.js":6}],6:[function(require,module,exports){
/*  js for services */

module.exports = function(config){

  this.startDay = 0
  this.endDay   = 20

    this.createTimeline = function(map,geoLocatedHandler){
        // Clear all svg


    	// Get dimensions of containing box
        var parent_height = d3.select('#timeline-parent').node().getBoundingClientRect().height
        var parent_width  = d3.select('#timeline-parent').node().getBoundingClientRect().width


        var margin = {top: 10, right: 10, bottom: 40, left: 60}; // Margin around visualization, including space for labels
        var width  = parent_width - margin.left - margin.right; // Width of our visualization
        var height = parent_height - margin.top - margin.bottom; // Height of our visualization
        // var transDur = 100; // Transition time in ms



        var parseDate  = d3.timeParse("%Y-%m-%d");
        var parseDate2 = d3.timeParse("%Y-%-m-%d");
        var formatDate = d3.timeFormat("%a %b %d, %Y");
        var formatSimpleDate = d3.timeFormat("%b %-d")

        this.dataset = config.dataset;
        this.start_date = parseDate2(config.start_date); // Sun Sep 25 2016 00:00:00 GMT-0600 (MDT)
        var that = this;

        d3.csv(this.dataset, function(csvData){

            // Parse data
            var data = csvData;

            data.forEach(function(d,idx){
                d.date = parseDate(d["postedDate2"]);
                d.count = +d["count"];
                d.idx = idx;
            });

            var brushDateStart = new Date(data[0].date) // Sep 25
            var brushDateEnd   = d3.timeDay.offset(new Date(data[data.length-1].date),1) // Oct 22

            console.log(formatSimpleDate(brushDateStart),"-", formatSimpleDate(brushDateEnd))

            // Define scales
            var xScale = d3.scaleTime()
                            .rangeRound([0, width])
                            .domain([new Date(data[0].date),
                                d3.timeDay.offset(new Date(data[data.length-1].date),1)])

            var yScale = d3.scaleLinear()
                            .range([height, 0])
                            .domain([0, d3.max(data, function(d) { return parseFloat(d.count); })+1]);

            // Create an SVG element to contain our visualization.
            var svg = d3.select("#timeline").append("svg")
                                            .attr("width", width+margin.left+margin.right)
                                            .attr("height", height+margin.top+margin.bottom)
                                            .attr("id","timelinesvg")
                                          .append("g")
                                            .attr("transform","translate(" + margin.left + "," + margin.right + ")");

            // Build axes!
            // Specify the axis scale and general position
            var xAxis = d3.axisBottom(xScale).tickSize(2)

            var xAxisG = svg.append('g')
                            .attr('class', 'axis')
                            .attr('id','xaxis')
                            .attr("transform", "translate(0," + height + ")")
                            .call(xAxis)
                          .selectAll("text")
                            .attr("dy", ".35em")
                            .attr("dx", "-.5em")
                            .attr("transform", "translate(10,0) rotate(-45)")
                            .style("text-anchor", "end");

            // // Update width of chart to accommodate long rotated x-axis labels
            // d3.select("#timelinesvg")
            //         .attr("width", d3.select('#timeline').node().getBoundingClientRect().width)

            d3.select("#timelinesvg")
                    .attr("height", d3.select('#timeline').node().getBoundingClientRect().height)

            // Repeat for the y-axis
            var yAxis = d3.axisLeft(yScale).tickSize(5).ticks(5);

            var yAxisG = svg.append('g')
                            .attr('class', 'axis')
                            // .attr('transform', 'translate(' + xOffset + ', 0)')
                            .call(yAxis);

            var yLabel = svg.append("text")
                            .attr('class', 'label')
                            .attr("transform", "rotate(-90)")
                            .attr('y',6)
                            .attr('dy','.4em')
                            .style("text-anchor", "end")
                            .text("# Tweets");

            // Build bar chart
            var bar = svg.selectAll('.rect') // Select elements
                        .data(data); // Bind data to elements

            bar.enter().append("rect")
                .attr("class", "rect")
                .attr("x", function(d) { return xScale(new Date(d.date)); })
                .attr("y", function(d) { return yScale(d.count); })
                .attr("id", function(d) { return "bar-"+d.date; })
                .attr("height", function(d) { return height-yScale(d.count); })
                .attr("width",width/(data.length-1)*.9)
                .style("fill", "lightsteelblue");

            // Brush code from https://bl.ocks.org/mbostock/6232537
            svg.append("g")
                .attr("class", "brush")
                .call(d3.brushX()
                    .extent([[0, 0], [width, height]])
                    .on("end", brushended));

            function brushended() {
                if (!d3.event.sourceEvent) return; // Only transition after input.
                if (!d3.event.selection) return; // Ignore empty selections.
                var date0 = d3.event.selection.map(xScale.invert),
                    date1 = date0.map(d3.timeDay.round);

                // If empty when rounded, use floor & ceil instead.
                if (date1[0] >= date1[1]) {
                    date1[0] = d3.timeDay.floor(date0[0]);
                    date1[1] = d3.timeDay.offset(date1[0]);
                }
                d3.select(this).transition().duration(300).call(d3.event.target.move, date1.map(xScale));

                that.startDay = d3.timeDay.count(that.start_date,date1[0])
                that.endDay   = d3.timeDay.count(that.start_date,date1[1])

                //Set filters for the map
                map.setFilter('marker-layer',['all',[">=",'day',that.startDay],["<",'day',that.endDay]])
                geoLocatedHandler.queryLayers.forEach(function(activeLayer){
                  map.setFilter(activeLayer,['all',[">=",'day',that.startDay],["<",'day',that.endDay]])
                })
                map.fire('moveend')
            }
        }); //end d3.csv


    } //end createTimeline

    var that = this;

    var rtime;
    var timeout = false;
    var delta = 200;
    window.onresize = function(event) {
       rtime = new Date();
       if (timeout === false) {
           timeout = true;
           setTimeout(resizeend, delta);
       }
    };

    function resizeend() {
       if (new Date() - rtime < delta) {
           setTimeout(resizeend, delta);
       } else {
           timeout = false;
           console.log('Done resizing');
           d3.select("#timelinesvg").remove();
           that.createTimeline();
       }
    }

} //end module.exports

},{}],7:[function(require,module,exports){
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
  //http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript?page=2&tab=active#tab-top
  qs : function(a){
   if(!a)return {};
   a=a.split('#')[0].split('&');
   var b=a.length,c={},d,k,v;
   while(b--){
    d=a[b].split('=');
    k=d[0].replace('[]',''),v=decodeURIComponent(d[1]||'');
    c[k]?typeof c[k]==='string'?(c[k]=[v,c[k]]):(c[k].unshift(v)):c[k]=v;
   }
   return c
  }
}

},{}]},{},[5]);
