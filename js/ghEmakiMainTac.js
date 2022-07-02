//
//
//   Eamki Tactics Main 
//
//   emakitac.html
//     |- turfEmakiLib.min.js
//     |- ghEmakiLang.js ( language )
//     |- ghEmakiStatus.js ( Unit Status function )
//     |- ghEmakiParams.js ( Unit Constant parameters  )
//     |- ghEmakiUtil.js ( Utility function  )
//     |- ghEmakiClock.js ( EmakiClock Class )
//     |- ghEmakiBroadcast.js ( EmakiBroadcast Class  )
//     |- ghEmakiTerrain.js ( EmakiStructure EmakiFields Class  )
//     |- ghEmakiTacUnit.js ( EmakiTacUnit Class  )
//     |
//     |- ghEmakiMainTac.js ( main )
//
//     
//   latitude  Y
//   longitude X 
//
//
// https://github.com/sanchezweezer/Leaflet.webGlTemperatureMap
// https://github.com/Leaflet/Leaflet.heat//
//
//https://gigazine.net/news/20191008-mini-tokyo-3d/
//
//https://geoman.io/geojson-editor
//
//https://fonts.google.com/icons?selected=Material+Icons
//    #leafletmap {
//      height: 80%;
//      width: 100%;
//    }
//    42px
//    map
//    94px
//
// https://leafletjs.com/SlavaUkraini/reference.html#map-overlaypane
//
var GH_LMAP = null;
var GH_LMAP_LAYER_CONTROL = null;
var GH_LAYERG_UNIT = [];
var GH_LAYERG_STRUCT = [];
var GH_LAYERG_FIELD = {};

var GH_TACMAP = null;
var GH_TACMAP_NORMALIZE_FACTOR = 70;
var GH_TACMAP_PREVTIME = -1;
var GH_TACMAP_INTERVAL = 1000;  // 1 sec
var GH_TACMAP_IDW_OPTIONS = {
    p : 4,
    zIndex : 590,
    range_factor : 0.00390625,
    gamma : 2.2,
    opacity : 0.7,
    isNullColorized: false
}

var GH_SIM_JSON = null;
var GH_SIM_FILE = null;
var GH_SIM_OVER = {
    "corps" : null,
    "unit" : null,
    "elapsed" : 0,
    "timestring" : null
}

var GH_IS_PLAYING = false;
var GH_TIMESTRING = "";

//var GH_LAST_TIME = 0;

var GH_2DBROAD = null;

//var GH_UNITS_VALUE = {};

var GH_TEMP_BASE = [ -2, 2, -2, 2, -2, 2 ];
var GH_COLOR_BASE = [ '#3f51b5', '#f44336', '#3f51b5', '#f44336','#3f51b5', '#f44336' ];
// Indigo , red 

var GH_CORPS = {};
var GH_UNITS = {};
var GH_STRUCTURE = {};
var GH_STRUCTURE_ARY = [];
var GH_FIELD = {};
var GH_FIELD_ARY = [];

//  Scene Configure
var GH_WEAPON = {};
var GH_FORMATION = {};
//

var GH_INITMAP = {
    latlng : null,
    zoom : 0
}

L.Marker.prototype.setMarkerName = function (name) {
    if (this.options) {
	this.options.markername = name;
    }
};
L.Marker.prototype.getMarkerName = function () {
    if (this.options) {
	return this.options.markername;
    } else {
	return null;
    }
};

L.Marker.prototype.setMarkerType = function (type) {
    if (this.options) {
	this.options.markertype = type;
    }
};
L.Marker.prototype.getMarkerType = function () {
    if (this.options.markertype) {
	return this.options.markertype;
    } else {
        // Default unit
        this.options.markertype = "unit";
	return this.options.markertype;
    }
};

////////////////////////////////////////////////////////////
//
//  Leaflet Main Map
//

var GH_LMAP_LAYER0 = L.tileLayer('../images/whitelayers.png');
var GH_LMAP_LAYER1 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    crossOrigin : true,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});
var GH_LMAP_LAYER2 = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    crossOrigin : true,
    attribution: '&copy; <a href="https://www.arcgis.com/">Esri/ArcGIS</a> contributors'
});
var GH_LMAP_LAYER3 = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    crossOrigin : true,
    attribution: '&copy; <a href="https://www.arcgis.com/">Esri/ArcGIS</a> contributors'
});


