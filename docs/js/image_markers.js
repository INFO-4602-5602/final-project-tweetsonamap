module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim

  this.activeMarkers = {}
  this.zoomLevel = 100


  //https://www.mapbox.com/mapbox-gl-js/example/custom-marker-icons/
  this.buildMarker = function(feature, zoom){

    //Scale logic could go here
    h = this.img_height
    w = this.img_width

    var markerDiv  = document.createElement('div')
        markerDiv.className = 'marker';
        markerDiv.style.backgroundImage = 'url(' + `${this.img_dir}/${feature.properties.id}${this.extension}` + ')';
        markerDiv.style.width = 100+'px';
        markerDiv.style.height = 100+'px';

        // markerDiv.addEventListener('click', function() {
        //   window.alert(JSON.stringify(feature.properties)+"\n"+JSON.stringify(feature.geometry));
        // });

    var marker = new mapboxgl.Marker(markerDiv, {offset: [-50,-50]})
      .setLngLat(feature.geometry.coordinates)

    this.activeMarkers[feature.properties.id]   = marker

    return marker
  }
}
