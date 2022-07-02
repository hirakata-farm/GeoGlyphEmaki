//
//
//  ghEmaki 3D node worker
//
//
//it looks like the ugly hack.
// global is undefined error
// https://github.com/aspnet/AspNetCore/issues/6979
// for importScripts('../cesium/Cesium.js');
//
//const window = self.window = self;
window = self.window = self;

importScripts('../js/ghEmakiUtil.js','../js/ghEmakiStatus.js','../js/ghEmakiParams.js','../js/ghEmakiSharedArray.js','../js/ghEmakiClock.js','../js/ghEmakiBroadcast.js','../js/ghEmakiFormation.js','../js/turfEmakiLib.min.js');
importScripts('../../cesium/Cesium.js');

var GH_2DBROAD = null;

var GH_ANGLE_OFFSET_2D3D = -90.0; // Degree
//////////////////////////////////////////////////////////////////


var GH_NODE_ELEMS = 0;
var GH_NODE_BYTES = 0;
var GH_NODE_BUFFER = null;
var GH_NODE_ARRAY = null;
var GH_INIT_NODE_LENGTH = 0;

/////////////////////////////////////////
//
//  IMPORTANT  !  same parameter for shared array
//
var GH_UNIT_ELEMS = 0;
var GH_UNIT_BYTES = 0;
var GH_UNIT_BUFFER = null;
var GH_UNIT_ARRAY = null;

//var GH_HOSTILITY = null;
var GH_SHAREDUNITS = null;

var GH_UNIT = {
    "id" : null,
    "corps" : null,
    "hostility" : [],
    "ability" : {
	"leadership" : 0,
	"attack" : 0,
	"defense" : 0,
	"searching" : 0,
	"luck" : 0
    },
    "speed" : {
	"max" : 6,
	"normal" : 4,
	"current" : 4,
	"fatiguecoeff" : 1
    }
};
var GH_IS_PLAYING = false;
var GH_IS_FIRST_UNITUPDATE = true;

var GH_UNIT_TIMER = null;

var GH_CURRENT_ELAPSED = -1;
var GH_CLOCK = null;

var GH_ATTACK = {
    'unit' : null,
    'interval' : 0,
    'decision' : false,
    'angle' : GH_DIR_FRONT,
    'point' : null,
    'prevattacktime' : -1
}
var GH_NEIGHBOR = {
    "elapsedtime" : null,
    "center" : null,
    "updatedistance" : 200, // [m] feature update distance
    "areasize"       : 300, // [m] bbox feature size
    "structure" : [],
    "structureidx" : [],
    "border" : [],
    "borderidx" : [],
    "field" : [],
    "fieldidx" : []
}
const GH_OBSTACLE_CHECK_DISTANCE = 5; // [m]

var GH_STRUCT = [];
var GH_STRUCT_FEATURES = [];

var GH_FIELD = [];
var GH_FIELD_FEATURES = [];



/////////////////////////////////////////

var GH_NODE_DISTANCE_METER = GH_METER_PER_NODE;
const GH_NODE_RANGE_RATIO = 0.666 / 2.0 ;  //  Half of (  one third , 1 / 3 )

const GH_NODE_SKIP_DISTANCE = 100; // [m]

function _SendMessage(command,data) {
    self.postMessage({
	"cmd": command,
	"corps": GH_UNIT.corps,
	"unit": GH_UNIT.id,	
	"value": data });
}

function ghGetNodeCount() {
    return Math.floor(GH_UNIT_ARRAY[ghnodesidx]);
}

