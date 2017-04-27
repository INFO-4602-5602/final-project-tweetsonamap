var util = require("../lib/functions.js")

module.exports = function(config){

  this.initial_load_size =  config.load_lim
  this.on         = true;
  this.extraTweets = []
  this.working    = false;

  this.img_root   = config.img_root

  this.renderTweets = function(tweets, map, popup){

    //Clear the current list of images
    var list = document.getElementById('images')
    list.innerHTML = "";
    var that = this;
    tweets.slice(0,this.initial_load_size).forEach(function(tweet){
      var li = document.createElement('li')
        li.className = 'visible-image'
        //li.innerHTML = `<p>Tweet:</p><p>${tweet.properties.id}</p>`
        li.style.backgroundImage = 'url(' + `${tweet.properties.thumb}` + ')';
        li.addEventListener('click',function(){
          that.tweetClicked(tweet, map, popup)
        })
        list.appendChild(li)
    })

    this.extraTweets = tweets.slice(this.initial_load_size,tweets.length)
    this.working = false;
    document.getElementById('loading-bar').className = "m6"
  }

  /*
    This function will be called when the 'next' arrow is pressed to load more images for a given area
  */
  this.loadMore = function(){
    if(this.extraTweets.length){
      console.log("There are another " + this.extraTweets.length + " tweets to load")

      var list = document.getElementById('images')
      var that = this;
      this.extraTweets.slice(0,20).forEach(function(tweet){
        var li = document.createElement('li')
          li.className = 'visible-image'
          li.style.backgroundImage = 'url(' + `${tweet.properties.thumb}` + ')';
          li.addEventListener('click',function(){
            that.tweetClicked(tweet, map)
          })
        list.appendChild(li)
      })
      this.extraTweets = this.extraTweets.slice(20,this.extraTweets.length)
    }else{
      return
    }
  }

  this.tweetClicked = function(tweet, map, popup){

    popup
     .setLngLat(tweet.geometry.coordinates)
     .setHTML(`<div class='image-popup'>
      <img src=
   </div>`)
     .addTo(map)


    console.log(tweet.geometry, tweet.properties)
  }

}
