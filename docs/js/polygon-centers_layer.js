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
