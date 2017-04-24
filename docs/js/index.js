'use strict';

window.mapboxgl = require('mapbox-gl');

var util = require('../lib/functions.js')
var ImageHandler  = require('./image_maps.js')

var imageHandler = new ImageHandler({
  img_height: 150,
  img_width:  150,
  img_dir:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis/map_images',
  geojson:    'http://epic-analytics.cs.colorado.edu:9000/jennings/infovis-insta1000.geojson',
  load_lim:   100,
  extension:  ".jpg"
})

// Map!
mapboxgl.accessToken = 'pk.eyJ1IjoiamVubmluZ3NhbmRlcnNvbiIsImEiOiIzMHZndnpvIn0.PS-j7fRK3HGU7IE8rbLT9A';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v9',
    center: [-96, 37.8],
    zoom: 3,
    hash:true
});


map.on('load', function () {

  map.addSource('tweets',{
    "type": "geojson",
    "data": imageHandler.geojson
  })

  map.addLayer({
    "id": "tweets-layer",
    "type": "circle",
    "source": 'tweets'
  });


  // The worker
  map.on('moveend',function(){
    var features = map.queryRenderedFeatures({layers: ['tweets-layer']})
    if (!features.length) return //If no features exist here, return

    //Since we have vector tiles, need to only handle unique features
    var uniqueFeatures = util.getUniqueGeometries(features).slice(0,imageHandler.load_lim); //Only ever take the load limit

    console.log(uniqueFeatures.length)

    renderImages(uniqueFeatures)
  })

});


/*
  Image rendering logic, careful, this gets called a lot :)
*/

var resize, newImages, zoom, prevZoom;
var prevFeatures = new Set();

function renderImages(uniqueFeatures){
  resize = false

  // Two types of events will fire this: zooming and panning.
  zoom = Math.floor(map.getZoom()) //This should function at 0.5 levels too

  if(zoom!=prevZoom){
    resize = true;
    prevZoom = zoom;
  }

  //Testing out the set action so that out of view features are dropped
  var theseFeatures = new Set();

  //Iterate over each feature, check if it exists yet.
  uniqueFeatures.forEach(function(feature){

    //If this source exists on the map, don't add it.
    if (map.getSource("img_" + feature.properties.id)){

      //The source exists, but it may be invisible, so turn it back on and call a resize
      if( map.getLayoutProperty("img_"+feature.properties.id+"_layer",'visibility')=='none'){
        map.setLayoutProperty("img_"+feature.properties.id+"_layer",'visibility','visible')
        resize=true
      }

      //Check if the image needs to be resized (we have changed zoom levels)
      if(resize){
        map.getSource("img_"+feature.properties.id).setCoordinates(
          imageHandler.buildCoordinates(feature.geometry.coordinates, zoom)
        );
      }
      theseFeatures.add(feature.properties.id)

    //The source does not exist, so we must add it.
    }else{

      //Wrap it in an error handler for safety
      try{
        map.addSource("img_"+feature.properties.id, imageHandler.buildImageSrc(feature, zoom))
        imageHandler.activeSources.push("img_"+feature.properties.id)
        //Once source is added, add the layer
        try{
          map.addLayer({
            id: "img_" + feature.properties.id + '_layer',
            source: "img_" + feature.properties.id,
            type: 'raster',
            paint: {"raster-opacity": 0.9}
          })
          theseFeatures.add(feature.properties.id)
        }catch(e){
          console.log("Error adding LAYER: ","img_" + feature.properties.id + '_layer')
        }
      }catch(e){
        console.log("Error adding SOURCE ","img_"+feature.properties.id)
      }
    }
  })

  //So which features are no longer visible?
  //This will add and remove items as needbe (perhaps we don't want to keep adding and removing sources, but just layers?)
  if(prevFeatures.size > 0){ //If there is a previous set
    var difference = new Set([...prevFeatures].filter(x => !theseFeatures.has(x)));

    difference.forEach(function(id) {
      map.setLayoutProperty("img_"+id+"_layer",'visibility','none')
      // map.removeSource("img_"+id)
    });
  }
  prevFeatures = new Set(theseFeatures)
}


map.once('load',function(){
  var features = map.queryRenderedFeatures({layers: ['tweets-layer']})
  if (!features.length) return //If no features exist here, return

  //Since we have vector tiles, need to only handle unique features
  var uniqueFeatures = util.getUniqueGeometries(features).slice(0,imageHandler.load_lim); //Only ever take the load limit

  renderImages(uniqueFeatures)
})
