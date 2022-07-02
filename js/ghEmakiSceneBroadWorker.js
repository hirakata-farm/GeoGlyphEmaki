//
//
//  ghEmaki 2D scene  worker
//
//
//it looks like the ugly hack.
// global is undefined error
// https://github.com/aspnet/AspNetCore/issues/6979
// for importScripts('../cesium/Cesium.js');
//
//const window = self.window = self;
window = self.window = self;

importScripts('../js/ghEmakiUtil.js','../js/ghEmakiStatus.js','../js/ghEmakiParams.js','../js/ghEmakiSharedArray.js','../js/ghEmakiClock.js','../js/ghEmakiBroadcast.js','../js/turfEmakiLib.min.js');

var GH_IS_PLAYING = false;

var GH_SIMJSON = null;
var GH_SIM_FILE= null;
var GH_2DBROAD = null;
var GH_SIM_OVER = {
    "corps" : null,
    "unit" : null,
    "elapsed" : 0,
    "timestring" : null
}

var GH_UNIT_BROADID = {};

var GH_SHAREDUNITS = {};

var GH_UNIT_TIMER = null;
var GH_CLOCK = null;
var GH_CURRENT_ELAPSED = -1;

var GH_TRANSFER_INTERVAL = 2.0 * GH_MSPF; // [ mili-sec / frame ]

function _SendParentMessage(command,data) {
    self.postMessage({
	"cmd": command,
	"value": data });
}

function ghEmakiReceiveMessage(data) {
    if (data.type == 'GH_SETMYKEY') {
	GH_UNIT_BROADID[data.value] = data.sender;
    } else if (data.type == 'GH_GETDATAFILE') {
	GH_2DBROAD.sendMessage('GH_GETDATAFILE_ACK',data.sender,GH_SIM_FILE);
//    } else if (data.type == 'GH_GETINITTACDATA') {
//	// Obsolete
//	//  For Heatmap Value
//	let idx = 0;
//	let corps = {};
//	for(var key0 in GH_SIMJSON.corps){
//	    if ( idx == 0 ) {
//		corps[key0] = -10;
//	    } else {
//		corps[key0] = 10;
//	    }
//	    idx++;
//	}
//	let units = {};
//	for(var key1 in GH_SIMJSON.units){
//	    let cp = GH_SIMJSON.units[key1].corps;
//	    units[key1] = corps[cp];
//	}
//	GH_2DBROAD.sendMessage('GH_GETINITTACDATA_ACK',data.sender,{
//	    'latlng' : GH_SIMJSON.scene.latlng,
//	    'zoom' : GH_SIMJSON.scene.zoom,
//	    'units' : units
//	});
    } else if (data.type == 'GH_ORDER') {
	_SendParentMessage('GH_ORDER',data.value);
    } else if (data.type == 'GH_GETCURRENTUNITDATA') {
	// NOP YET
    } else if (data.type == 'UNITREADY') {
	// NOP YET
    } else {

    }
}



function ghEmakiUpdateUnitEach(interval) {
    for(var key in GH_SHAREDUNITS){
	var ary = [
	    GH_SHAREDUNITS[key].unitarray[ghstatusidx],
	    GH_SHAREDUNITS[key].unitarray[ghnodesidx],
	    GH_SHAREDUNITS[key].unitarray[ghlatidx],
	    GH_SHAREDUNITS[key].unitarray[ghlngidx],
	    GH_SHAREDUNITS[key].unitarray[ghfrontdiridx],
	    GH_SHAREDUNITS[key].unitarray[ghvelocityidx],
	    GH_SHAREDUNITS[key].unitarray[ghfatigueidx],	    
	    GH_SHAREDUNITS[key].unitarray[ghterrainidx],
	    interval
	];
	if ( GH_UNIT_BROADID[key] ) {
	    GH_2DBROAD.sendTransferMessage('GH_UPDATEUNIT',GH_UNIT_BROADID[key],9,ary);
	}
    }
}
function ghEmakiUpdateUnitOnce(interval) {
    var dataary = [];
    let eachsize = 10;
    for(var key in GH_SHAREDUNITS){
	dataary.push ( key );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghstatusidx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghnodesidx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghlatidx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghlngidx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghfrontdiridx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghvelocityidx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghfatigueidx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghterrainidx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghrationidx] );
	dataary.push ( GH_SHAREDUNITS[key].unitarray[ghbulletidx] );
    }
    dataary.push ( interval );
    //console.log(dataary);
    GH_2DBROAD.sendTransferMessage('GH_UPDATEUNIT','all',eachsize,dataary);
}