///////////////////////////////////////
function ghInitializeLeaflet() {
    // Header 42px
    //    map
    // Footer 94px
    let mapwidth = $(window).width() - 10;
    //let mapheight = $(window).height() - 94 - 42;
    let mapheight = $(window).height() - 133 - 42;
    $('#leafletmap').height(mapheight).width(mapwidth);    
    
    GH_LMAP = L.map('leafletmap',{
	doubleClickZoom : false
    }).setView([51.505, -0.09], 12);

    GH_LMAP_LAYER_CONTROL = new L.Control.Layers({
        'blank':GH_LMAP_LAYER0,
	'OSM':GH_LMAP_LAYER1,
        'EsriMAP':GH_LMAP_LAYER2,
        'EsriPHOTO':GH_LMAP_LAYER3
    }, {},{position:'topright'});
    GH_LMAP_LAYER_CONTROL.addTo(GH_LMAP);

    // default map OSM map
    GH_LMAP_LAYER0.addTo(GH_LMAP);

//    L.easyButton( '<i class="tiny material-icons">settings</i>', function(){
//        $('.sidenav').sidenav('open');
//    }, 'Click to menu').addTo(GH_LMAP);

    L.control.scale({metrix:true,imperial:false}).addTo(GH_LMAP);

    GH_TACMAP = L.webGlTemperatureMapLayer({
	idwOptions : GH_TACMAP_IDW_OPTIONS
    }).addTo(GH_LMAP);
    GH_TACMAP.onDrawLayer = ghEmakiTacMapDrawCallback;
    
    GH_LMAP.on('click', ghOnClickBaseMap);  

    if ( mapwidth > 610 ) {
	$('#commandinput').width(mapwidth/3);
    } else {
	$('#commandinput').hide();
	$('#commandbtn').hide();
    }
    
}
function ghOnClickMarker() {
    // NOP dummy
}
///////////////////////////////////
//
//    Tactics command
//
//
//   order [ emaki command for emaki2d ]
//             see ghEmakiParams.js
//
//
//
//   temperature [ add | remove ]
//
//   map init    ( initialize map view position )
//   map [unit key] [zoom]
//
//   get map [latlng|pixel]
//   get corps
//   get corps [ corps key ]
//   get timestring
//   get weapons
//   get weapons [ weapons key ]
//   get formations
//
//   get results
//
//   get [unit key] [status|ability|terrain|node|position|fatigue|velocity|bullet]
//
//
//
//
//
//
function _ParseExecCommand(cmds) {

    let cmdok = true;
    let unitkey = cmds[0];
    switch (cmds[0]) {
    case 'order' :
	cmds.shift();
	GH_2DBROAD.sendMessage('GH_ORDER','primary',cmds.join(' '));
	break;
    case 'temperature' :
	if ( cmds[1] == "add" ) {
	    if ( GH_LMAP.hasLayer(GH_TACMAP) ) {
		// NOP
	    } else {
		GH_TACMAP.addTo(GH_LMAP);
		GH_TACMAP.updateLayer();
	    }
	} else if ( cmds[1] == "remove" ) {
	    if ( GH_LMAP.hasLayer(GH_TACMAP) ) {
		GH_LMAP.removeLayer(GH_TACMAP);
	    } else {
		// NOP
	    }
	} else {
	    // NOP
	    cmdok = false;
	}
	break;
    case 'map' :
	unitkey = cmds[1];
	if ( unitkey == "init" ) {
	    GH_LMAP.setView(GH_INITMAP.latlng,GH_INITMAP.zoom);
	} else if ( GH_UNITS[ unitkey ] ) {
	    let m = GH_UNITS[ unitkey ].getLatLng();
	    if ( cmds.length == 3 ) {
		GH_LMAP.setView(m, parseFloat(cmds[2]));
	    } else {
		GH_LMAP.setView(m);
	    }
	} else {
	    // NOP
	    cmdok = false;
	}
	break;
    case 'get' :
	unitkey = cmds[1];
	if ( unitkey == "map" ) {
	    switch (cmds[2]) {
	    case 'latlng' :
		cmds = [];
		cmds.push ( unitkey );
		cmds.push ( GH_LMAP.getBounds().getNorthWest().lat );
		cmds.push ( GH_LMAP.getBounds().getNorthWest().lng );
		
		cmds.push ( GH_LMAP.getBounds().getNorthEast().lat );
		cmds.push ( GH_LMAP.getBounds().getNorthEast().lng );
		
		cmds.push ( GH_LMAP.getBounds().getSouthWest().lat );
		cmds.push ( GH_LMAP.getBounds().getSouthWest().lng );
	    
		cmds.push ( GH_LMAP.getBounds().getSouthEast().lat );
		cmds.push ( GH_LMAP.getBounds().getSouthEast().lng );
		break;
	    case 'pixel' :
		cmds = [];
		cmds.push ( unitkey );
		cmds.push ( GH_LMAP.getSize().x );
		cmds.push ( GH_LMAP.getSize().y );
		cmds.push ( GH_LMAP.getPixelBounds().getTopLeft().x );
		cmds.push ( GH_LMAP.getPixelBounds().getTopLeft().y );
		cmds.push ( GH_LMAP.getPixelBounds().getTopRight().x );
		cmds.push ( GH_LMAP.getPixelBounds().getTopRight().y );
		cmds.push ( GH_LMAP.getPixelBounds().getBottomLeft().x );
		cmds.push ( GH_LMAP.getPixelBounds().getBottomLeft().y );		
		cmds.push ( GH_LMAP.getPixelBounds().getBottomRight().x );
		cmds.push ( GH_LMAP.getPixelBounds().getBottomRight().y );		
		break;
	    default :
		cmdok = false;
		break;
	    }
	} else if ( unitkey == "results" ) {
	    cmds = [];
	    cmds.push ( unitkey );
	    if ( GH_SIM_OVER.corps == null ) {
		cmds.push ('NotYet');
	    } else {
		cmds.push ( 'Defeat' );
		cmds.push ( GH_SIM_OVER.corps );
		cmds.push ( GH_SIM_OVER.unit );
		cmds.push ( GH_SIM_OVER.elapsed );
		cmds.push ( GH_SIM_OVER.timestring );
	    }
	} else if ( unitkey == "timestring" ) {
	    cmds = [];
	    cmds.push ( unitkey );
	    cmds.push ( GH_TIMESTRING );
	    if ( GH_SIM_OVER.corps == null ) {
		cmds.push ('running');
	    } else {
		cmds.push ('finished');
	    }
	} else if ( unitkey == "corps" ) {
	    if ( typeof cmds[2] == 'undefined' ) {
		cmds = [];
		cmds.push ( unitkey );
		for(var ckey in GH_CORPS){
		    cmds.push ( ckey );
		}
	    } else {
		if ( GH_CORPS[ cmds[2] ] ) {
		    unitkey = cmds[2];
		    // Set corps data
		    cmds = [];
		    cmds.push ( unitkey );
		    cmds.push ( 9999 ); // total nodes temporary
		    let total = 0;
		    for(var key in GH_SIM_JSON.units){
			if ( GH_SIM_JSON.units[key].corps == unitkey ) {
			    cmds.push ( key );
			    let n = GH_UNITS[ key ].getNodes()
			    cmds.push ( n );
			    total += n;
			}
		    }
		    cmds[1] = total;
		} else {
		    cmdok = false;
		}
	    }
	} else if ( unitkey == "weapons" ) {
	    if ( typeof cmds[2] == 'undefined' ) {
		cmds = [];
		cmds.push ( unitkey );
		for(var ckey in GH_WEAPON){
		    cmds.push ( GH_WEAPON[ckey].index );
		    cmds.push ( ckey );
		}
	    } else {
		if ( GH_WEAPON[ cmds[2] ] ) {
		    unitkey = cmds[2];
		    cmds = [];
		    cmds.push ( unitkey );
		    cmds.push ( GH_WEAPON[unitkey].index );
		    cmds.push ( GH_WEAPON[unitkey].type );
		    cmds.push ( GH_WEAPON[unitkey].range );
		    cmds.push ( GH_WEAPON[unitkey].rapid );
		    cmds.push ( GH_WEAPON[unitkey].power );
		    cmds.push ( GH_WEAPON[unitkey].regist );
		    cmds.push ( GH_WEAPON[unitkey].comsumption );
		} else {
		    cmdok = false;
		}
	    }
	} else if ( unitkey == "formations" ) {
	    cmds = [];
	    cmds.push ( unitkey );
	    for(var ckey in GH_FORMATION){
		cmds.push ( GH_FORMATION[ckey].index );
		cmds.push ( ckey );
	    }
//	} else if ( GH_CORPS[ unitkey ] ) {
	} else if ( GH_UNITS[ unitkey ] ) {
	    switch (cmds[2]) {
	    case 'status' :
		cmds = [];
		cmds.push ( unitkey );
		cmds.push ( GH_UNITS[ unitkey ].getStatus(GH_STATUS_MOVE_DIGIT) );
		cmds.push ( GH_UNITS[ unitkey ].getStatus(GH_STATUS_ATTACK_DIGIT) );
		cmds.push ( GH_UNITS[ unitkey ].getStatus(GH_STATUS_FORMATION_DIGIT) );
		cmds.push ( GH_UNITS[ unitkey ].getStatus(GH_STATUS_WEAPON_DIGIT) );
		break;
	    case 'ability' :
		let abl = GH_UNITS[ unitkey ].getAbility();
		cmds = [];
		cmds.push ( unitkey );
		cmds.push ( abl.leadership );
		cmds.push ( abl.attack );
		cmds.push ( abl.defense );
		cmds.push ( abl.searching );
		cmds.push ( abl.luck );
		cmds.push ( abl.speed.max );
		cmds.push ( abl.speed.normal );
		break;
	    case 'terrain' :
		cmds = [];
		cmds.push ( unitkey );
		cmds.push ( GH_UNITS[ unitkey ].getTerrain(GH_TERRAIN_FIELD_DIGIT) );
		cmds.push ( GH_UNITS[ unitkey ].getTerrain(GH_TERRAIN_STRUCT_DIGIT) );
		cmds.push ( GH_UNITS[ unitkey ].getTerrain(GH_TERRAIN_NODE_DIGIT) );
		break;		
	    case 'node' :
		cmds = [];
		cmds.push ( unitkey );
		cmds.push ( GH_UNITS[ unitkey ].getNodes() );
		break;		
	    case 'position' :
		cmds = [];
		cmds.push ( unitkey );
		let ll = GH_UNITS[ unitkey ].getLatLng();
		cmds.push ( ll.lat );
		cmds.push ( ll.lng );
		cmds.push ( GH_LMAP.latLngToLayerPoint(ll).x );
		cmds.push ( GH_LMAP.latLngToLayerPoint(ll).y );		
		break;		
	    case 'fatigue' :
		cmds = [];
		cmds.push ( unitkey );
		cmds.push ( GH_UNITS[ unitkey ].getFatigue() );
		break;		
	    case 'velocity' :
		cmds = [];
		let v = GH_UNITS[ unitkey ].getVelocity(); // meter per mili-sec
		cmds.push ( unitkey );
		cmds.push ( v*3600 );  // Km/h
		cmds.push ( GH_UNITS[ unitkey ].getFrontDir() );
		break;		
	    case 'stock' :
		cmds = [];
		cmds.push ( unitkey );
		cmds.push ( GH_UNITS[ unitkey ].getRation() );
		cmds.push ( GH_UNITS[ unitkey ].getBullet() );
		break;		
	    default :
		cmdok = false;
		// NOP
	    }
	} else {
	    cmdok = false;
	    // NOP
	}
	break;
    default:
	cmdok = false;
	// NOP
    }

    ghOutputCommand(cmdok,cmds.join(' '));
    
}
//
//    Tactics command
//
//
///////////////////////////////////

