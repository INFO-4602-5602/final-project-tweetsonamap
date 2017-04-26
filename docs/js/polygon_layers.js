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
    Object.keys(uniqueTweets).slice(0,10).forEach(function(id){
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

    var that = this;
    var list = document.getElementById('images')
    Object.keys(that.extraImages).slice(0,10).forEach(function(id){
      var li = document.createElement('li')
        li.className = 'visible-image'
        li.innerHTML = `<p>Tweet:</p><p>${that.extraImages[id].id}</p>`
        li.style.backgroundImage = 'url(' + `${that.extraImages[id].thumb}` + ')';
        delete that.extraImages[id]
      list.appendChild(li)
    })


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
