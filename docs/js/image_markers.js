var popup = new mapboxgl.Popup({

})
module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim

  this.activeMarkers = {}

  //https://www.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
  this.buildMarker = function(feature, zoom, map){

    //Scale logic could go here
    //h = this.img_height
    //w = this.img_width

    var that = this

    var markerDiv  = document.createElement('div')
        markerDiv.className = 'marker';
        markerDiv.style.backgroundImage = 'url(' + `${this.img_dir}/${feature.properties.id}${this.extension}` + ')';
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
