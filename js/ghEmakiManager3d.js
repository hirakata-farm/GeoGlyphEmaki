//
//
//
//    Emaki Manager 3D
//
//    require Cesiumjs
//
//


var GH_UNITS = {};
var GH_CLOCK = null;

var GH_STRUCTURE = {};
var GH_STRUCTURE_ARY = [];

var GH_FIELD = {};
var GH_FIELD_ARY = [];



function EmakiManager(json) {

    if ( json == null ) return;


    let isplaying = false;
    let initcartesian = null;

    //////////////////////////////////
    //
    // Private method
    //



    ///////////////////////////////////////
    // 
    //  External Method
    //
    this.setLookatPosition = function(view,key) {
	if ( key == null ) {
	    var heading = Cesium.Math.toRadians(0.0);
	    var pitch = Cesium.Math.toRadians(-70.0);
	    var range = 2700.0;
	    view.camera.lookAt(initcartesian, new Cesium.HeadingPitchRange(heading, pitch, range));
	} else {
	    if ( ! GH_UNITS[key] ) {
		//map.panTo( GH_UNITS[key].getMarkerPosition() )
	    }
	}
    }
    
    this.setCurrentUnitStatus = function(units) {
	for(var key in units ){
	    GH_UNITS[key].setStatus(  units[key].status , GH_STATUS_RAW_DIGIT );
	    GH_UNITS[key].setLatLng(  units[key].latlng );
	    GH_UNITS[key].setFrontDirection(  units[key].direction );
	    GH_UNITS[key].setNodes(  units[key].nodes );
	    GH_UNITS[key].initNodesModel();
	}
    }
    this.changePlayPause = function(flag) {
	if ( flag ) {
	    GH_CLOCK.play();
	} else {
	    GH_CLOCK.pause();
	}
	for(var key in GH_UNITS){
	    GH_UNITS[key].changePlayPause({
		"isplaying" : flag,
		"elapsed" : GH_CLOCK.getElapsed()
	    });
	}
	isplaying = flag;
    }
    this.setSimulationSpeed = function(value) {
	GH_CLOCK.setSpeed(value);
	for(var key in GH_UNITS){
	    GH_UNITS[key].setSimulationSpeed({
		"speed" : value,
		"elapsed" : GH_CLOCK.getElapsed()
	    });
	}
    }
    this.add3DMap = function(view) {
	for(var key in GH_STRUCTURE){
	    GH_STRUCTURE[key].add3DMap(view);
	}
    }
    this.addCenterModel = function(view) {
	for(var key in GH_UNITS){
	    GH_UNITS[key].addCenterModel(view);
	}
    }
    this.addNodesModel = function(view) {
	for(var key in GH_UNITS){
	    GH_UNITS[key].addNodesModel(view);
	}
    }
    this.updateScene = function(scene,dt) {
	if ( isplaying ) {
	    for(var key in GH_UNITS){
		GH_UNITS[key].updateUnitModel();
		GH_UNITS[key].updateNodesModel();
	    }
	}
    }



    ////////////////////////
    //
    //
    //   Initialize
    //
    //
    //
    
    if ( json.scene.starttime ) {
	GH_CLOCK = new EmakiClock(json.scene.timestring,json.scene.starttime);
    }
    if ( json.scene.latlng ) {
	initcartesian = Cesium.Cartesian3.fromDegrees(
	    parseFloat(json.scene.latlng[1]),
	    parseFloat(json.scene.latlng[0])
	);
    }

    //
    //  Unit Data
    //
    var units = json.units;
    var unit_counter = 0;
    for(var key in units){
	GH_UNITS[key] = new EmakiUnit( key, unit_counter, units[key] , json.scene.starttime);
	unit_counter++;
    }

    //
    //  Shared Unit Data
    //
    var sharedunits = {};
    for(var key in GH_UNITS){
	var isgeneral = false;
	for(var ckey in json.corps){
	    if ( key == json.corps[ ckey ].general ) {
		isgeneral = true;
	    }
	}
	sharedunits[key] = {
	    "name" : GH_UNITS[key].getName(),
	    "corps" : GH_UNITS[key].getCorps(),
	    "general" : isgeneral,
	    "defense" : GH_UNITS[key].getAbility().defense,
	    "nodes" : GH_UNITS[key].getNodes(),
	    "unitbuffer" : GH_UNITS[key].getUnitArrayBuffer(),
	    "unitarray" : null,
	    "nodebuffer" : GH_UNITS[key].getNodeArrayBuffer(),
	    "nodearray" : null
	};
    }
    for(var key in GH_UNITS){
	GH_UNITS[key].initSharedUnits( sharedunits ) ;
    }

    //////////////////////////////////////
    //  Create World Map Data
    //
    //  Structure Data
    let stary = [];
    if ( json.map.structure == null  ) {
	// NOP
    } else {
	var mapdata = json.map.structure;
	var count = 0;
	for(var key in mapdata ){
	    GH_STRUCTURE[key] = new EmakiStructure( key, count, mapdata[key] , 0 );
	    GH_STRUCTURE_ARY.push(key);
	    count++;
	}
	for ( let i=0,len=GH_STRUCTURE_ARY.length;i<len;i++ ) {
	    var key = GH_STRUCTURE_ARY[i];
	    let u = {
		"feature" : GH_STRUCTURE[key].getFeature(),
		"border" : GH_STRUCTURE[key].getBorderFeature()
	    }
	    stary.push ( u );
	}
    }
    
    //  Fields Data
    let fdary = [];
    if ( json.map.field == null  ) {
	// NOP
    } else {
	var mapdata = json.map.field;
	var count = 0;
	for(var key in mapdata ){
	    GH_FIELD[key] = new EmakiField( key, count, mapdata[key]);
	    GH_FIELD_ARY.push(key);
	    count++;
	}
	for ( let i=0,len=GH_FIELD_ARY.length;i<len;i++ ) {
	    var key = GH_FIELD_ARY[i];
	    fdary.push ( mapdata[key] );
	}
    }

    for(var key in GH_UNITS){
	if ( stary.length > 0 ) GH_UNITS[key].setStructure(stary);
	if ( fdary.length > 0 ) GH_UNITS[key].setField(fdary);
    }

    
}