function ghOnClickCommandButton() {

    let cmd = $('#commandinput').val();
    let cmds = cmd.split(/\s/);
    let res = [];
    for ( let i=0,len=cmds.length;i<len;i++ ) {
	let a = cmds[i];
	a = a.replace(/^\s+|\s+$/g, "");
	if ( a.length > 0 ) {
	    res.push(a);
	}
    }
    if ( res.length > 0 ) _ParseExecCommand(res);
}

function ghOutputCommand(isok,txt) {

    let out = "";
    if ( isok ) {
	out = "OK>" + txt;
    } else {
	out = "ERR>" + txt;
    }
    $('#commandoutput').val(out);
    
}
///////////////////////////////////


function ghOnClickBaseMap(e) {
    let str = e.latlng.toString();
    let str1 = str.replace('LatLng(', '' );
    let str2 = str1.replace(')','');
    let str3 = str2.replace(',',' ');    
    var popup = L.popup();
    popup
        .setLatLng(e.latlng)
        .setContent( str3 )
        .openOn(GH_LMAP);
}

function ghEmakiTacMapDrawCallback(obj) {
    //console.log("tac map draw");
    // NOP yet
}

function ghInitializeUI() {
    

    $('#gh_aboutmodal').modal();
    
};


function ghEmakiLoadWeaponFile(file) {
    $.ajax({
	dataType: "json",
	url: file,
	async:true
    }).done(function(data) {
	GH_WEAPON = data;
    }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	var msg = "Weapon data cannot load ";
	msg += " XMLHttpRequest " + XMLHttpRequest.status ;
	msg += " textStatus " + textStatus ;
	console.log( msg );
    });

}
function ghEmakiLoadFormationFile(file) {
    $.ajax({
	dataType: "json",
	url: file,
	async:true
    }).done(function(data) {
	GH_FORMATION = data;
    }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	var msg = "Formation data cannot load ";
	msg += " XMLHttpRequest " + XMLHttpRequest.status ;
	msg += " textStatus " + textStatus ;
	console.log( msg );
    });
}

