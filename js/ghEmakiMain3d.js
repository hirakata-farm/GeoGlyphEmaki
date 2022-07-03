//
//
//   Emaki 3d Main 
//
//   emaki3d.html
//     |- ghEmakiLang.js ( language )
//     |- ghEmakiStatus.js ( Unit Status function )
//     |- ghEmakiParams.js ( Unit Constant parameters  )
//     |- ghEmakiSharedArray.js ( Shared Array parameters  )
//     |- ghEmakiUtil.js ( Utility function  )
//     |- ghEmakiClock.js ( EmakiClock Class )
//     |- ghEmakiBroadcast.js ( EmakiBroadcast Class )
//     |- ghEmakiTerrain.js (  EmakiStructure EmakiFields Class )
//     |
//     |- ghEmakiManager3d.js (  EmakiManager Class )
//     |
//     |- ghEmakiUnit3d.js (  EmakiUnit Class )
//     |      |- ghEmakiUnit3dSimWorker.js  ( thread )
//     |              |- ghEmakiParams.js
//     |              |- ghEmakiUtil.js
//     |              |- ghEmakiSharedArray.js ( Shared Array parameters  )
//     |              |- ghEmakiClock.js
//     |              |- ghEmakiBroadcast.js ( EmakiBroadcast Class )
//     |              |- ghEmakiFormation.js
//     |              |- turfEmakiLib.min.js
//     |
//     |- ghEmakiMain3d.js ( main )
//
//
//
//

// Your access token can be found at: https://cesium.com/ion/tokens.
Cesium.Ion.defaultAccessToken = '___CESIUM_TOKEN___';

// https://github.com/CesiumGS/cesium/issues/8959
Cesium.ModelOutlineLoader.hasExtension = function() { return false; }

var GH_GAME_FILE = null;
var GH_GAME = null;

var GH_OSM = null;
var GH_VIEW = null;
var GH_3DTILE_OSMBUILDING = null;
var GH_C = null;
var GH_A = null;

var GH_MODEL_DISPLAY_DISTANCE = 800.0;
var GH_OBJECT_DISPLAY_DISTANCE = 3000.0;

var GH_IS_PLAYING = false;

var GH_LAST_TIME = 0;

var GH_2DVIEW = null;

var GH_EXPLOS = {};
var GH_EXPLOS_TIMEOUT = 20000; // 20 sec

function ghLoadHistoryData(){

    $.ajax({
	dataType: "json",
	url: GH_GAME_FILE
    }).done(function(data) {
	GH_GAME = new EmakiManager(data);
	GH_GAME.setLookatPosition(GH_VIEW,null);

	//  Set Cesium Home Position
	Cesium.Camera.DEFAULT_VIEW_RECTANGLE = GH_VIEW.camera.computeViewRectangle();  
	GH_GAME.add3DMap(GH_VIEW);
	
	setTimeout(ghBroadcastChannelGetUnitDelay,300);

    }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	var msg = "history data cannot load ";
	msg += " XMLHttpRequest " + XMLHttpRequest.status ;
	msg += " textStatus " + textStatus ;
	console.log( msg );
	//alert(GH_ERROR_MSG['traindatacannotload']);
    });

}

//
//
/////////////////////////////
//
//  Broadcast Channel Function
//
function ghEmakiReceiveMessage(data) {
    if (data.type == 'GH_GETDATA_ACK') {
	GH_GAME_FILE = data.value.datafile;
	ghLoadHistoryData();
    } else if (data.type == 'GH_GETCURRENTUNITDATA_ACK') {
	let unitdata = data.value.currentdata;
	//console.log(unitdata);
	if ( GH_GAME != null && unitdata != null ) {
	    GH_GAME.setCurrentUnitStatus(unitdata);
	    GH_2DVIEW.sendMessage('GH_GETCLOCK','primary','getclock');
	}
    } else if (data.type == 'GH_GETCLOCK_ACK') {
	GH_VIEW.clock.currentTime = new Cesium.JulianDate.fromDate( data.value.currenttime );
	ghSetSimulationSpeed(data.value.speed);
	GH_GAME.addCenterModel(GH_VIEW);
	GH_GAME.addNodesModel(GH_VIEW);
	ghSetAnimation(data.value.isplaying);	
    } else if (data.type == 'GH_PLAYSTATUS') {
	ghSetAnimation(data.value);	
    } else if (data.type == 'GH_SIMULATIONSPEED') {
	ghSetSimulationSpeed(data.value);
    } else if (data.type == 'GH_EXPLOSION') {
	let unit = data.value.unit;
	let lat = data.value.lat;
	let lng = data.value.lng;
	let pos = Cesium.Cartographic.fromDegrees(lng , lat);
	let alt = GH_VIEW.scene.globe.getHeight(pos);
	let position = Cesium.Cartesian3.fromDegrees(lng , lat , alt);
	if ( GH_EXPLOS[unit] ) {
	    // exist NOP
	} else {
	    GH_EXPLOS[unit] = ghCreateExplosion(position);
	    GH_VIEW.scene.primitives.add( GH_EXPLOS[unit] );
	    setTimeout(ghRemoveExplosion,GH_EXPLOS_TIMEOUT,unit);
	}
	
    } else {


    }

}
function ghBroadcastChannelGetUnitDelay() {
    GH_2DVIEW.sendMessage('GH_GETCURRENTUNITDATA','primary','getcurrentdata');
}
function ghBroadcastChannelGetDataDelay() {
    if ( GH_2DVIEW.isChannelConnected() ) {
	GH_2DVIEW.sendMessage('GH_GETDATA','primary','getdata');
    } else {
	setTimeout(ghBroadcastChannelGetDataDelay,5000);
    }
}