function _IsHostilityUnits(key) {
    if ( GH_SHAREDUNITS[key] ) {
	let corps = GH_SHAREDUNITS[key].corps;
	for ( var i =0;i<GH_UNIT.hostility.length;i++ ) {
	    if ( corps == GH_UNIT.hostility[i] ) return true;
	}
    } else {
	// No Units
	// NOP
    }
    return false;
}
function _GetNodeCount() {
    return Math.floor(GH_UNIT_ARRAY[ghnodesidx]);
}
function _GetStatus(type) {
    let val = GH_UNIT_ARRAY[ghstatusidx];
    return ghEmakiStatusGet(val,type);
}
function _SetStatus(value,type) {
    let oldvalue = _GetStatus(type);
    let val = GH_UNIT_ARRAY[ghstatusidx];
    if ( oldvalue != value ) {
	// Status change, send message
	_SendMessage('status',value);
    }
    GH_UNIT_ARRAY[ghstatusidx] = ghEmakiStatusSet(val,value,type);
}

function ghUpdateScene(difftime) {

    ghUpdateNeighborFeature();
	
    let status = _GetStatus(GH_STATUS_MOVE_DIGIT);
    let isatk = _GetStatus(GH_STATUS_ATTACK_DIGIT);
    if ( GH_IS_FIRST_UNITUPDATE ) {	
	ghUpdateNodesFormation(difftime,1.0);
	GH_IS_FIRST_UNITUPDATE = false;
    } else {
	//if ( status > GH_STATUS_ATTACK ) {
	ghUpdateNodesFormation(difftime,-1);
	//} else {
	//ghUpdateNodesForceSimulation(diffTime);
	//ghUpdateNodesVectorSimulation(diffTime);
	//}
    }
}

//////////////////////////////////////////////////////////
//
//  Broadcast Channel Function
//
function ghEmakiReceiveMessage(data) {
    if (data.type == 'GH_UPDATEUNIT') {

	// If Each Data Message
	//ghUpdateUnitData(data.length,data.value);

	// If Once all Data Message
	let dlength = data.length;
	let array = [];
	//for ( var i =0,ilen=data.value.length;i<ilen;i++ ) {
	for ( var i =0,ilen=data.value.length-1;i<ilen;i=i+dlength+1 ) {
	    if ( data.value[i] == GH_UNIT.id ) {
		for ( var j =0;j<dlength;j++ ) {
		    array.push ( data.value[i+1+j] );
		}
		break;
	    }
	}
	if ( array.length > 0 ) ghUpdateUnitData(dlength,array);
	let diffTime = data.value[data.value.length];

	// Update Nodes
	ghUpdateScene(diffTime);

    } else {
        // Not Implemented
    }
};
//
//  Broadcast Channel Function
//
//////////////////////////////////////////////////////////

function ghUpdateUnitData(len,array) {

    GH_UNIT_ARRAY[ghstatusidx] = array[0];
    GH_UNIT_ARRAY[ghnodesidx] = array[1];
    GH_UNIT_ARRAY[ghlatidx] = array[2];
    GH_UNIT_ARRAY[ghlngidx] = array[3];
    GH_UNIT_ARRAY[ghfrontdiridx] = array[4];
    GH_UNIT_ARRAY[ghvelocityidx] = array[5]; // [meter/milisec]
    GH_UNIT_ARRAY[ghfatigueidx] = array[6];  //
    GH_UNIT_ARRAY[ghterrainidx] = array[7];  // [meter/milisec]
    GH_UNIT_ARRAY[ghrationidx] = array[8];   // 
    GH_UNIT_ARRAY[ghbulletidx] = array[9];   // 
    
    let c = new Cesium.Cartesian3.fromDegrees(array[3], array[2]);
    GH_UNIT_ARRAY[ghcartesianx] = c.x;
    GH_UNIT_ARRAY[ghcartesiany] = c.y;
    GH_UNIT_ARRAY[ghcartesianz] = c.z;

    let heading = Cesium.Math.toRadians(array[4] + GH_ANGLE_OFFSET_2D3D); // -90 is East to north axis
    let hpRoll = new Cesium.HeadingPitchRoll(heading,0.0,0.0);  
    let q = Cesium.Transforms.headingPitchRollQuaternion(c,hpRoll); 
    GH_UNIT_ARRAY[ghquaternionx] = q.x;
    GH_UNIT_ARRAY[ghquaterniony] = q.y;
    GH_UNIT_ARRAY[ghquaternionz] = q.z;
    GH_UNIT_ARRAY[ghquaternionw] = q.w;

}

