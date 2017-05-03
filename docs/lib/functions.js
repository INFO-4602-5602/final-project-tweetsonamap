module.exports = {
  /* https://www.mapbox.com/mapbox-gl-js/example/filter-features-within-map-view/ */
  getUniqueFeatures: function(array, comparatorProperty) {
      var existingFeatureKeys = {};
      // Because features come from tiled vector data, feature geometries may be split
      // or duplicated across tile boundaries and, as a result, features may appear
      // multiple times in query results.
      var uniqueFeatures = array.filter(function(el) {
          if (existingFeatureKeys[el.properties[comparatorProperty]]) {
              return false;
          } else {
              existingFeatureKeys[el.properties[comparatorProperty]] = true;
              return true;
          }
      });

      return uniqueFeatures;
  },

  getUniqueGeometries: function(array) {
      var existingFeatureKeys = {};
      // Because features come from tiled vector data, feature geometries may be split
      // or duplicated across tile boundaries and, as a result, features may appear
      // multiple times in query results.
      var uniqueFeatures = array.filter(function(el) {
          if (existingFeatureKeys[el.geometry.coordinates.join(",")]) {
              return false;
          } else {
              existingFeatureKeys[el.geometry.coordinates.join(",")] = true;
              return true;
          }
      });

      return uniqueFeatures;
  },
  //http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript?page=2&tab=active#tab-top
  qs : function(a){
   if(!a)return {};
   a=a.split('#')[0].split('&');
   var b=a.length,c={},d,k,v;
   while(b--){
    d=a[b].split('=');
    k=d[0].replace('[]',''),v=decodeURIComponent(d[1]||'');
    c[k]?typeof c[k]==='string'?(c[k]=[v,c[k]]):(c[k].unshift(v)):c[k]=v;
   }
   return c
  }
}