//
//
//
/////////////////////////////////////////////////
function ghSetSimulationSpeed(value) {
    if ( GH_VIEW == null ) return;
    let v = parseFloat(value);
    if ( isNaN(v) ) {
	v = 1.0;
    } 
    GH_VIEW.clock.multiplier = v;
    GH_GAME.setSimulationSpeed(v);
}

function ghSetAnimation(flag) {
    if ( GH_A == null ) return;
    if ( flag ) {
        GH_A.playForwardViewModel.command();
    } else {
        GH_A.pauseViewModel.command();
    }
    GH_GAME.changePlayPause(flag);
};   

function ghUpdateScene(scene,dt) {

    if ( GH_GAME != null ) {
	GH_GAME.updateScene(scene,dt);
    }

}

function ghRemoveExplosion(unit) {
    GH_VIEW.scene.primitives.remove( GH_EXPLOS[unit] );
    GH_EXPLOS[unit] = null;
}
function ghCreateExplosion(position) {
    // position cartesian3

    return new Cesium.ParticleSystem({
	image : '../images/smoke.png',

	startColor : Cesium.Color.RED.withAlpha(0.7),
	endColor : Cesium.Color.WHITE.withAlpha(0.0),

	loop : false,
	startScale : 1.0,
	endScale : 5.0,

	minimumParticleLife : 1.2,
	maximumParticleLife : 2.1,

	minimumSpeed : 1.0,
	maximumSpeed : 4.0,

	imageSize : new Cesium.Cartesian2(26, 26),

	emissionRate : 75,

	bursts : [
            // these burst will occasionally sync to create a multicolored effect
            new Cesium.ParticleBurst({time : 5.0, minimum : 10, maximum : 100}),
            new Cesium.ParticleBurst({time : 10.0, minimum : 50, maximum : 100}),
            new Cesium.ParticleBurst({time : 15.0, minimum : 200, maximum : 300})
	],
	lifetime : 16.0,
	emitter : new Cesium.CircleEmitter(2.0),
	modelMatrix : new Cesium.Matrix4.fromTranslation(position)
    });

}




////////////////////
///
///
// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.

function ghInitCesium() {

    GH_OSM = new Cesium.OpenStreetMapImageryProvider({
	url : 'https://a.tile.openstreetmap.org/'
    });

//    GH_OSM = new Cesium.OpenStreetMapImageryProvider({
//        url: 'https://stamen-tiles.a.ssl.fastly.net/watercolor/',
//        credit: 'Map tiles by Stamen Design, under CC BY 3.0. Data by OpenStreetMap, under CC BY SA.'
//    });

    GH_VIEW = new Cesium.Viewer('cesiumContainer', {
	animation : false,
	baseLayerPicker : true,
	fullscreenButton : true,
	geocoder : false,
	homeButton : true,
	infoBox : true,
	skyBox : false,
	sceneModePicker : false,
	selectionIndicator : true,
	timeline : false,
	navigationHelpButton : true,
	terrainProvider: Cesium.createWorldTerrain(),
	imageryProvider: GH_OSM,
	sceneMode : Cesium.SceneMode.SCENE3D,
	scene3DOnly : true,
	shadows : false,
	vrButton: false,
	terrainShadows : Cesium.ShadowMode.DISABLED,
	automaticallyTrackDataSourceClocks : true,
	contextOptions : {
            webgl : {
		powerPreference: 'high-performance'
            }
	}    
    });

    GH_VIEW.scene.debugShowFramesPerSecond = true;
    GH_VIEW.scene.preRender.addEventListener(ghUpdateScene);

    GH_C = new Cesium.ClockViewModel(GH_VIEW.clock);
    GH_A = new Cesium.AnimationViewModel(GH_C);
}



// Add Cesium OSM Buildings, a global 3D buildings layer.
//var buildingTileset = GH_VIEW.scene.primitives.add(Cesium.createOsmBuildings());   // const