function ghUpdateNodesFormation(interval,firstratio) {

    //var form = parseInt(GH_UNIT_ARRAY[ghformationidx],10);
    var form = _GetStatus(GH_STATUS_FORMATION_DIGIT);
    var lead = GH_UNIT.ability.leadership;
    let nodecnt = ghGetNodeCount();
    let formlines = ghGetFormationLines(form,nodecnt);
    let xmax = formlines * GH_NODE_DISTANCE_METER
    let ymax = Math.ceil(nodecnt/formlines) * GH_NODE_DISTANCE_METER;
    let xcenter = xmax/2;
    if ( formlines % 2 == 0 ) xcenter = xcenter - (GH_NODE_DISTANCE_METER/2.0);
    let ycenter = ymax/2;

    let center = turf.helpers.point( [ GH_UNIT_ARRAY[ghlngidx], GH_UNIT_ARRAY[ghlatidx] ] );
    let angle = GH_UNIT_ARRAY[ghfrontdiridx];
    var frontmax = 0;
    var rightmax = 0;
    var leftmax = 0;
    var backmax = 0;

    let randx = 0;
    let randy = 0;
    let ratio = 0;
    let speedintervaldistance = GH_UNIT_ARRAY[ghvelocityidx] * interval;

    for ( var i =0;i<nodecnt;i++ ) {
	let idx = i*GH_NODE_ELEMS;
	let ip = null;
	if ( form == 0 || form == 1 || form == 2 ) {
	    ip = ghCalcLineFormation(i,formlines,xcenter,ycenter,randx,randy);
	} else if ( form == 3 ) {
	    ip = ghCalcArcTransformFormation(i,formlines,xcenter,ycenter,-1.41421*xcenter,0.0,0.7071*xcenter,xcenter,randx,randy);
	} else if ( form == 4 ) {
	    ip = ghCalcLinerTransformFormation(i,formlines,xcenter,ycenter,0.7*xcenter,-0.2*xcenter,randx,randy);
	} else {
	    // NOP
	    ip = ghCalcLineFormation(i,formlines,xcenter,ycenter,randx,randy);
	}
	let fpoint = turf.destination.default(center, ip.radius, ip.theta + angle , { units: 'meters'});

	if ( ghPointInNeighborFeature(fpoint) ) {
	    // Nextpoint collision
	    // move toward center marker
	    let nodep = turf.helpers.point( [ GH_NODE_ARRAY[idx+3], GH_NODE_ARRAY[idx+4] ] );
	    let nangle = turf.bearing.default(nodep, center);
	    fpoint = turf.destination.default(nodep, ip.radius/2.0, nangle, { units: 'meters'});
	} else {
	    // NOP
	}

	let fpt = turf.invariant.getCoord(fpoint);
	let fnode = new Cesium.Cartesian3.fromDegrees(fpt[0],fpt[1]);
	let cnode = new Cesium.Cartesian3.fromElements( GH_NODE_ARRAY[idx],GH_NODE_ARRAY[idx+1],GH_NODE_ARRAY[idx+2]);
	let distance = Cesium.Cartesian3.distance(cnode,fnode); // [m]
	if ( firstratio > 0 ) {
	    ratio = firstratio;
	} else {
	    if ( distance > GH_NODE_SKIP_DISTANCE ) {
		ratio = 1.0;
	    } else {
		if ( speedintervaldistance < distance ) {
		    ratio = speedintervaldistance / distance;
		} else {
		    ratio = 1.0;
		}
	    }
	}
	let nextpoint = new Cesium.Cartesian3.lerp(cnode, fnode, ratio, new Cesium.Cartesian3());

	GH_NODE_ARRAY[idx] = nextpoint.x;
	GH_NODE_ARRAY[idx+1] = nextpoint.y;
	GH_NODE_ARRAY[idx+2] = nextpoint.z;
	var cartographic = Cesium.Cartographic.fromCartesian(nextpoint);
	GH_NODE_ARRAY[idx+3] = cartographic.longitude * GH_RADIAN2DEGREE;// Degree
	GH_NODE_ARRAY[idx+4] = cartographic.latitude * GH_RADIAN2DEGREE;// Degree

	if ( ip.yval > frontmax ) frontmax = ip.yval;
	if ( ip.xval > rightmax ) rightmax = ip.xval;
	if ( ip.xval < leftmax ) leftmax = ip.xval;
	if ( ip.yval < backmax ) backmax = ip.yval;
    }

//    GH_UNIT_ARRAY[ghfrontsizeidx] = frontmax ;
//    GH_UNIT_ARRAY[ghrightsizeidx] = rightmax ;
//    GH_UNIT_ARRAY[ghleftsizeidx] = leftmax ;
//    GH_UNIT_ARRAY[ghbacksizeidx] = backmax ;
    GH_UNIT_ARRAY[ghformationsizeidx] = ghEmakiFormationSizeSet(
	GH_UNIT_ARRAY[ghformationsizeidx],
	[ frontmax, backmax, rightmax, leftmax ],
	GH_FORMATIONSIZE_ALL_DIGIT);
    
    
}


