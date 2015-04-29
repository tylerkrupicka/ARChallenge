var arDrone = require('ar-drone');
var cv = require('opencv');
var http    = require('http');

console.log('Connecting NimbustheGreat png stream ...');

var client = arDrone.createClient();
var pngStream = client.getPngStream();
var processingImage = false;
var lastPng;
var navData;
var flying = false;
var startTime = new Date().getTime();
var log = function(s){
    var time = ( ( new Date().getTime() - startTime ) / 1000 ).toFixed(2);
    console.log(time+" \t"+s);
}

//init buffers
var georgeArray = [];
var janeArray = [];
var judyArray = [];
var elroyArray = [];
//init detection booleans
var georgeFound = false;
var janeFound = false;
var judyFound = false;
var elroyFound = false;

//initialize PNG stream
pngStream
.on('error', console.log)
.on('data', function(pngBuffer) {
    //console.log("got image");
    lastPng = pngBuffer;
});

//Face Detection Method using Cascades.
//Parameters: name of character, cascade file, buffer array, size of buffer, bool.
var detectGeorge = function(name,cascade,buffer,size,foundBool){
    //make sure we are not processing an image
    if( ( ! processingImage ) && lastPng ){
        processingImage = true;
        //read the image
        cv.readImage( lastPng, function(err, im) {
            var opts = {};
            im.detectObject(cascade, opts, function(err, found) {
                //buffering
                //push new length
                buffer.unshift(found.length);
                if(buffer.length > size){
                    //make sure we dont add too many
                    buffer.pop();
                }
                //loop through the buffer
                var f;
                var count = 0;
                for(var k = 0; k < buffer.length; k++) {
                    f = buffer[k];
                    //entry in buffer is greater than 1
                    if(f >= 1){
                        count = count + 1;
                    }
                }
                if(count == size){
                    foundBool = true;
                    //log diagnostics
                    log(name + ': Found | buffer:' + count +'/' + size);
                }
                else{
                    foundBool = false;
                    //log diagnostics
                    log(name + ': not found | buffer:' + count +'/' + size);
                }

                processingImage = false;

            }, opts.scale, opts.neighbors
            , opts.min && opts.min[0], opts.min && opts.min[1]);
        });
    };
};

function george(){
    detectGeorge("George", "georgeCascade.xml", georgeArray, 5, georgeFound);
}
var georgeInterval = setInterval(george, 150);

//Actual Script
/*
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
*/
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
