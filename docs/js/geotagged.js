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
      "source": that.title
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
        // markerDiv.style.backgroundImage = 'url(' + `${this.img_dir}/`+'small/'+`${feature.properties.id}${this.extension}` + ')';
        markerDiv.style.backgroundImage = 'url(' + `${this.img_dir}/`+'small/'+`${feature.properties.id}` + '.jpg)';
        markerDiv.style.width  = this.img_width+'px';
        markerDiv.style.height = this.img_height+'px';

        // markerDiv.addEventListener('mouseenter', function() {
        //     popup.setLngLat(feature.geometry.coordinates)
        //          .setHTML(that.prettyPopUp(feature.properties))
        //          .addTo(map)
        //
        // });
        //
        // markerDiv.addEventListener('mouseleave', function() {
        //   popup.remove();
        // });

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