function ghEmakiAddStructureFeatureOverlayGroup() {
    let res = -1;
    for(var key in GH_STRUCTURE){
	if ( GH_STRUCTURE[key].loadedFeatureLayer() ) {
	    // NOP
	} else {
	    res = 1;
	}
    }

    if ( res > 0 ) {
	setTimeout( ghEmakiAddStructureFeatureOverlayGroup, 2000 );
    } else {
	for(var key in GH_STRUCTURE){
	    let a = GH_STRUCTURE[key].getFeatureLayer();
	    if ( a != null ) GH_LAYERG_STRUCT.push ( a );
	}
	GH_LMAP_LAYER_CONTROL.addOverlay( L.layerGroup( GH_LAYERG_STRUCT ) , "structure");	
    }
}
function ghEmakiAddFieldFeatureOverlayGroup() {
    let res = -1;
    for(var key in GH_FIELD){
	if ( GH_FIELD[key].loadedFeatureLayer() ) {
	    // NOP
	} else {
	    res = 1;
	}
    }
    if ( res > 0 ) {
	setTimeout( ghEmakiAddFieldFeatureOverlayGroup, 2000 );
    } else {
	for(var key in GH_FIELD){
	    let a = GH_FIELD[key].getFeatureLayer();
	    if ( a != null ) {
		GH_LAYERG_FIELD[key] = a;
		GH_LMAP_LAYER_CONTROL.addOverlay( L.layerGroup( [ GH_LAYERG_FIELD[key] ] ) , key);
	    }
	}
    }
}