function ghBroadcastChannelSetMyKeyDelay() {
    if ( GH_2DBROAD.isChannelConnected() ) {
	GH_2DBROAD.sendMessage('GH_SETMYKEY','primary',GH_UNIT.id);
    } else {
	setTimeout(ghBroadcastChannelSetMyKeyDelay,5000);
    }
}


function _ExtractFieldFeatures(geojson,cnt) {
    if( geojson.geometry.type == 'Polygon' ) {
	GH_FIELD_FEATURES[cnt].push( geojson );
    } else if ( geojson.geometry.type == 'MultiPolygon' ) {
	turf.meta.flattenEach(geojson, function (feature) {
	    if( feature.geometry.type == 'Polygon' ) {
		GH_FIELD_FEATURES[cnt].push(feature);
	    }
	});
    } else {
	// NOP
    }
}
function _ExtractStructFeatures(geojson,cnt) {
    if( geojson.geometry.type == 'Polygon' ) {
	GH_STRUCT_FEATURES[cnt].push( geojson );
    } else if ( geojson.geometry.type == 'MultiPolygon' ) {
	turf.meta.flattenEach(geojson, function (feature) {
	    if( feature.geometry.type == 'Polygon' ) {
		GH_STRUCT_FEATURES[cnt].push(feature);
	    }
	});
    } else {
	// NOP
    }
}

function _loadExternalFile(uri,type,cnt)  {

    let xhr = new XMLHttpRequest();
    xhr.open('GET', uri , true);
    xhr.responseType = 'json';
    xhr.onload = function() {
	if (this.status == 200) {
	    let data = this.response;
	    if ( type == 'fieldgeometry' ) {
		if ( data.type == "FeatureCollection" )  {
		    for ( var i=0,len=data.features.length;i<len;i++ ) {
			_ExtractFieldFeatures(data.features[i],cnt);
		    }
		} else {
		    _ExtractFieldFeatures(data,cnt);
		}
	    } else if ( type == 'structgeometry' ) {
		if ( data.type == "FeatureCollection" )  {
		    for ( var i=0,len=data.features.length;i<len;i++ ) {
			_ExtractStructFeatures(data.features[i],cnt);
		    }
		} else {
		    _ExtractStructFeatures(data,cnt);
		}
		// array last index is Border Feature , Correct Here ??
		GH_STRUCT_FEATURES[cnt].push( turf.convex.default( turf.explode.default(data) ) );
	    } else {
		// NOP
	    }
        } else if (this.status == 400 ) {
	    // invalid request 400  No data such zoom level
            console.log("Probably there is no file. 400 error : " + this.statusText);
        } else if (this.status == 404 ) {
            // Not Found 404            
            console.log("404 error : " + this.statusText);
	} else if (this.status == 500  ) {
	    // "Failed to load resource: the server responded with a status of 500 (INTERNAL SERVER ERROR)"
            // internal server error 500
            console.log("500 error : " + this.statusText);
	} else {
	    
	    console.log("Unknown error : " + uri + " " + this.statusText);
	};
	
    }
    xhr.send();
    
}


