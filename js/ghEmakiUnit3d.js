//
//
//
//
//
//
//

//const GH_BROAD_WORKER_URI = '../js/ghEmakiUnit3dBroadWorker.js';
const GH_UNIT_WORKER_URI = '../js/ghEmakiUnit3dSimWorker.js';

var GH_ENTITY_URI = [
    "geoSamuraiAshigaruWalkRed.glb",
    "geoSamuraiAshigaruWalkYellow.glb",
    "geoSamuraiAshigaruWalkBlue.glb"
];
    
var GH_ENTITY_URI_OLD = [
    {
        "command" : {
            "idle" : "geoSamuraiCommandIdleRed.glb",
            "walk" : "geoSamuraiCommandWalkRed.glb",
            "attack" : "geoSamuraiCommandAttackRed.glb"
        },
        "ashigaru" : {
            "idle" : "geoSamuraiAshigaruIdleRed.glb",
            "walk" : "geoSamuraiAshigaruWalkRed.glb",
            "attack" : "geoSamuraiAshigaruAttackRed.glb"            
        }
    },
    {
        "command" : {
            "idle" : "geoSamuraiCommandIdleYellow.glb",
            "walk" : "geoSamuraiCommandWalkYellow.glb",
            "attack" : "geoSamuraiCommandAttackYellow.glb"
        },
        "ashigaru" : {
            "idle" : "geoSamuraiAshigaruIdleYellow.glb",
            "walk" : "geoSamuraiAshigaruWalkYellow.glb",
            "attack" : "geoSamuraiAshigaruAttackYellow.glb"            
        }
    },
    {
        "command" : {
            "idle" : "geoSamuraiCommandIdleBlue.glb",
            "walk" : "geoSamuraiCommandWalkBlue.glb",
            "attack" : "geoSamuraiCommandAttackBlue.glb"
        },
        "ashigaru" : {
            "idle" : "geoSamuraiAshigaruIdleBlue.glb",
            "walk" : "geoSamuraiAshigaruWalkBlue.glb",
            "attack" : "geoSamuraiAshigaruAttackBlue.glb"            
        }
    } 
];

const GH_ENTITY_NODE_SCALE = 0.7;