GH_2DBROAD = new EmakiBroadcast('2dbroad','SceneBroad','primary',ghEmakiReceiveMessage);


function _ghAnimationLoop() {

    let interval = GH_CLOCK.update();

    // Send Message for ghEmakiUnit3dSimWorker
    // Serialize
    //ghEmakiUpdateUnitEach(interval);
    //ghEmakiUpdateUnitOnce(interval);
    ghEmakiUpdateUnitOnce( GH_CLOCK.getCurrentTimeString() );
    

    var nextupdate = GH_TRANSFER_INTERVAL - interval;// mili second
    if ( nextupdate > 1 ) {
        GH_UNIT_TIMER = setTimeout(_ghAnimationLoop,nextupdate);        
    } else {
        GH_UNIT_TIMER = setTimeout(_ghAnimationLoop,1);        
    }
}

//////////////////////////////////////////
//
//    Message Handler
//
//////////////////////////////////////////

self.addEventListener('message', function(e) {
    var data = e.data;
    var command = data.cmd;

    if ( command == "loaddata") {
	GH_SIMJSON = data.value.json;
	GH_SIM_FILE = data.value.file;
	GH_CLOCK = new EmakiClock(GH_SIMJSON.scene.timestring,GH_SIMJSON.scene.starttime);
    } else if ( command == "sharedunits") {
	GH_SHAREDUNITS = data.value;
	for ( var key in GH_SHAREDUNITS ) {
	    GH_SHAREDUNITS[key].defense = parseFloat(GH_SHAREDUNITS[key].defense);
	    GH_SHAREDUNITS[key].nodes = parseFloat(GH_SHAREDUNITS[key].nodes);
	    GH_SHAREDUNITS[key].unitarray = new Float64Array(GH_SHAREDUNITS[key].unitbuffer);
	    GH_SHAREDUNITS[key].nodearray = new Float64Array(GH_SHAREDUNITS[key].nodebuffer);
	}
    } else if ( command == "updatescene") {
	//console.log(data.value);
	// NOP
    } else if ( command == "transferinterval") {
	let v = parseFloat(data.value.mspf);
	let r = parseFloat(data.value.rate);
	GH_TRANSFER_INTERVAL = v * r;
    } else if ( command == "simulationspeed") {
	GH_CLOCK.setSpeed(parseFloat(data.value.speed));
    } else if ( command == "simulationover") {
	GH_SIM_OVER.corps = data.value.corps;
	GH_SIM_OVER.unit = data.value.unit;
	GH_SIM_OVER.elapsed = data.value.elapsed;
	GH_SIM_OVER.timestring = data.value.timestring;
	GH_2DBROAD.sendMessage('GH_SIMULATION_OVER','all',GH_SIM_OVER);
    } else if ( command == "playpause") {
	let v = parseFloat(data.value.elapsed);
	if ( v >= GH_CURRENT_ELAPSED ) {
	    GH_IS_PLAYING = data.value.isplaying;
	    if ( GH_IS_PLAYING ) {
		GH_CLOCK.play();
		if ( GH_UNIT_TIMER == null ) {
		    GH_UNIT_TIMER = setTimeout(_ghAnimationLoop);
		}
	    } else {
		GH_CLOCK.pause();
		if ( GH_UNIT_TIMER != null ) {
                    clearTimeout(GH_UNIT_TIMER);
                    GH_UNIT_TIMER = null;
		}
	    }
	    GH_CURRENT_ELAPSED = v;
	} else {
	    let res = "wrong elapsed scene "  + v + " " +  GH_CURRENT_ELAPSED;
	    console.log(res);
	}
    } else {
        // NOP
    }
});
