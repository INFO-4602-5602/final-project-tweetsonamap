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
        'fill-opacity':0.5,
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
        'fill-opacity':0.5,
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
        'fill-opacity':0.5,
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
        'fill-opacity':0.5,
        'fill-color': 'salmon'
      },
      'filter': ['all',
        ['>', 'area', 1000],
        ['<=','area',10000]
      ],
      'maxzoom': 10.5
    })
    map.addLayer({
      'id': "s-polygons",
      'type': "fill",
      'source': 'polygon-tweets',
      'paint':{
        'fill-opacity':0.5,
        'fill-color': 'salmon'
      },
      'filter': ['<=', 'area', 1000]
    })
    map.addLayer({
          "id": "polygon-fills-hover",
          "type": "fill",
          "source": "polygon-tweets",
          "layout": {},
          "paint": {
              "fill-color": "#627BC1",
              "fill-opacity": 0.5
          },
          "filter": ["==", "displayName", ""]
      });


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
    map.setFilter('polygon-fills-hover', ["==", "displayName", e.features[0].properties.displayName])
    this.polyPopup.setLngLat(e.features[0].geometry.coordinates[0][1])
        .setHTML(`<h4>Name: ${e.features[0].properties.displayName}</h4>
          <h4>Area: ${e.features[0].properties.area}</h4>
          <h4>Tweets: ${e.features[0].properties.count}</h4>`)
        .addTo(map);
  }

  this.remove = function(map){
    this.on = false;
    var that = this
    layers.forEach(function(layer){
      map.removeLayer(layer)
    })
    map.removeLayer("polygon-fills-hover")
  }


}
