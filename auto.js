// Run this to receive a png image stream from your drone.

var arDrone = require('ar-drone');
var cv = require('opencv');
var http    = require('http');
//var fs = require('fs');

console.log('Connecting NimbustheGreat png stream ...');

//var stream  = arDrone.createUdpNavdataStream();
var client = arDrone.createClient();
var pngStream = client.getPngStream();
var processingImage = false;
var lastPng;
var navData;
var flying = false;
var found = false;
var startTime = new Date().getTime();
var log = function(s){
var time = ( ( new Date().getTime() - startTime ) / 1000 ).toFixed(2);

  console.log(time+" \t"+s);
}

pngStream
  .on('error', console.log)
  .on('data', function(pngBuffer) {
    //console.log("got image");
    lastPng = pngBuffer;
  });

//Face Detection Method for George's Face
  var detectGeorge = function(){
      if( ! flying ) return;
      if( found ) return
      if( ( ! processingImage ) && lastPng )
      {
        processingImage = true;
        cv.readImage( lastPng, function(err, im) {
          var opts = {};
          im.detectObject(GEORGEY.xml, opts, function(err, faces) {

            var face;
            var biggestFace;

            for(var k = 0; k < faces.length; k++) {

              //im.rectangle([face.x, face.y], [face.x + face.width, face.y + face.height], [0, 255, 0], 2);
            }
            log(faces.length)
            processingImage = false;
          //im.save('/tmp/salida.png');

        }, opts.scale, opts.neighbors
          , opts.min && opts.min[0], opts.min && opts.min[1]);

      });
    };
  };

//Face Detection Method for Janes's Face
  var detectJane = function(){
      if( ! flying ) return;
      if( found ) return
      if( ( ! processingImage ) && lastPng )
      {
        processingImage = true;
        cv.readImage( lastPng, function(err, im) {
          var opts = {};
          //Change//
          im.detectObject(Jane.xml, opts, function(err, faces) {
          //Change//
            var face;
            var biggestFace;

            for(var k = 0; k < faces.length; k++) {

              //im.rectangle([face.x, face.y], [face.x + face.width, face.y + face.height], [0, 255, 0], 2);
            }
            log(faces.length)
            processingImage = false;
          //im.save('/tmp/salida.png');

        }, opts.scale, opts.neighbors
          , opts.min && opts.min[0], opts.min && opts.min[1]);

      });
    };
  };
          //Change//
//Face Detection Method for Elroy's Face
  var detectElroy = function(){
      if( ! flying ) return;
      if( found ) return
      if( ( ! processingImage ) && lastPng )
      {
        processingImage = true;
        cv.readImage( lastPng, function(err, im) {
          var opts = {};
          //Change//
          im.detectObject(Elroy.xml, opts, function(err, faces) {
          //Change//
            var face;
            var biggestFace;

            for(var k = 0; k < faces.length; k++) {

              //im.rectangle([face.x, face.y], [face.x + face.width, face.y + face.height], [0, 255, 0], 2);
            }
            log(faces.length)
            processingImage = false;
          //im.save('/tmp/salida.png');

        }, opts.scale, opts.neighbors
          , opts.min && opts.min[0], opts.min && opts.min[1]);

      });
    };
  };

//Face Detection Method for Judy's Face
  var detectJudy = function(){
      if( ! flying ) return;
      if( found ) return
      if( ( ! processingImage ) && lastPng )
      {
        processingImage = true;
        cv.readImage( lastPng, function(err, im) {
          var opts = {};
          im.detectObject(Judy.xml, opts, function(err, faces) {
            var face;
            var biggestFace;

            for(var k = 0; k < faces.length; k++) {

              //im.rectangle([face.x, face.y], [face.x + face.width, face.y + face.height], [0, 255, 0], 2);
            }
            log(faces.length)
            processingImage = false;
          //im.save('/tmp/salida.png');

        }, opts.scale, opts.neighbors
          , opts.min && opts.min[0], opts.min && opts.min[1]);

      });
    };
  };

var faceIntervalGE = setInterval( detectGeorge, 150, );
var faceIntervalJA = setInterval( detectJane, 150, );
var faceIntervalEL = setInterval( detectElroy, 150, );
var faceIntervalJU = setInterval( detectJudy, 150, );

//Actual Script
client.takeoff();
client.after(5000,function(){
  log("going up");
  //this.up(1);
}).after(1000,function(){
  log("stopping");
  this.stop();
  flying = true;
});


client.after(10000, function() {
    flying = false;
    this.stop();
    this.land();
  });

client.on('navdata', function(navdata) {
  navData = navdata;
})


var server = http.createServer(function(req, res) {
  if (!lastPng) {
    res.writeHead(503);
    res.end('Did not receive any png data yet.');
    return;
  }

  res.writeHead(200, {'Content-Type': 'image/png'});
  res.end(lastPng);
});

server.listen(8080, function() {
  console.log('Serving latest png on port 8080 ...');
});