/////////////////////////////////////////////
function ghCreateNeighborFeature(world,type,cnt,bboxCircle,bbox) {

    let ilen=world.length;
    if ( type == 'structure' ) {
	ilen = ilen - 1;
	// structure last index is Border Feature
    }
    for ( var i =0;i<ilen;i++ ) {
	if ( world[i] == null ) {
	    // NOP
	} else {
	    if ( turf.booleanOverlap.default(world[i],bboxCircle) ) {
		if ( type == 'structure' ) {
		    GH_NEIGHBOR.structure.push( turf.bboxClip.default(world[i],bbox) );
		    GH_NEIGHBOR.structureidx.push( cnt ) ;
		} else if ( type == 'field' ) {
		    GH_NEIGHBOR.field.push( turf.bboxClip.default(world[i],bbox) );
		    GH_NEIGHBOR.fieldidx.push( cnt ) ;
		} else {
		    // NOP
		}
	    } else {
		if ( turf.booleanContains.default(bboxCircle,world[i]) ) {
		    if ( type == 'structure' ) {
			GH_NEIGHBOR.structure.push( world[i] );
			GH_NEIGHBOR.structureidx.push( cnt ) ;
		    } else if ( type == 'field' ) {
			GH_NEIGHBOR.field.push( world[i] );
			GH_NEIGHBOR.fieldidx.push( cnt ) ;
		    } else {
			// NOP
		    }
		}
	    }
	}
    }
    if ( type == 'structure' ) {
	// Check structure Border Feature
	if ( world[ilen] ) {
	    if ( turf.booleanOverlap.default(world[ilen],bboxCircle) ) {
		GH_NEIGHBOR.border.push ( turf.bboxClip.default(world[ilen],bbox) );
		GH_NEIGHBOR.borderidx.push ( cnt );
	    } else {
		if ( turf.booleanContains.default(bboxCircle,world[ilen]) ) {
		    GH_NEIGHBOR.border.push ( world[ilen] );
		    GH_NEIGHBOR.borderidx.push ( cnt );
		}
	    }
	}
    } else {
	// NOP
	return;
    }
}
function ghUpdateNeighborFeature() {
    let currentcenter = turf.helpers.point( [ GH_UNIT_ARRAY[ghlngidx], GH_UNIT_ARRAY[ghlatidx] ] );
    let circle = turf.circle.default(currentcenter,GH_NEIGHBOR.areasize,{ steps : 16, units: 'meters'});
    let bbox = turf.bbox.default( circle );
    if ( GH_NEIGHBOR.center == null ) {
	for (var i=0,len=GH_STRUCT_FEATURES.length; i <len ; i++) {
	    ghCreateNeighborFeature(GH_STRUCT_FEATURES[i],'structure',i,circle,bbox);
	}
	for (var i=0,len=GH_FIELD_FEATURES.length; i <len ; i++) {
	    ghCreateNeighborFeature(GH_FIELD_FEATURES[i],'field',i,circle,bbox);
	}
	GH_NEIGHBOR.elapsedtime = GH_CLOCK.getElapsed();
	GH_NEIGHBOR.center = currentcenter;
    } else {
	let d = turf.distance.default(currentcenter,GH_NEIGHBOR.center,{units: 'meters'}) ; // [m]
	if (  d > GH_NEIGHBOR.updatedistance ) {
	    for (var i=0,len=GH_STRUCT_FEATURES.length; i <len ; i++) {
		ghCreateNeighborFeature(GH_STRUCT_FEATURES[i],'structure',i,circle,bbox);
	    }
	    for (var i=0,len=GH_FIELD_FEATURES.length; i <len ; i++) {
		ghCreateNeighborFeature(GH_FIELD_FEATURES[i],'field',i,circle,bbox);
	    }
	    GH_NEIGHBOR.elapsedtime = GH_CLOCK.getElapsed();
	    GH_NEIGHBOR.center = currentcenter;
	} else {
	    // Not update obstacle features
	}
    }
}

