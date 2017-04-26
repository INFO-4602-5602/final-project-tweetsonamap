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
  this.title      = 'polygon-centers'

  this.on         = true;


  this.addSource = function(map){
    map.addSource(this.title,{
      type: "geojson",
      data: this.geojson
    })
  }

  this.addCirclesLayer = function(map, featureLevels){

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
        'filter': level.filter
      })

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

    // var that = this;
    //
  }

  this.circleClick = function(e, map){
    map.getCanvas().style.cursor = 'pointer';
    this.circlePopup.setLngLat(e.features[0].geometry.coordinates)
        .setHTML(`<h4>Name: ${e.features[0].properties.displayName}</h4>
          <h4>Area: ${e.features[0].properties.area}</h4>
          <h4>Tweets: ${e.features[0].properties.count}</h4>`)
        .addTo(map);
  }
  //
  // this.list_visible_features = function(map){
  //   var features = map.queryRenderedFeatures({layers:layers})
  //   if (!features.length) return
  //
  //   var limit = 100;
  //
  //   //Clear the current list of images
  //   var list = document.getElementById('images')
  //   list.innerHTML = "";
  //
  //   //Creating a new list of unique Tweets
  //   var uniqueTweets = {}
  //
  //   //Loop through the features, find unique ids, exit if necessary.
  //   featureLoop:
  //     for (var f_idx=0; f_idx < features.length; f_idx++){
  //       //Get the tweets array back from the original feature
  //       var tweets = JSON.parse(features[f_idx].properties.tweets)
  //       for(var i=0; i<tweets.length; i++){
  //         //Check if we've seeen this tweet?
  //         if(!uniqueTweets.hasOwnProperty(tweets[i].id)){
  //           uniqueTweets[tweets[i].id] = tweets[i]
  //           if (Object.keys(uniqueTweets).length >= limit){
  //             break featureLoop
  //           }
  //         }
  //       }
  //     }
  //
  //   //Now loop through these features and build the tweets.
  //   Object.keys(uniqueTweets).slice(0,10).forEach(function(id){
  //     var li = document.createElement('li')
  //       li.className = 'visible-image'
  //       li.innerHTML = `<p>Tweet:</p><p>${uniqueTweets[id].id}</p>`
  //       li.style.backgroundImage = 'url(' + `${uniqueTweets[id].thumb}` + ')';
  //       delete uniqueTweets[id]
  //     list.appendChild(li)
  //   })
  //
  //   this.extraImages = uniqueTweets

  // }

  /*
    This function will be called when the 'next' arrow is pressed to load more images for a given area
  */

  this.remove = function(map){
    this.on = false;
    map.removeLayer('polygon-centers-layer')
  }
}
