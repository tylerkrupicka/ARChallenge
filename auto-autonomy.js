var autonomy = require('ardrone-autonomy');
var arDrone = require('ar-drone');
var mission  = autonomy.createMission();
var cv = require('opencv');
var http    = require('http');

console.log('Connecting NimbustheGreat png stream ...');

var client = arDrone.createClient();
var pngStream = client.getPngStream();
var processingImage = false;
var lastPng;
var navData;
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
//ready states
var georgeReady = true;
var janeReady = false;
var judyReady = false;
var elroyReady = false;

///////////////////////////////INIT///////////////////////////////

//initialize PNG stream
pngStream
.on('error', console.log)
.on('data', function(pngBuffer) {
    //console.log("got image");
    lastPng = pngBuffer;
});

// Land on ctrl-c
var exiting = false;
process.on('SIGINT', function() {
    if (exiting) {
        process.exit(0);
    } else {
        console.log('Got SIGINT. Landing, press Control-C again to force exit.');
        exiting = true;
        mission.control().disable();
        mission.client().land(function() {
            process.exit(0);
        });
    }
});

///////////////////////////CLASSIFICATION///////////////////////////

//Face Detection Method using Cascades.
//Parameters: name of character, cascade file, buffer array, size of buffer, bool.
var detectJetson = function(name,cascade,buffer,size,foundBool){
    //make sure we are not processing an image
    if( ( ! processingImage ) && lastPng ){
        //log('PROCESSING ' + name);
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
                    log(name + ':       | buffer:' + count +'/' + size);
                }

                //log('ENDING PROCESSING ' + name);
                processingImage = false;

            }, opts.scale, opts.neighbors
            , opts.min && opts.min[0], opts.min && opts.min[1]);
        });
    };
};

////////////////////////////STAGING///////////////////////////////

//classifying functions -- load balancing with ready
function jetsons(){
    //this staging scheme forces it to do each character. annoying but functional.
    if(georgeReady == true){
        detectJetson("George", "georgeCascade20.xml", georgeArray, 5, georgeFound);
        georgeReady = false;
        janeReady = true;
    }
    else if(janeReady == true){
        detectJetson("Jane  ", "georgeCascade17.xml", janeArray, 5, janeFound);
        janeReady = false;
        judyReady = true;
    }
    else if(judyReady == true){
        detectJetson("Judy  ", "georgeCascade15.xml", judyArray, 5, judyFound);
        judyReady = false;
        elroyReady = true;
    }
    else if(elroyReady == true){
        detectJetson("Elroy ", "bananaClassifier.xml", elroyArray, 5, elroyFound);
        elroyReady = false;
        georgeReady = true;
    }
};

//we may be able to make this faster. ive been lowering it without consequence
//so far.
var jetsonInterval = setInterval(jetsons, 100);

////////////////////////FLIGHT//////////////////////////////////

mission.takeoff()
       //zero location
       .zero()
       //move to head level
       .altitude(1)
       .taskSync(detectCharacters)
       .land();

function detectCharacters(){
    while(georgeFound == false){
        log('George Not Found');
    }
    return;
};

mission.run(function (err, result) {
   if (err) {
       console.trace("Oops, something bad happened: %s", err.message);
       mission.client().stop();
       mission.client().land();
   } else {
       console.log("Mission success!");
       process.exit(0);
   }
});


///////////////////////STREAM SETUP////////////////////////////////
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
