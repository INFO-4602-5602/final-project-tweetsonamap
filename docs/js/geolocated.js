var util = require("../lib/functions.js")

var popup = new mapboxgl.Popup({})

var featureLevels = [
  {'name' : 'xxl-polygon', filter: ['>', 'area', 40000],
                                                   maxzoom: 5,
                                                   minzoom: 2  },
  {'name' : 'xl-polygon',  filter: ['all',
                                                  ['>', 'area', 20000],
                                                  ['<=','area', 40000]
                                                ], maxzoom: 9,
                                                   minzoom: 4  },
  {'name' : 'l-polygon',   filter: ['all',
                                                  ['>', 'area', 10000],
                                                  ['<=','area', 20000]
                                                ], maxzoom: 10,
                                                   minzoom: 4  },
  {'name' : 'm-polygon',   filter: ['all',
                                                  ['>', 'area', 1000],
                                                  ['<=','area',10000]
                                                ], maxzoom: 10,
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
          'circle-opacity':0.05,
          'circle-color': '#448ee4',
          'circle-radius' : {
            'property': 'area',
            'stops' : [
              [{zoom: 0, value:   0},4],
              [{zoom: 0, value: 9999999},100],

              [{zoom: 5, value:   0},25],
              [{zoom: 5, value: 9999999},200],

              [{zoom: 10, value:  0},100],
              [{zoom: 10, value: 9999999},300],

              [{zoom: 15, value:  0},500],
              [{zoom: 15, value: 9999999},1500]
            ]
          },
          'circle-blur': 0.2
        },
        'filter': level.filter,
        'maxzoom': level.maxzoom,
        'minzoom': level.minzoom
      })
    })
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