function ghPointInNeighborFeature(point) {
    for (var i=0,len=GH_NEIGHBOR.structure.length; i <len ; i++) {
	if ( turf.booleanPointInPolygon.default(point, GH_NEIGHBOR.structure[i],{ignoreBoundary:true}) ) {
	    return true;
	} else {
	    // NOP
	}
    }
    for (var i = 0,len=GH_NEIGHBOR.field.length;i<len; i++) {
	let propkey = GH_NEIGHBOR.fieldidx[i];
	if ( GH_FIELD[propkey].keepout ) {
	    if ( turf.booleanPointInPolygon.default(point, GH_NEIGHBOR.field[i],{ignoreBoundary:true}) ) {
		return true;
	    } else {
		// NOP
	    }
	}
    }
    return false;

}


//////////////////////////////////////////
//
//    Message Handler
//
//////////////////////////////////////////

self.addEventListener('message', function(e) {
    var data = e.data;
    var command = data.cmd;


    if ( command == "initialize") {

	GH_UNIT.id = data.value.id;
	GH_UNIT.corps  = data.value.corps;
	GH_UNIT.hostility  = data.value.hostility;
	GH_CLOCK = new EmakiClock('Unit Worker Timer',data.value.starttime);
	
	// Parameter Type Check
	GH_UNIT.ability.leadership = parseFloat(data.value.ability.leadership);
	GH_UNIT.ability.attack = parseFloat(data.value.ability.attack);
	GH_UNIT.ability.defense = parseFloat(data.value.ability.defense);
	GH_UNIT.ability.searching = parseFloat(data.value.ability.searching);
	// 30 %  MAX ( luck ratio )
	GH_UNIT.ability.luck = parseFloat(data.value.ability.luck) * 0.3;
	//GH_ATTACK_DAMAGE_PER_NODES = parseFloat(data.value.damagepernodes);

	GH_NODE_DISTANCE_METER = parseFloat(data.value.nodedistance);
	
	// Shared Array
	GH_INIT_NODE_LENGTH = parseInt(data.value.nodes,10);
	GH_NODE_BUFFER = data.value.nodesbuffer;
	GH_NODE_ELEMS = parseInt(data.value.nodeselems,10);
	GH_NODE_BYTES = parseInt(data.value.nodesbytes,10);
        GH_NODE_ARRAY = new Float64Array(GH_NODE_BUFFER);

	GH_UNIT_BUFFER = data.value.unitbuffer;
	GH_UNIT_ELEMS = parseInt(data.value.unitelems,10);
	GH_UNIT_BYTES = parseInt(data.value.unitbytes,10);
        GH_UNIT_ARRAY = new Float64Array(GH_UNIT_BUFFER);

	// Check Node count 
	if ( GH_INIT_NODE_LENGTH == GH_UNIT_ARRAY[ghnodesidx]  ) {
	    _SendMessage('sharedbuffer','OK');
	} else {
	    _SendMessage('sharedbuffer','wrong');
	}

	/////////////////////////
	//
	GH_2DBROAD = new EmakiBroadcast('2dbroad',GH_UNIT.id,'secondary',ghEmakiReceiveMessage);
	GH_2DBROAD.initPrimaryConnection();
	ghBroadcastChannelSetMyKeyDelay();

	_SendMessage('initialize','OK');

    } else if ( command == "sharedunits") {
	GH_SHAREDUNITS = data.value;
	for ( var key in GH_SHAREDUNITS ) {
	    if ( key != GH_UNIT.id ) {
		GH_SHAREDUNITS[key].defense = parseFloat(GH_SHAREDUNITS[key].defense);
		GH_SHAREDUNITS[key].nodes = parseFloat(GH_SHAREDUNITS[key].nodes);
		GH_SHAREDUNITS[key].unitarray = new Float64Array(GH_SHAREDUNITS[key].unitbuffer);
		GH_SHAREDUNITS[key].nodearray = new Float64Array(GH_SHAREDUNITS[key].nodebuffer);
	    } else {
		// NOP
		// Own data
	    }
	}
	_SendMessage('Shared Units','OK');
    } else if ( command == "structure") {
	for ( var i =0;i<data.value.length;i++ ) {
	    let d = {
		"name" : data.value[i].name,
		"owner" : data.value[i].owner,
		"endurance"  : data.value[i].endurance,
		"latlng" : data.value[i].latlng,
		"geometry" : data.value[i].geometry
	    }
	    let stf = [];
	    if( typeof d.geometry === 'string'){
		let uri = ghEmakiUtilGetResourceURI(GH_RSC_GEOJSON, d.geometry );
		_loadExternalFile(uri,'structgeometry',i);
	    } else if ( Array.isArray(d.geometry) ) {
		//for ( var j=0,jlen=d.geometry.length;j<jlen;j++ ) {
		//    let uri = ghEmakiUtilGetResourceURI(GH_RSC_GEOJSON, d.geometry[j] );
		//    _loadExternalFile(uri,'structgeometry',i);
		//}
		// NOP
	    } else if ( typeof d.geometry === 'number'){
		let radius = parseFloat(d.geometry);
		let center = turf.helpers.point( [ d.latlng[1], d.latlng[0] ] );
		stf.push( turf.circle.default(center,radius,{ steps : 8, units: 'meters'}) );
	    } else {
		// NOP
	    }
	    GH_STRUCT.push ( d );
	    GH_STRUCT_FEATURES.push ( stf );
	}
    } else if ( command == "field") {
	for ( var i =0;i<data.value.length;i++ ) {
	    let d = {
		"style" : data.value[i].style,
		"keepout" : data.value[i].keepout,
		"speedratio"  : data.value[i].speedratio,
		"attackratio" : data.value[i].attackratio,
		"defenseratio" : data.value[i].defenseratio,
		"fatigueratio" : data.value[i].fatigueratio,
		"geometry" : data.value[i].geometry
	    }
	    if( typeof d.geometry === 'string'){
		let uri = ghEmakiUtilGetResourceURI(GH_RSC_GEOJSON, d.geometry );
		_loadExternalFile(uri,'fieldgeometry',i);
	    } else if ( Array.isArray(d.geometry) ) {
		for ( var j=0,jlen=d.geometry.length;j<jlen;j++ ) {
		    let uri = ghEmakiUtilGetResourceURI(GH_RSC_GEOJSON, d.geometry[j] );
		    _loadExternalFile(uri,'fieldgeometry',i);
		}
	    } else {
		// NOP
	    }
	    GH_FIELD.push ( d );
	    GH_FIELD_FEATURES.push ( [] );
	}
    } else if ( command == "playpause") {
	let v = parseFloat(data.value.elapsed);
	if ( v >= GH_CURRENT_ELAPSED ) {
	    GH_IS_PLAYING = data.value.isplaying;
	    if ( GH_IS_PLAYING ) {
		GH_CLOCK.play();
		_SendMessage('playpause','playing');
	    } else {
		GH_CLOCK.pause();
		_SendMessage('playpause','paused');
	    }
	    GH_CURRENT_ELAPSED = v;
	} else {
	    let res = "wrong elapsed scene "  + v + " " +  GH_CURRENT_ELAPSED;
	    console.log(res);
	}
    } else if ( command == "simulationspeed") {
	let v = parseFloat(data.value.elapsed);
	if ( v >= GH_CURRENT_ELAPSED ) {
	    GH_CLOCK.setSpeed( parseFloat(data.value.speed) );
	    GH_CURRENT_ELAPSED = v;
	    _SendMessage('Simulation speed','OK');
	} else {
	    let res = "wrong elapsed speed "  + v + " " +  GH_CURRENT_ELAPSED;
	    console.log(res);
	}
    } else {
        // NOP
    }
});
