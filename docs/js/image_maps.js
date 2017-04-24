/*

  Functions to handle adding images to maps and scaling appropriately

  Things to do here:
  > Scale appropriately based on zoom level

  Things not do here: call _map_

*/

module.exports = function(config){

  this.img_height = config.img_height
  this.img_width  = config.img_width
  this.img_dir    = config.img_dir
  this.extension  = config.extension
  this.geojson    = config.geojson
  this.load_lim   = config.load_lim

  this.activeSources = []

  this.buildCoordinates = function(coords, zoom){
    /*
      Input: point coordinates & zoom level
      Return: Array of ul,ur,lr,ll coordinates to scale image for zoom level
    */
    var lon = coords[0]
    var lat = coords[1]

    //TODO: overhaul this logic, make it scale appropriately with the projection,
    //and more zoom levels?
    var zoomScales = {
      0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 0.1, 6: 0.5, 7: 0.06,
      8: 0.05, 9: 0.04, 10: 0.03, 11: 0.02, 12: 0.01,
      13: 0.008, 14: 0.003, 15: 0.001, 16: 0.0008, 17: 0.0003,  18: 0.0001,  19: 0.00003
    }
    var scale = zoomScales[zoom]

    //ul,ur,lr,ll
    return [
      [lon - scale, lat + scale],
      [lon + scale, lat + scale],
      [lon + scale, lat - scale],
      [lon - scale, lat - scale]
    ]
  }

  this.buildImageSrc = function(feature, zoom){
    return {
      "type": "image",
      "url":  this.img_dir + "/" + feature.properties.id + this.extension,
      "coordinates": this.buildCoordinates(feature.geometry.coordinates, zoom)
    }
  }
}