function ghEmakiLoadHistoryFile() {
    $.ajax({
	dataType: "json",
	url: GH_SIM_FILE
    }).done(function(data) {

	GH_SIM_JSON = data;


	//
	//  important Zoom -1 , for WebGL Canvas width height detect
	//
	//  Map initialize
	//
	GH_INITMAP.latlng = L.latLng(
	    parseFloat(GH_SIM_JSON.scene.latlng[0]),
	    parseFloat(GH_SIM_JSON.scene.latlng[1])
	);
	GH_INITMAP.zoom = parseFloat(GH_SIM_JSON.scene.zoom)-1;

	GH_LMAP.setView(GH_INITMAP.latlng,GH_INITMAP.zoom);


	//
	//  Corps setup
	//
	let idx = 0;
	for(var key in GH_SIM_JSON.corps){
	    GH_CORPS[key] = {
		"name" : GH_SIM_JSON.corps[key].name,
		"general" : GH_SIM_JSON.corps[key].general,
		"temp" : GH_TEMP_BASE[idx],
		"color" : GH_COLOR_BASE[idx]
	    }
	    idx ++;
	}

	//------------------
	let maxnodes = 0;
	for(var key in GH_SIM_JSON.units){
	    if ( GH_SIM_JSON.units[key].initialize.nodes > maxnodes ) {
		maxnodes = GH_SIM_JSON.units[key].initialize.nodes;
	    }
	}
	//let nodenormalize = maxnodes / GH_TACMAP_NORMALIZE_FACTOR;
	let nodenormalize = 1.0;
	//----------------

	//
	//  Units setup
	//
	//GH_LAYERG_UNIT = [];
	for(var key in GH_SIM_JSON.units){
	    let isgeneral = false;
	    for(var ckey in GH_CORPS){
		if ( key == GH_CORPS[ ckey ].general ) {
		    isgeneral = true;
		}
	    }
	    let corps = GH_SIM_JSON.units[key].corps;
	    GH_UNITS[key] = new EmakiTacUnit(
		key,
		'unit',
		GH_SIM_JSON.units[key].name,
		GH_SIM_JSON.units[key].ability,
		GH_SIM_JSON.units[key].initialize.nodes,
		nodenormalize,
		isgeneral,
		GH_CORPS[corps].temp,
		GH_CORPS[corps].color,
		GH_SIM_JSON.units[key].initialize.latlng
	    );
	    //GH_LAYERG_UNIT.push ( GH_UNITS[key].getMarker() );
	    GH_UNITS[key].drawMarkerMap(GH_LMAP);
	}
	//GH_LMAP_LAYER_CONTROL.addOverlay( L.layerGroup( GH_LAYERG_UNIT ) , "unit");	
	
	//
	//  Structure setup
	//
	let st = GH_SIM_JSON.map.structure;
	GH_LAYERG_STRUCT = [];
	var count = 0;
	for(var key in st ){
	    let corps = st[key].owner;
	    if ( GH_CORPS[corps] ) {
		GH_STRUCTURE[key] = new EmakiStructure( key, count, st[key] , 'circle', GH_CORPS[corps].color);
		GH_STRUCTURE_ARY.push(key);
		GH_LAYERG_STRUCT.push ( GH_STRUCTURE[key].getMarker() ); //  Point Circle
		count++;
	    }
	}
	// Async check
	ghEmakiAddStructureFeatureOverlayGroup();
	
	//
	//  Field setup
	//
	//let fdary = [];
	if ( GH_SIM_JSON.map.field == null  ) {
	    // NOP
	} else {
	    var mapdata = GH_SIM_JSON.map.field;
	    var count = 0;
	    for(var key in mapdata ){
		GH_FIELD[key] = new EmakiField( key, count, mapdata[key]);
		GH_FIELD_ARY.push(key);
		count++;
	    }
	    // Async Check
	    if ( count > 0 ) {
		ghEmakiAddFieldFeatureOverlayGroup();
	    }
	}
	//
	//  Weapon data
	//
	if ( GH_SIM_JSON.configure.weapon ) {
	    ghEmakiLoadWeaponFile(
		ghEmakiUtilGetResourceURI(GH_RSC_DATA, GH_SIM_JSON.configure.weapon )
	    );
	}
	//
	//  Formation data
	//
	if ( GH_SIM_JSON.configure.formation ) {
	    ghEmakiLoadFormationFile(
		ghEmakiUtilGetResourceURI(GH_RSC_DATA, GH_SIM_JSON.configure.formation )
	    );
	}
    }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	var msg = "history data cannot load ";
	msg += " XMLHttpRequest " + XMLHttpRequest.status ;
	msg += " textStatus " + textStatus ;
	console.log( msg );
	//alert(GH_ERROR_MSG['traindatacannotload']);
    });
}

