var util = require("../lib/functions.js")

var popup = new mapboxgl.Popup()

module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim
  this.on         = true;

  this.activeMarkers = {}

  //https://www.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
  this.buildMarker = function(feature, zoom, map){

    //Scale logic could go here
    //h = this.img_height
    //w = this.img_width

    var that = this

    var markerDiv  = document.createElement('div')
        markerDiv.className = 'marker';
        markerDiv.style.backgroundImage = 'url(' + `${this.img_dir}/`+'small/'+`${feature.properties.id}${this.extension}` + ')';
        markerDiv.style.width  = this.img_width+'px';
        markerDiv.style.height = this.img_height+'px';

        markerDiv.addEventListener('mouseenter', function() {
            popup.setLngLat(feature.geometry.coordinates)
                 .setHTML(that.prettyPopUp(feature.properties))
                 .addTo(map)

        });

        markerDiv.addEventListener('mouseleave', function() {
          popup.remove();
        });

    var marker = new mapboxgl.Marker(markerDiv, {offset: [-50,-50]})
      .setLngLat(feature.geometry.coordinates)
      .addTo(map)

    this.activeMarkers[feature.properties.id] = marker

    return marker
  }

  this.remove = function(map){
    if(this.on){
      this.on = false;
      var that = this;
      Object.keys(that.activeMarkers).forEach(function(id){
        that.activeMarkers[id].remove()
        delete that.activeMarkers[id];
      })
      map.removeLayer('marker-layer')
    }
  }

  this.addMarkerLayer = function(map){
    this.on = true
    map.addLayer({
      "id": "marker-layer",
      "type": "circle",
      "source": 'tweets'
    });
    var that = this;
    var initialRender = setInterval(function(){
      if(map.loaded()){
        that.renderMarkers(map)
        clearInterval(initialRender)
        console.log("Rendering")
      }else{
        console.log("Waiting on map...")
      }
    },1000)
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
