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

//init buffers
var georgeArray = 0;
var janeArray = 0;
var judyArray = 0;
var elroyArray = 0;
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
        client.land()
    }
});

///////////////////////////CLASSIFICATION///////////////////////////

//Face Detection Method using Cascades.
//Parameters: name of character, cascade file, buffer array, size of buffer, bool.
var detectJetson = function(name,cascade,buffer,size){
    //make sure we are not processing an image
    if( ( ! processingImage ) && lastPng && (!man)){
        //log('PROCESSING ' + name);
        processingImage = true;
        //read the image
        cv.readImage( lastPng, function(err, im) {
            var opts = {};
            opts.min = 50;
            //opts.neighbors = 0;
            im.detectObject(cascade, opts, function(err, found) {
                //buffering
                //push new length
                if(found.length >= 1){
                    if(name == "George"){
                        georgeArray = georgeArray+1;
                    }
                    else if(name == "Jane"){
                        janeArray = janeArray+1;
                    }
                    else if(name == "Judy"){
                        judyArray = judyArray+1;
                    }
                    else if(name == "Elroy"){
                        elroyArray = elroyArray+1;
                    }
                }
                else{
                    if(name == "George"){
                        georgeArray =0;
                    }
                    else if(name == "Jane"){
                        janeArray = 0;
                    }
                    else if(name == "Judy"){
                        judyArray = 0;
                    }
                    else if(name == "Elroy"){
                        elroyArray = 0;
                    }
                }

                //loop through the buffer
                var f;
                var count = georgeArray;

                if(name == "George"){
                    count = georgeArray;
                }
                else if(name == "Jane"){
                    count = janeArray;
                }
                else if (name == "Judy"){
                    count = judyArray;
                }
                else if (name == "Elroy"){
                    count = elroyArray;
                }

                if(count >= size){
                    if(name == "George"){
                        georgeFound = true;
                    }
                    else if(name == "Jane"){
                        janeFound = true;
                    }
                    else if(name == "Judy"){
                        judyFound = true;
                    }
                    else if(name == "Elroy"){
                        elroyFound = true;
                    }
                    //log diagnostics
                    log(name + ': Found | buffer:' + count +'/' + size +' ');
                }
                else{
                    if(name == "George"){
                        georgeFound = false;
                    }
                    else if(name == "Jane"){
                        janeFound = false;
                    }
                    else if(name == "Judy"){
                        judyFound = false;
                    }
                    else if(name == "Elroy"){
                        elroyFound = false;
                    }
                    //log diagnostics
                    if(count > 0){
                        log(name + ':       | buffer:' + count +'/' + size +' ');
                    }
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
        log('calling george');
        detectJetson("George", "georgeCascade20.xml", georgeArray, 5);
        georgeReady = false;
        janeReady = true;
    }
    else if(janeReady == true){
        log('calling jane');
        detectJetson("Jane", "janeCascade20.xml", janeArray, 5);
        janeReady = false;
        judyReady = true;
    }
    else if(judyReady == true){
        log('calling judy');
        detectJetson("Judy", "judyCascade20.xml", judyArray, 5);
        judyReady = false;
        elroyReady = true;
    }
    else if(elroyReady == true){
        detectJetson("Elroy", "elroyCascade20.xml", elroyArray, 5);
        elroyReady = false;
        georgeReady = true;
    }
};

//we may be able to make this faster. ive been lowering it without consequence
//so far.
var jetsonInterval = setInterval(jetsons, 150);
var detection = setInterval(makeMoves,150);

function makeMoves(){
        if(georgeFound){
            man = true;
            console.log("WAVING");
            //client.land();
            //client.animate('wave',4000);
            //man = false;
            georgeFound = false;
            georgeArray = [];
        };

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