function ghChangeOSMbuildings(flg) {
    if ( flg ) {
        GH_3DTILE_OSMBUILDING = GH_VIEW.scene.primitives.add(Cesium.createOsmBuildings());
    } else {
        GH_VIEW.scene.primitives.remove(GH_3DTILE_OSMBUILDING);
    }
}
function ghChangeSun(flg) {
    if ( flg ) {
    	GH_VIEW.scene.globe.enableLighting = true;
    	GH_VIEW.scene.sun = new Cesium.Sun();
        GH_VIEW.shadows = true;
	GH_VIEW.terrainShadows = Cesium.ShadowMode.RECEIVE_ONLY;
    } else {
	GH_VIEW.scene.globe.enableLighting = false;
    	GH_VIEW.scene.sun = null; //undefined;
        GH_VIEW.shadows = false;
	GH_VIEW.terrainShadows = Cesium.ShadowMode.DISABLED;
    }
}
        
function getUnmaskedInfo(gl) {
    var unMaskedInfo = {
        renderer: '',
        vendor: ''
    };
        
    var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbgRenderInfo != null) {
        unMaskedInfo.renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
        unMaskedInfo.vendor   = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
    }
    
    return unMaskedInfo;
}
   
function ghCheckData() {
    
    // Ignored Google Bot
    //var ua = window.navigator.userAgent.toLowerCase();
    var ua = window.navigator.userAgent;
    if(ua.indexOf('Googlebot') != -1) {
        return;
    }
    
    var language = (window.navigator.languages && window.navigator.languages[0]) ||
            window.navigator.language ||
            window.navigator.userLanguage ||
            window.navigator.browserLanguage;
    var txt = "plathome " + navigator.platform + " Core: " + navigator.hardwareConcurrency + "\n";
    txt += "Emaki3D\n";
    txt += "width :" + window.screen.width + "\n";
    txt += "height :" + window.screen.height + "\n";
    txt += "href :" +  location.href + "\n";
    txt += "referrer :" + document.referrer + "\n";
    
    // canvas = GH_S.canvas
    var gl = GH_VIEW.scene.canvas.getContext('webgl');
    var webgl = "version:" + gl.getParameter(gl.VERSION) + "\n";
    webgl += "shading:" + gl.getParameter(gl.SHADING_LANGUAGE_VERSION) + "\n";
    webgl += "vendor:" + gl.getParameter(gl.VENDOR) + "\n";
    webgl += "renderer:" + gl.getParameter(gl.RENDERER) + "\n";
    webgl += "unMaskVendor:" + getUnmaskedInfo(gl).vendor + "\n";    
    webgl += "unMaskRenderer:" + getUnmaskedInfo(gl).renderer + "\n";    
    webgl += "texture size:" + gl.getParameter(gl.MAX_TEXTURE_SIZE);
    
    var ret = txt + "\n" + webgl;
    
    $.ajax({
        type: "POST",
        url: "../indexres/contactform.php",
 	data: {
	    "language": language ,
	    "name": "ghEmaki",
            "checktype": "Emaki3D",
	    "email" : "info@geoglyph.info", 
	    "subject" : window.navigator.userAgent,
	    "message" : ret
	}
    }).done(function(data) {
        // NOP
    }).fail(function(XMLHttpRequest, textStatus,errorThrown){
        var msg = "check query error ";
        msg += " XMLHttpRequest " + XMLHttpRequest.status ;
        msg += " textStatus " + textStatus ;
	console.log( msg );
    });
};

////////////////////////////////
//
//   Check API
//
//
//
//  Worker Thread
//
if (window.Worker){
    // NOP
} else {
    console.log("WorkerThread Not Supported. \nThis application does not work your browser.");
}

//
//  Broadcast
//
if(window.BroadcastChannel){
    GH_2DVIEW = new EmakiBroadcast('2dto3d','emaki3d','secondary',ghEmakiReceiveMessage);
    GH_2DVIEW.initPrimaryConnection();
    console.log("Broadcast Channel Ready.");
} else {
    console.log("Broadcast Channel Not Supported. \nThis application does not work your browser.");
}

//
//
//   Shared Array
//
// https://caniuse.com/sharedarraybuffer
//
if(window.SharedArrayBuffer){
    // NOP
    console.log("SharedArray OK Supported." );
} else {
    console.log("SharedArray Not Supported. \nThis application does not work your browser.");
    //location.href="index.html";
}
if (self.crossOriginIsolated) {
    console.log( "Cross Origin Isoloation OK" );
} else {
    console.log( "Cross Origin Isoloation FALSE" );
}


////////////////////////////////////////////////
//
//  Document Ready
//   Set up init
//

$(document).ready(function(){
    ghInitCesium();

    $('#showbuildingschkbox').change(function() {
	ghChangeOSMbuildings( $(this).is(':checked') );
    });

    $('#enablesunchkbox').change(function() {
	ghChangeSun( $(this).is(':checked') );
    });

    ghBroadcastChannelGetDataDelay();

    //ghCheckData();

});