function ghEmakiUpdate(data) {

    let t = new Date().getTime();
	
    if ( GH_TACMAP_PREVTIME < 0 || t - GH_TACMAP_PREVTIME > GH_TACMAP_INTERVAL ) {
	// If Once all Data Message
	let dlength = data.length + 1 ; // +1 means Key name 
	let pointarray = [];

	for ( var i =0,ilen=data.value.length-1;i<ilen;i=i+dlength ) {
	    let key = data.value[i];
	    //
	    // key i+0
	    // status i+1
	    // node i+2
	    // lat i+3
	    // lng i+4
	    // front i+5
	    // velocity i+6
	    // fatigue i+7
	    // terrain i+8
	    // ration i+9
	    // bullet i+10
	    //
	    if ( GH_UNITS[key] ) {
		GH_UNITS[key].setStatus(data.value[i+1]);
		let status = GH_UNITS[key].getStatus(GH_STATUS_MOVE_DIGIT);
		if ( status > GH_STATUS_RETREAT ) {
		    GH_UNITS[key].setTerrain(data.value[i+8]);
		    GH_UNITS[key].setNodes(data.value[i+2]);
		    GH_UNITS[key].setLatLng(data.value[i+3],data.value[i+4]);
		    
		    GH_UNITS[key].updateTemp();
		    GH_UNITS[key].setFrontDir(data.value[i+5]);
		    GH_UNITS[key].setVelocity(data.value[i+6]);
		    GH_UNITS[key].setFatigue(data.value[i+7]);
		    GH_UNITS[key].setRation(data.value[i+9]);
		    GH_UNITS[key].setBullet(data.value[i+10]);
		    
		    GH_UNITS[key].updateMarkerMap(GH_LMAP);
		    pointarray.push ( [ data.value[i+3], data.value[i+4], GH_UNITS[key].getTemp() ] );
		} else {
		    GH_UNITS[key].removeMarkerMap(GH_LMAP);
		    
		    pointarray.push ( [ 0.0, 0.0, 0.0 ] );  // Zero Padding for same array length
		}
	    }
	}
	
	if ( GH_IS_FIRST ) {
	    GH_TACMAP.setPoints( pointarray ,{isLatLng : true,draw: true});
	    GH_IS_FIRST = false;
	} else {
	    GH_TACMAP.updatePoints( pointarray ,{isLatLng : true,draw: true});
	}
	
	GH_TACMAP_PREVTIME = t;
    }
}