//////////////////////////////////////////////////////////////////////////////////
function EmakiUnit(unitkey,idx,json,starttime) {

    let modelidx = idx % GH_ENTITY_URI.length;


    ////////////////////////
    // Variables
    
    let myid = null;
    let name = null;
    let corps = null;
    let description = null;
    let hostility = [];
    let ability = {
	"leadership" : 0,
	"attack" : 0,
	"defense" : 0,
	"searching" : 0,
	"luck" : 0,
	"speed" : {
	    "max" : 6,
	    "normal" : 4
	}
    };
//	    "current" : 4,
//	    "fatiguecoeff" : 1

    let stime = starttime;

    let unitarraybuffer = null;
    let unitarray = null;

    let nodearraybuffer = null;
    let nodearray = null;

    let sharedunits = {};    // Shared Memory unit data
    
    //  Thread Worker
    let unitworker = null;  // Thread for calculate position

    let entity = {
	"centeruri" : null,
	"centerobj" : null,
     	"center" : null,
	"nodeuri" : null,
	"nodeobj" : null,
	"nodes" : []
    };

    var initdata = {
	"strength" : 0,
	"distance" : 3,
	"cartesian" : null,
	"cartographic" : null,	
	"ration" : 0,
	"bullet" : 0
    };
    var model = {
	"uri":null,
	"scale":0.7,
	"rotx":90,
	"roty":0,
	"flag":"default.gif",
	"flagwidth" : 52,
	"flagheight" : 16
    };

    let prevnodes = parseFloat(json.initialize.nodes);

    //////////////////////////////////
    //
    // Private method
    //
    var _InitData = function(data,node,stock) {
	initdata.strength = ghEmakiUtilGetNumberInRange(node.strength,1,1000000);
	initdata.distance = ghEmakiUtilGetNumberInRange(node.distance,1,1000);	
	initdata.cartesian = Cesium.Cartesian3.fromDegrees(data.latlng[1], data.latlng[0]);
	initdata.cartographic = Cesium.Cartographic.fromDegrees(data.latlng[1], data.latlng[0]);
	initdata.ration = ghEmakiUtilGetNumberInRange(stock.ration,0,10000000);
	initdata.bullet = ghEmakiUtilGetNumberInRange(stock.bullet,0,10000000);	
    }
    var _InitAbility = function(data) {
	if ( data.leadership ) {
	    ability.leadership = ghEmakiUtilGetNumberInRange(data.leadership,1,100);
	}
	if ( data.attack ) {
	    ability.attack = ghEmakiUtilGetNumberInRange(data.attack,1,100);
	}
	if ( data.defense ) {
	    ability.defense = ghEmakiUtilGetNumberInRange(data.defense,1,100);
	}
	if ( data.searching ) {
	    ability.searching = ghEmakiUtilGetNumberInRange(data.searching,1,100);
	}
	if ( data.luck ) {
	    ability.luck = ghEmakiUtilGetNumberInRange(data.luck,1,100);
	}
	if ( data.speed ) {
	    // Unit Conversion in Unit2dSimWorker
	    // [km/h] -> [m/mili-sec]
	    if ( data.speed.max ) {
		ability.speed.max = ghEmakiUtilGetNumberInRange(data.speed.max,1,1000);
	    }
	    if ( data.speed.normal ) {
		ability.speed.normal = ghEmakiUtilGetNumberInRange(data.speed.normal,1,1000);
	    }
	}

    }

    var _CalcQuaternion = function(pos,dir) {
        let heading = Cesium.Math.toRadians(dir);
        let hpRoll = new Cesium.HeadingPitchRoll(heading,0.0,0.0);  
        return Cesium.Transforms.headingPitchRollQuaternion(pos,hpRoll); 
    }
    var _GetCurrentCartesian = function() {
        return new Cesium.Cartesian3.fromElements(
	    unitarray[ghcartesianx],
	    unitarray[ghcartesiany],
	    unitarray[ghcartesianz]);
    }
    var _GetCurrentQuaternion = function() {
        return new Cesium.Quaternion(
	    unitarray[ghquaternionx],
	    unitarray[ghquaterniony],
	    unitarray[ghquaternionz],
	    unitarray[ghquaternionw]);
    }
    var _SetupCenterModel = function(data) {
	if ( data.model ) {
	    let f = ghEmakiUtilGetResourceURI(GH_RSC_FACEICON,data.marker.image);
	    let fw = data.marker.width;
	    let fh = data.marker.height;
	    entity.centerobj = {
		name: name,
		description: description,
		position : initdata.cartesian,
		billboard : {
		    image :  f,
		    show : true,
		    pixelOffset : new Cesium.Cartesian2(0, 0),
		    eyeOffset : new Cesium.Cartesian3(0.0, fh/2.0, 0.0),
		    horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
		    verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
		    scale : 1.0,
		    color : new Cesium.Color(1.0,1.0,1.0,0.7),
		    rotation : 0.0,
		    alignedAxis : Cesium.Cartesian3.ZERO,
		    heightReference : Cesium.HeightReference.RELATIVE_TO_GROUND,
		    width : fw,
		    height : fh
		}       
	    }
	}
    }
    var _SetupNodesModel = function(data) {
	let model = null;
	if ( data.model.uri == null ) {
	    // Default Model
	    model = ghEmakiUtilGetResourceURI(GH_RSC_MODELS,GH_ENTITY_URI[modelidx]);
	} else {
	    model = ghEmakiUtilGetResourceURI(GH_RSC_MODELS,data.model.uri);
	}
	entity.nodeobj = {
	    name : name,
	    description: description,
	    position : initdata.cartesian,
	    model : {
		uri : model,
		minimumPixelSize : 8,
		scale : data.model.scale * GH_ENTITY_NODE_SCALE,
		heightReference : Cesium.HeightReference.CLAMP_TO_GROUND,
		distanceDisplayCondition : new Cesium.DistanceDisplayCondition(0.0, GH_MODEL_DISPLAY_DISTANCE )
	    }
	};
    }
    var _InitNodesModel = function(num) {
	let idx = 0;
	for ( var i =0;i<num;i++ ) {
	    idx = i * ghnode3delems; // important
	    nodearray[idx] = initdata.cartesian.x;
	    nodearray[idx+1] = initdata.cartesian.y;
	    nodearray[idx+2] = initdata.cartesian.z;
	    nodearray[idx+3] = initdata.cartographic.longitude;  // Radian
	    nodearray[idx+4] = initdata.cartographic.latitude;   // Radian
	}
    }
    var _SetupSharedArray = function() {
	if(window.SharedArrayBuffer){
	    let length = initdata.strength;
	    try{
		nodearraybuffer = new SharedArrayBuffer(ghnode3dbytes * length);
		nodearray = new Float64Array(nodearraybuffer);
		unitarraybuffer = new SharedArrayBuffer(ghunit3dbytes);
		unitarray = new Float64Array(unitarraybuffer);
	    }catch(e){
		console.log("Failed Node Shared Memory allocate ");
	    }
	} else {
            alert("Cannot work property for disable shared array setting");
	    console.log("Shared Array API Not supported ");
	}
    }
    var _GetStatus = function(type) {
	let a = unitarray[ghstatusidx];
	return ghEmakiStatusGet(a,type);
    }
    var _SetStatus = function(value,type) {
	let a = unitarray[ghstatusidx];
	unitarray[ghstatusidx] = ghEmakiStatusSet(a,value,type);
    }
    var _GetNodes = function() {
	return unitarray[ghnodesidx];
    }
    var _UnitWorkerReceive = function(command,corps,unit,data){
	let txt = "receive " + corps + " " + unit + " " + command;
	console.log(txt);
	//  NOP
    }
    var _SetupUnitWorker = function(){
	if (window.Worker){
            if ( unitworker == null ) {
		unitworker = new Worker(GH_UNIT_WORKER_URI);
		unitworker.addEventListener('message', function(event) {
                    var ret = event.data;
		    _UnitWorkerReceive(ret.cmd, ret.corps, ret.unit, ret.value);
		});
		unitworker.addEventListener('error', function(err) {
                    console.error(err);
		});
            }
	} else {
            unitworker = null;
	    console.log('Not support Web Workers');	
	}
    }
    var _CloseUnitWorker = function(){
	if ( unitworker != null ) {
            unitworker.terminate();
            unitworker = null;
	}
    }
    var _SendUnitWorker = function(command,data) {
	if ( unitworker != null ) {
	    unitworker.postMessage({
		"cmd": command,
		"value": data });
	}
    }

    ///////////////////////////////////////
    // 
    //  External Method
    //
    this.getName = function() {
	return name;
    }
    this.getCorps = function() {
	return corps;
    }
    this.getAbility = function() {
	return ability;
    }
    this.getStatus = function(type) {
	if ( typeof type == 'undefined' || type == null ) {
	    return _GetStatus(GH_STATUS_MOVE_DIGIT);
	} else {
	    return _GetStatus(type);
	}
    }
    this.setStatus = function(value,type) {
	if ( typeof type == 'undefined' || type == null ) {
	    _SetStatus(value,GH_STATUS_MOVE_DIGIT);
	} else {
	    _SetStatus(value,type);
	}
    }
    this.getNodes = function() {
	return Math.floor(_GetNodes());
    }
    this.setNodes = function(num) {
	if ( isNaN(num) ) {
	    unitarray[ghnodesidx] = initdata.nodes;
	} else {
	    unitarray[ghnodesidx] = num;
	}
    }
    this.setFormation = function(num) {
	if ( isNaN(num) ) {
	    unitarray[ghformationidx] = 0; // default 0
	} else {
	    unitarray[ghformationidx] = num;
	}
    }
    this.getUnitArrayBuffer = function() {
	return unitarraybuffer;
    }
    this.getNodeArrayBuffer = function() {
	return nodearraybuffer;
    }
    this.initSharedUnits = function(array) {
	sharedunits = array;
	_SendUnitWorker('sharedunits',sharedunits);
    }
    this.setLatLng = function(latlng) {
	if ( latlng == null ) return;
	unitarray[ghlatidx] = latlng.lat;
	unitarray[ghlngidx] = latlng.lng;
	let c = Cesium.Cartesian3.fromDegrees(latlng.lng, latlng.lat);
	unitarray[ghcartesianx] = c.x;
	unitarray[ghcartesiany] = c.y;
	unitarray[ghcartesianz] = c.z;
    }
    this.setFrontDirection = function(dir) {
	if ( dir == null ) return;
	unitarray[ghfrontdiridx] = dir;
	let q = _CalcQuaternion( _GetCurrentCartesian() ,dir);
	unitarray[ghquaternionx] = q.x;
	unitarray[ghquaterniony] = q.y;
	unitarray[ghquaternionz] = q.z;
	unitarray[ghquaternionw] = q.w;
    }
    this.setStructure = function(ary) {
	_SendUnitWorker('structure',ary);
    }
    this.setField = function(ary) {
	_SendUnitWorker('field',ary);
    }
    this.addCenterModel = function(view) {
	entity.center = view.entities.add(entity.centerobj);
    }
    this.addNodesModel = function(view) {
	let num = _GetNodes();
	for ( var i =0;i<num;i++ ) {
	    entity.nodes.push( view.entities.add(entity.nodeobj) );
	}		
    }
    this.removeCenterModel = function(view) {

    }
    this.removeNodesModel = function(view) {

    }
    this.changePlayPause = function(data) {
	_SendUnitWorker('playpause',data);
    }
    this.setSimulationSpeed = function(data) {
	_SendUnitWorker('simulationspeed',data);
    }

    /////////////////////  
    //  Marker
    //
    this.updateUnitModel = function() {
	let status = _GetStatus(GH_STATUS_MOVE_DIGIT);
	if ( status < GH_STATUS_WAIT ) {
	    entity.center.show = false;
	} else {
            entity.center.position = _GetCurrentCartesian();
            entity.center.orientation = _GetCurrentQuaternion();
	}
    }

    /////////////////////  
    //  Nodes
    //
    this.initNodesModel = function() {
	_InitNodesModel( unitarray[ghnodesidx] );
    }
    this.updateNodesModel = function() {
        //ent.position = pos;
        //ent.orientation = q;
	let status = _GetStatus(GH_STATUS_MOVE_DIGIT);
	let nodes = _GetNodes();
        let qua = _GetCurrentQuaternion();

	if ( prevnodes > nodes ) {
	    // remove nodes
	    for ( var k =nodes;k<prevnodes;k++ ) {
		if ( entity.nodes[k] != null ) {
		    entity.nodes[k].show = false;
		}
	    }
	    prevnodes = nodes;
	}
	let idx = 0;
	for ( var i =0;i<nodes;i++ ) {
	    if ( entity.nodes[i] != null ) {
		if ( status < GH_STATUS_WAIT ) {
		    entity.nodes[i].show = false;
		} else {
		    idx = i * ghnode3delems; // important
		    entity.nodes[i].position = new Cesium.Cartesian3.fromElements(nodearray[idx],nodearray[idx+1],nodearray[idx+2]);
		    entity.nodes[i].orientation = qua;
		}
	    } else {
		console.log(property.name + " Wrong nodes " + i ) ;
	    }
	}

    }


    
    ///////////////////////////////////////
    // 
    // Initialize
    //
    ////////////////////////
    // Initialize
    myid = unitkey;
    name = json.name;
    corps = json.corps;
    description = json.description;
    hostility = json.hostility;
    
    _InitAbility(json.ability);
    _InitData(json.initialize,json.node,json.stock);
    _SetupCenterModel(json.node);
    _SetupNodesModel(json.node);
    _SetupSharedArray();

    _SetupUnitWorker();
    _SendUnitWorker('initialize',{
	"id" : myid,
	"corps" : corps,
	"hostility" : hostility,
	"ability" : ability,
	"starttime" : stime,
	"nodes" : initdata.strength,
	"nodedistance" : initdata.distance,
	"nodeselems" : ghnode3delems,
	"nodesbytes" : ghnode3dbytes,
	"nodesbuffer" : nodearraybuffer,
	"unitelems" : ghunit3delems,
	"unitbytes" : ghunit3dbytes,
	"unitbuffer" : unitarraybuffer
    });
    

}



////////////////////////////////////////////

