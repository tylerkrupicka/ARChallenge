var arDrone = require('ar-drone');
var cv = require('opencv');
var http    = require('http');

console.log('Connecting NimbustheGreat png stream ...');

var client = arDrone.createClient();
var pngStream = client.getPngStream();
var processingImage = false;
var lastPng;
var navData;
var flight = false; /////////////////FLIGHT ENABLE/////////////////
var man = false;
var startTime = new Date().getTime();
var log = function(s){
    var time = ( ( new Date().getTime() - startTime ) / 1000 ).toFixed(2);
    console.log(time+" \t"+s);
}

///////INITIALIZATION//////////////
//init buffers
var georgeBuffer = 0;
var janeBuffer = 0;
var judyBuffer = 0;
var elroyBuffer = 0;
var georgeSize = 4;
var janeSize = 4;
var judySize = 4;
var elroySize = 4;
//ready states
var georgeReady = true;
var janeReady = false;
var judyReady = false;
var elroyReady = false;

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
// Land on ctrl-c
var exiting = false;
process.on('SIGINT', function() {
    if (exiting) {
        process.exit(0);
    } else {
        console.log('Got BREAK. Landing, press Control-C again to force exit.');
        exiting = true;
        client.land()
    }
});

////////CLASSIFICATION METHODS////////////////
//not doing it streamlined this time
var detectGeorge = function(){
    //make sure we are not processing an image
    if( ( ! processingImage ) && lastPng && (!man)){
        processingImage = true;
        //read the image
        cv.readImage( lastPng, function(err, im) {
            var opts = {neighbors: 1, scale: 2};
            //opts.neighbors = 0;
            im.detectObject('georgeCascade20New.xml', opts, function(err, found) {
                    //buffer
                    if(found.length >= 1){
                        georgeBuffer = georgeBuffer + 1;
                    }
                    else{
                        georgeBuffer = 0;
                    }
                processingImage = false;

            });
        });
    };
};

var detectJane = function(){
    //make sure we are not processing an image
    if( ( ! processingImage ) && lastPng && (!man)){
        processingImage = true;
        //read the image
        cv.readImage( lastPng, function(err, im) {
            var opts = {neighbors: 2};
            //opts.neighbors = 0;
            im.detectObject('janeCascade20.xml', opts, function(err, found) {
                    //buffer
                    if(found.length >= 1){
                        janeBuffer = janeBuffer + 1;
                        //save jane image to see what its detecting
                        //for(var k = 0; k < objects.length; k++) {
                            //var object = objects[k];
                            //im.rectangle([object.x, object.y], [object.x + object.width, object.y + object.height], color, 2);
                        //}
                        //im.save(fileName.replace(/.jpg/, ‘jane.jpg’));
                    }
                    else{
                        janeBuffer = 0;
                    }
                processingImage = false;

            });
        });
    };
};

var detectJudy = function(){
    //make sure we are not processing an image
    if( ( ! processingImage ) && lastPng && (!man)){
        processingImage = true;
        //read the image
        cv.readImage( lastPng, function(err, im) {
            var opts = {neighbors: 1};
            im.detectObject('judyCascade20.xml', opts, function(err, found) {
                    //buffer
                    if(found.length >= 1){
                        judyBuffer = judyBuffer + 1;
                    }
                    else{
                        judyBuffer = 0;
                    }
                processingImage = false;

            });
        });
    };
};

var detectElroy = function(){
    //make sure we are not processing an image
    if( ( ! processingImage ) && lastPng && (!man)){
        processingImage = true;
        //read the image
        cv.readImage( lastPng, function(err, im) {
            var opts = {neighbors: 1};
            //opts.neighbors = 0;
            im.detectObject('elroyCascade20.xml', opts, function(err, found) {
                    //buffer
                    if(found.length >= 1){
                        elroyBuffer = elroyBuffer + 1;
                    }
                    else{
                        elroyBuffer = 0;
                    }
                processingImage = false;

            });
        });
    };
};

////////////////////////////STAGING///////////////////////////////

//classifying functions -- load balancing with ready
function jetsons(){
    //this staging scheme forces it to do each character. annoying but functional.

    if(georgeReady == true){
        detectGeorge();
        georgeReady = false;
        janeReady = true;
    }
    else if(janeReady == true){
        detectJane();
        janeReady = false;
        judyReady = true;
    }
    else if(judyReady == true){
        detectJudy();
        judyReady = false;
        elroyReady = true;
    }
    else if(elroyReady == true){
        detectElroy();
        elroyReady = false;
        georgeReady = true;
    }
};

//////////////DETECTION and LOGGING////////////////////////
var jetsonInterval = setInterval(jetsons, 150);
var detection = setInterval(makeMoves,150);

function makeMoves(){
        //George
        if(georgeBuffer >= 1 && georgeBuffer < georgeSize && georgeFound == false){
            log('George:       | buffer:' + georgeBuffer +'/' + georgeSize);
        }
        else if(georgeBuffer >= georgeSize && georgeFound == false){
            georgeBuffer = georgeSize;
            georgeFound = true;
            log('George: Found | buffer:' + georgeBuffer +'/' + georgeSize);
            client.animate('wave',4000);
        }

        //Jane
        if(janeBuffer >= 1 && janeBuffer < janeSize && janeFound == false){
            log('Jane  :       | buffer:' + janeBuffer+'/' + janeSize);
        }
        else if(janeBuffer >= janeSize && janeFound == false){
            janeBuffer = janeSize;
            janeFound = true;
            log('Jane  : Found | buffer:' + janeBuffer +'/' + janeSize);
            client.animate('wave',3000);
        }

        //Judy
        if(judyBuffer >= 1 && judyBuffer < judySize && judyFound == false){
            log('Judy  :       | buffer:' + judyBuffer +'/' + judySize);
        }
        else if(judyBuffer >= judySize && judyFound == false){
            judyBuffer = judySize;
            judyFound = true;
            log('Judy  : Found | buffer:' + judyBuffer +'/' + judySize);
            client.animate('wave',3000);
        }

        //Elroy
        if(elroyBuffer >= 1 && elroyBuffer < elroySize && elroyFound == false){
            log('Elroy :       | buffer:' + elroyBuffer +'/' + elroySize);
        }
        else if(elroyBuffer >= elroySize && elroyFound == false){
            elroyBuffer = elroySize;
            elroyFound = true;
            log('Elroy : Found | buffer:' + elroyBuffer +'/' + elroySize);
            client.land();
        }
};

////////////////////////FLIGHT//////////////////////////////////

if(flight == true){
    client.takeoff();
    client.after(5000,function(){
        log("going up");
        this.up(1);
    }).after(750,function(){
        log("stopping");
        this.stop();
    });

}

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