///////////////////////////////////////
//
//  Communicate between 2D and 3D
//
//   Receive message from 3D window
//
var GH_IS_FIRST = true;
function ghEmakiReceiveMessage(data) {
    if (data.type == 'GH_UPDATEUNIT') {

	if ( GH_SIM_JSON == null ) return;
	// No game data

	// If Each Data Message
	//ghUpdateUnitData(data.length,data.value);

	ghEmakiUpdate(data);
	GH_TIMESTRING = data.value[data.value.length-1]; // Last Index
	
    } else if (data.type == 'GH_GETDATAFILE_ACK') {
	GH_SIM_FILE = data.value;
	ghEmakiLoadHistoryFile();
    } else if (data.type == 'GH_SIMULATION_OVER') {
	GH_SIM_OVER.corps = data.value.corps;
	GH_SIM_OVER.unit = data.value.unit;
	GH_SIM_OVER.elapsed = data.value.elapsed;
	GH_SIM_OVER.timestring = data.value.timestring;
    } else {
        // Not Implemented
    }
}
function ghBroadcastChannelSetMyKeyDelay() {
    if ( GH_2DBROAD.isChannelConnected() ) {
	GH_2DBROAD.sendMessage('GH_GETDATAFILE','primary','emakitac');
    } else {
	setTimeout(ghBroadcastChannelSetMyKeyDelay,5000);
    }
}

////////////////////////////////
//
//   Check API
//
//https://jser.info/2020/04/20/puppeteer-3.0.0-chrome-83-beta-vue.js-3.0-beta/
//https://www.infoq.com/jp/news/2020/09/coop-coep-cross-origin-isolation/
//https://docs.google.com/document/d/1zDlfvfTJ_9e8Jdc8ehuV4zMEu9ySMCiTGMS9y0GU92k/edit
//https://github.com/emscripten-core/emscripten/pull/10077
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
    GH_2DBROAD = new EmakiBroadcast('2dbroad','emakitac','secondary',ghEmakiReceiveMessage);
    GH_2DBROAD.initPrimaryConnection();
    ghBroadcastChannelSetMyKeyDelay();
    console.log("Broadcast Channel Ready.");
} else {
    console.log("Broadcast Channel Not Supported. \nThis application does not work your browser.");
}

//
//
//  Shared Array
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

console.log( "Geoglyph EmakiTac jQuery " + jQuery.fn.jquery + " leaflet " + L.version );


////////////////////////////////////////////////
//
//  Document Ready
//   Set up init
//

$(document).ready(function(){

    ghInitializeLeaflet();

    ghInitializeUI();


    
    //ghChangePlayPauseButton(false);
    
});

