//
//
//   Eamki 2d Main 
//
//   emaki2d.html
//     |- turfEmakiLib.min.js
//     |- ghEmakiLang.js ( language )
//     |- ghEmakiStatus.js ( Unit Status functions )
//     |- ghEmakiFormation.js ( Unit Formation functions )
//     |- ghEmakiParams.js ( Unit Constant parameters  )
//     |- ghEmakiSharedArray.js ( Shared Array parameters  )
//     |- ghEmakiUtil.js ( Utility function  )
//     |- ghEmakiClock.js ( EmakiClock Class )
//     |- ghEmakiBroadcast.js ( EmakiBroadcast Class  )
//     |- ghEmakiSound.js ( EmakiSound Class )
//     |- ghEmakiTerrain.js ( EmakiStructure EmakiFields Class )
//     |   
//     |- ghEmakiManager2d.js ( EmakiManager Class )
//     |      |- ghEmakiSceneBroadWorker.js  ( thread )
//     |              |- ghEmakiParams.js
//     |              |- ghEmakiUtil.js
//     |              |- ghEmakiSharedArray.js ( Shared Array parameters  )
//     |              |- ghEmakiBroadcast.js ( EmakiBroadcast Class )
//     |              |- ghEmakiClock.js
//     |              |- turfEmakiLib.min.js
//     |   
//     |- ghEmakiUnit2d.js ( EmakiUnit Class )
//     |      |- ghEmakiUnit2dSimWorker.js  ( thread )
//     |              |- ghEmakiParams.js
//     |              |- ghEmakiUtil.js
//     |              |- ghEmakiSharedArray.js ( Shared Array parameters  )
//     |              |- ghEmakiClock.js
//     |              |- ghEmakiFormation.js
//     |              |- turfEmakiLib.min.js
//     |
//     |- ghEmakiMain2d.js ( main )
//
//     
//   latitude  Y
//   longitude X 
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
var GH_LMAP = null;

var GH_SIM = null;
var GH_SIM_FILE = null;
var GH_SIMJSON = null;
var GH_SIM_AI = 'none';

var GH_SOUND = null;
var GH_UNIT_SHEET = null;
var GH_UNIT_SHEET_COLS = 16;  // see ghInitializeUnitSheet()
var GH_WEAPON_SHEET = null;
var GH_WEAPON_SHEET_COLS = 9;  // see ghInitializeWeaponSheet()
var GH_FORMATION_SHEET = null;
var GH_FORMATION_SHEET_COLS = 6;  // see ghInitializeFormationSheet()

var GH_IS_PLAYING = false;

var GH_LAST_TIME = 0;

var GH_ROUTE_POLYLINE = null;
var GH_ATTACK_RANGE_SECTOR = null;

var GH_3DVIEW = null;

var GH_REPORT = {
    "content" : "",
    "lastupdate" : 0,
    "lastappend" : "",
    "updateinterval" : 1000
}

const GH_GUI_CMD_NON = 0;
const GH_GUI_CMD_MOVE_NONE = 1;
const GH_GUI_CMD_MOVE_ROUTE = 2;
const GH_GUI_CMD_MOVE_CHASE = 3;
const GH_GUI_CMD_WAIT = 4;
const GH_GUI_CMD_REPLENISH = 5;
const GH_GUI_CMD_ATTACK_NON = 6;
const GH_GUI_CMD_ATTACK_ON = 7;
const GH_GUI_CMD_ATTACK_OFF = 8;
const GH_GUI_CMD_WEAPON = 9;
const GH_GUI_CMD_FORMATION = 10;
var GH_GUI_CMD = GH_GUI_CMD_NON;

var GH_ICON_BAR_STRENGTH = 'strength';
var GH_ICON_BAR_FATIGUE = 'fatigue';
var GH_ICON_BAR_BULLET = 'bullet';
var GH_ICON_BAR_TYPE = GH_ICON_BAR_FATIGUE;

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

var GH_SHOW_LMAP_LATLNG = false;

//////////////////////////////////////
//
//    Event
//
//
//
//
function ghSetTargetHtml( data, type ) {
    let name = null;
    let radio1 = $('input[name=command2radio]:checked').val();
    let radio2 = $('input[name=command2move]:checked').val();
    let check3 = $('input[name=command2attack]').prop('checked');
    if ( type == 'unit' ) {
	name = GH_SIM.getUnitName(data,type);
	if ( radio1 == 'move' && radio2 == 'chase' ) {
	    $('#actiontargettext_movechase').html( name );
	    $('#actiontargetkey_movechase').val( data );
	    $('#actiontargettype_movechase').val( type );
	}
	if ( radio1 == 'attack' && check3 == true ) {
	    $('#actiontargettext_attack').html( name );
	    $('#actiontargetkey_attack').val( data );
	    $('#actiontargettype_attack').val( type );
	}
    } else if ( type == 'structure' ) {
	// Not Yet
    } else {
	// NOP
    }
}

///////////////////////////////////////
//
//  Unit Command
//
function ghOnClickTargetIcon() {
    let cmdunitkey = $('#commandtargetkey').val();
    if ( cmdunitkey != null ) {
	GH_SIM.setMapPosition(GH_LMAP,cmdunitkey);
    }
}

function ghOnClickCommandButton(type) {

    let cmdunitkey = $('#commandtargetkey').val();
    if ( cmdunitkey == null ) return;
    let name = GH_SIM.getUnitName(cmdunitkey,'unit');
    if ( name == null ) return;
    ghRemoveUnitWeaponSector();

    let cmdisok = true;
    let movespd = 0;
    let targetname = null;
    let targetkey = null;
    let targettype = null;
    let selection = 0;
    
    switch(GH_GUI_CMD) {
    case GH_GUI_CMD_MOVE_NONE:
	cmdisok = false;
	break;
    case GH_GUI_CMD_MOVE_ROUTE:
	ghRouteEditor('finish');
	movespd = $("#movespeednumber").val();
	GH_SIM.setUnitCommand(cmdunitkey,['route']);
	GH_SIM.setUnitCommand(cmdunitkey,['speed',movespd]);
	break;
    case GH_GUI_CMD_MOVE_CHASE:
	movespd = $("#movespeednumber").val();
	targetname = $('#actiontargettext_movechase').html();
	targetkey = $('#actiontargetkey_movechase').val();
	targettype = $('#actiontargettype_movechase').val();
	if ( targetkey == null ) {
	    cmdisok = false;
	} else {
	    GH_SIM.setUnitCommand(cmdunitkey,['chase',targettype,targetkey]);
	    GH_SIM.setUnitCommand(cmdunitkey,['speed',movespd]);
	}
	break;
    case GH_GUI_CMD_WAIT:
	GH_SIM.setUnitCommand(cmdunitkey,['wait']);
	break;
    case GH_GUI_CMD_REPLENISH:
	GH_SIM.setUnitCommand(cmdunitkey,['replenish']);
	break;
    case GH_GUI_CMD_ATTACK_NON:
	cmdisok = false;
	break;
    case GH_GUI_CMD_ATTACK_ON:
	targetname = $('#actiontargettext_attack').html();
	targetkey = $('#actiontargetkey_attack').val();
	targettype = $('#actiontargettype_attack').val();
	if ( targetkey == null ) {
	    cmdisok = false;
	} else {
	    GH_SIM.setUnitCommand(cmdunitkey,['attack',targettype,targetkey]);
	}
	break;
    case GH_GUI_CMD_ATTACK_OFF:
	GH_SIM.setUnitCommand(cmdunitkey,['attack','none']);
	break;
    case GH_GUI_CMD_WEAPON:
	selection = $('#weaponselect').val();
	GH_SIM.setUnitCommand(cmdunitkey,['weapon',selection]);
	break;
    case GH_GUI_CMD_FORMATION:
	selection = $('#formationselect').val();
	GH_SIM.setUnitCommand(cmdunitkey,['formation',selection]);
	break;
    default:
	cmdisok = false;
	// NOP
    }
    ghRouteEditor('cancel');

    if ( cmdisok ) {
	$('#commandbtn_message').html("");

	//  Target Object Rest ??
	$('#actiontargettext_movechase').html();
	$('#actiontargetkey_movechase').val();
	$('#actiontargettext_attack').html();
	$('#actiontargetkey_attack').val();
	if ( ! GH_IS_PLAYING ) {
	    ghOnClickPlayPauseButton();
	}
    } else {
	$('#commandbtn_message').html( "Wrong Command. cannot accept" );
	ghEmakiUtilConsole("OnClickCommandButton","Wrong command", GH_GUI_CMD);
    }

}

function ghDrawUnitWeaponSector(key) {
    let sector = GH_SIM.getUnitWeaponSector(key);
    if ( sector != null ) {
	GH_ATTACK_RANGE_SECTOR = L.sector({
            center: sector.latlng,
            innerRadius: sector.inner,
            outerRadius: sector.outer,
            startBearing: sector.startbearing,
            endBearing: sector.endbearing,
	    color: 'green'
        })
	GH_ATTACK_RANGE_SECTOR.addTo(GH_LMAP);
    }

//            fill: true,
//            fillColor: e.layer.options.fillColor,
//            fillOpacity: e.layer.options.fillOpacity,
//            color: e.layer.options.color,
//            opacity: e.layer.options.opacity
}

function ghRemoveUnitWeaponSector() {
    if ( GH_ATTACK_RANGE_SECTOR != null ) {
	GH_LMAP.removeLayer(GH_ATTACK_RANGE_SECTOR);
	GH_ATTACK_RANGE_SECTOR = null;
    }
}
function ghRoutePlotterRedraw() {
    GH_ROUTE_POLYLINE.updateMeasurements();
}
function ghRouteEditor(type) {
    let cmdunitkey = $('#commandtargetkey').val();
    if ( cmdunitkey == null ) return;
    let name = GH_SIM.getUnitName(cmdunitkey,'unit');
    if ( name == null ) return;

    if ( type == 'edit' ) {
	GH_ROUTE_POLYLINE = L.Polyline.Plotter( GH_SIM.getRoutePolyline(cmdunitkey) ,{
	    weight: 2,
	    color: '#e11',
	    mycallback : ghRoutePlotterRedraw
	});
	if ( GH_ROUTE_POLYLINE == null ) {
	    // NOP
	} else {
	    GH_ROUTE_POLYLINE.addTo(GH_LMAP);
	    GH_ROUTE_POLYLINE.showMeasurements();
	}
    } else if ( type == 'cancel' ) {
	if ( GH_ROUTE_POLYLINE == null ) {
	    // NOP
	} else {
	    GH_LMAP.removeLayer(GH_ROUTE_POLYLINE);
	    GH_ROUTE_POLYLINE = null;
	}
    } else if ( type == 'finish' ) {
	if ( GH_ROUTE_POLYLINE == null ) {
	    // NOP
	} else {
	    // Get Coord
	    GH_SIM.setRoutePolyline(cmdunitkey,GH_ROUTE_POLYLINE.getLatLngs());
	    GH_LMAP.removeLayer(GH_ROUTE_POLYLINE);
	    GH_ROUTE_POLYLINE = null;
	}
    } else {
	// NOP
    }
}

//
///////////////////////////////////////
//
function ghOnClickMarker(e) {

    let m = e.target;
    let type = m.getMarkerType();
    let name = m.getMarkerName();
    if ( type == 'unit' ) {
	GH_SIM.selectUnitSheet( name );
	ghSetTargetHtml( name, type );
    } else if ( type == 'structure' ) {
	ghSetTargetHtml( name, type );
    } else {
	// NOP
    }
}

function ghOnDoubleClickMarker(e,u) {
    //
    //   Footer Page Unit Command Data
    //
    //
    if ( GH_IS_PLAYING ) ghOnClickPlayPauseButton();
    $('#commandbtn_message').html("");
    ghRouteEditor('cancel');

    let m = null;
    let type = null;
    let key = null;
    let icon = null;
    if ( e != null ) {
	m = e.target;
	type = m.getMarkerType();
	key = m.getMarkerName();
	icon = m.getIcon();
    } else {
	type = 'unit';
	key = u;
	icon = GH_SIM.getUnitMarker(key).getIcon();
    }
    
    $('#commandtargeticon').attr('src',icon.options.iconUrl);
    
    let unitstatus =  GH_SIM.getUnitStatus(key);
    let unitattackaction =  GH_SIM.getUnitAction(key,'attack');
    $('#commandtargettext').html( GH_SIM.getUnitName(key,type) );
    $('#commandtargetdescription').html( GH_SIM.getUnitDescription(key,type) );
    $('#commandtargetkey').val(key);

    ghRemoveUnitWeaponSector();
    ghDrawUnitWeaponSector(key);
    
    $('input[name=command2radio]').each(function(index, element) {
	$(this).prop("checked",false);
    })

    if ( unitstatus.attack == GH_STATUS_ATK_NON
	 || unitstatus.attack == GH_STATUS_ATK_READY ) {
	//   formation Select
	$('#formationselect').children().remove();
	let ary = GH_SIM.getUnitFormationList(key); 
	for(let j=0,jlen=ary.length;j<jlen;j++){
	    $('#formationselect').append($('<option>').html( ary[j].description ).val( ary[j].value ));
	}
	$('#command2radioformation').prop('disabled', false);
    } else {
	$('#command2radioformation').prop('disabled', true);
    }
    $('#formationselect').val(unitattackaction.formation);

    let spd = GH_SIM.getUnitSpeedParams(key); 
    $("#movespeednumber").attr("max",spd.max);
    $("#movespeednumber").val(spd.current);
     
    //  Weapon Select
    $('#weaponselect').children().remove();
    let ary = GH_SIM.getUnitWeaponList(key); 
    for(let j=0,jlen=ary.length;j<jlen;j++){
	$('#weaponselect').append($('<option>').html( ary[j].description ).val( ary[j].value ));
	//$('#weaponselect').append($('<option>').html( ary[j].base64 ).val( ary[j].value ));
    }
    $('#weaponselect').val(unitattackaction.weapon);

    //  All columns hide
    $('#movecolumn').hide();
    $('#speedcolumn').hide();
    $('#attackcolumn').hide();
    $('#targetcolumn_movechase').hide();
    $('#targetcolumn_attack').hide();

    $('#weaponcolumn').hide();
    $('#formationcolumn').hide();

    //$('#weaponselect').formSelect(); // Initialize Materialize Select
    //$('#formationselect').formSelect(); // Initialize Materialize Select

    if ( $('#commandbtn_execplay').hasClass('disabled') ) {
	$('#commandbtn_execplay').removeClass('disabled');
    } else {
	// NOP
    }

}    

function ghOnClickBaseMap(e) {
    let str = e.latlng.toString();
    let str1 = str.replace('LatLng(', '' );
    let str2 = str1.replace(')','');
    if ( GH_SHOW_LMAP_LATLNG ) {
	var popup = L.popup();
	popup
            .setLatLng(e.latlng)
            .setContent( str2 )
            .openOn(GH_LMAP);
    }
    ghSetTargetHtml( str2 , 'point');

}

function ghOnClickPlayPauseButton() {
    if ( GH_SIM == null ) return;

    if ( $('#commandbtn_execplay').hasClass('disabled') ) {
	// NOP
    } else {
	$('#commandbtn_execplay').addClass('disabled');
    }
    
    var t = $('#playbtntext').html();
    if ( t == "pause" ) {
        // Pause pressed 
        // change display to PLAY
        GH_IS_PLAYING = false; // status pause
    } else {
        // Play pressed 
        // change display to PAUSE
        GH_IS_PLAYING = true;  // status play
	ghRouteEditor('cancel');
	ghRemoveUnitWeaponSector();
    }
    ghChangePlayPauseButton(GH_IS_PLAYING);
    GH_SIM.changePlayPause(GH_IS_PLAYING);

    GH_3DVIEW.sendMessage('GH_PLAYSTATUS','all',GH_IS_PLAYING);

}


function ghChangeSpeed( val ) {
    if ( typeof val == 'undefined' ) return;
    if ( isNaN(val) ) return;
    var v = ghEmakiUtilGetNumberInRange(val,1,6);
    GH_SIM.setSimulationSpeed(v);

    GH_3DVIEW.sendMessage('GH_SIMULATIONSPEED','all',v);
}
function ghChangeBroadcastRate( val ) {
    if ( typeof val == 'undefined' ) return;
    if ( isNaN(val) ) return;
    var v = ghEmakiUtilGetNumberInRange(val,1,10);
    GH_SIM.setBroadcastRate(v);
}
function ghChangeMoveSpeed( val ) {
    let cmdunitkey = $('#commandtargetkey').val();
    if ( cmdunitkey == null ) return;

    let spd = GH_SIM.getUnitSpeedParams(cmdunitkey); 
    if ( spd == null ) return;

    if ( val > spd.normal ) {
	$("#movespeednumber").css("color",'#E57373'); // Red
    } else if ( val < spd.normal ) { 
	$("#movespeednumber").css("color",'#4FC3F7');  // Blue
    } else {
	$("#movespeednumber").css("color",'#9E9E9E');  // Grey
    }
}

function ghChangeCommandRadio( val ) {

    if ( $('#commandbtn_execplay').hasClass('disabled') ) {
	// NOP
    } else {
	$('#commandbtn_execplay').addClass('disabled');
    }

    if ( val == 'move' ) {
	$('#movecolumn').show();
	$('#speedcolumn').show();
	$('#attackcolumn').hide();
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').hide();
	$('#weaponcolumn').hide();
	$('#formationcolumn').hide();

	var val = $('input[name=command2move]:checked').val();
	if ( val == 'route' ) {
	    GH_GUI_CMD = GH_GUI_CMD_MOVE_ROUTE;
	    ghRouteEditor('edit');
	    $('#commandbtn_execplay').removeClass('disabled');
	} else if ( val == 'chase' ) {
	    GH_GUI_CMD = GH_GUI_CMD_MOVE_CHASE;
	    ghRouteEditor('cancel');
	    $('#targetcolumn_movechase').show();
	    var val = $('#actiontargetkey_movechase').val();
	    if ( val != null || val != "" ) {
		$('#commandbtn_execplay').removeClass('disabled');
	    }
	} else {
	    GH_GUI_CMD = GH_GUI_CMD_MOVE_NONE;
	    ghRouteEditor('cancel');
	    $('#commandbtn_execplay').removeClass('disabled');
	}
    } else if ( val == 'attack' ) {
	ghRouteEditor('cancel');
	$('#movecolumn').hide();
	$('#speedcolumn').hide();
	$('#attackcolumn').show();
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').hide();
	$('#weaponcolumn').hide();
	$('#formationcolumn').hide();

	var val = $('input[name="command2attack"]').prop('checked');
	if ( val ) {
	    GH_GUI_CMD = GH_GUI_CMD_ATTACK_ON;
	    $('#targetcolumn_attack').show();
	    var val = $('#actiontargetkey_attack').val();
	    if ( val != null || val != "" ) {
		$('#commandbtn_execplay').removeClass('disabled');
	    }
	} else {
	    GH_GUI_CMD = GH_GUI_CMD_ATTACK_OFF;
	    $('#commandbtn_execplay').removeClass('disabled');
	}
    } else if ( val == 'wait' ) {
	ghRouteEditor('cancel');
	GH_GUI_CMD = GH_GUI_CMD_WAIT;
	$('#movecolumn').hide();
	$('#speedcolumn').hide();
	$('#attackcolumn').hide();
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').hide();
	$('#weaponcolumn').hide();
	$('#formationcolumn').hide();
	$('#commandbtn_execplay').removeClass('disabled');
    } else if ( val == 'replenish' ) {
	ghRouteEditor('cancel');	
	GH_GUI_CMD = GH_GUI_CMD_REPLENISH;
	$('#movecolumn').hide();
	$('#speedcolumn').hide();
	$('#attackcolumn').hide();
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').hide();
	$('#weaponcolumn').hide();
	$('#formationcolumn').hide();
	$('#commandbtn_execplay').removeClass('disabled');
    } else if ( val == 'weapon' ) {
	ghRouteEditor('cancel');	
	GH_GUI_CMD = GH_GUI_CMD_WEAPON;
	$('#movecolumn').hide();
	$('#speedcolumn').hide();
	$('#attackcolumn').hide();
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').hide();
	$('#weaponcolumn').show();
	$('#formationcolumn').hide();

	$('#commandbtn_execplay').removeClass('disabled');
    } else if ( val == 'formation' ) {
	ghRouteEditor('cancel');
	GH_GUI_CMD = GH_GUI_CMD_FORMATION;
	$('#movecolumn').hide();
	$('#speedcolumn').hide();
	$('#attackcolumn').hide();
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').hide();
	$('#weaponcolumn').hide();
	$('#formationcolumn').show();

	$('#commandbtn_execplay').removeClass('disabled');
    } else {
	ghRouteEditor('cancel');
	// NOP
    }

}
function ghChangeCommandMoveRadio( val ) {

    if ( val == 'route' ) {
	ghRouteEditor('edit');
	GH_GUI_CMD = GH_GUI_CMD_MOVE_ROUTE;
	$('#speedcolumn').show();
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').hide();
    } else if ( val == 'chase' ) {
	ghRouteEditor('cancel');	
	GH_GUI_CMD = GH_GUI_CMD_MOVE_CHASE;
	$('#speedcolumn').show();
	$('#targetcolumn_movechase').show();
	$('#targetcolumn_attack').hide();
    } else {
	ghRouteEditor('cancel');	
	GH_GUI_CMD = GH_GUI_CMD_MOVE_NONE;
	// NOP
    }

}
function ghChangeCommandAttackCheckbox( val ) {
    if ( val == 'target' ) {
	GH_GUI_CMD = GH_GUI_CMD_ATTACK_ON;
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').show();
    } else if ( val == 'non' ) {
	GH_GUI_CMD = GH_GUI_CMD_ATTACK_OFF;
	$('#targetcolumn_movechase').hide();
	$('#targetcolumn_attack').hide();
    } else {
	GH_GUI_CMD = GH_GUI_CMD_ATTACK_NONE;
	// NOP
    }

}
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

    GH_LMAP.addControl(new L.Control.Layers({
        'Blank':GH_LMAP_LAYER0,
	'OSM':GH_LMAP_LAYER1,
        'EsriMAP':GH_LMAP_LAYER2,
        'EsriPHOTO':GH_LMAP_LAYER3
    }, {},{position:'topright'}));

    // default map OSM map
    GH_LMAP_LAYER1.addTo(GH_LMAP);

    //  Left Top Setting Button for Sidebar
    L.easyButton( '<i class="tiny material-icons">settings</i>', function(){
        $('.sidenav').sidenav('open');
    }, 'Click to menu').addTo(GH_LMAP);

    //  Left Top icon-fbar Setting Button
    var baritems = [
	{ label: "Strength", value: GH_ICON_BAR_STRENGTH },
	{ label: "Fatigue", value: GH_ICON_BAR_FATIGUE },
	{ label: "Bullet", value: GH_ICON_BAR_BULLET }	
    ];
    L.control.select({
	position: "topleft",
	selectedDefault: GH_ICON_BAR_TYPE,
	items: baritems,
	onSelect: function(newItemValue) {
	    GH_ICON_BAR_TYPE = newItemValue;
	    //console.log(newItemValue);
	}
    }).addTo(GH_LMAP);

    //  Left Bottom Scale Bar
    L.control.scale({metrix:true,imperial:false}).addTo(GH_LMAP);
    
    GH_LMAP.on('click', ghOnClickBaseMap);  
}


function ghOpenReportDialog() {
    if ( $('#reportdialog').dialog('isOpen') ) {
        $('#reportdialog').dialog('close');
    } else {
        $('#reportdialog').dialog('open');
    }
}
function ghOpenWeaponSheetDialog() {
    if ( $('#weaponsheetdialog').dialog('isOpen') ) {
        $('#weaponsheetdialog').dialog('close');
    } else {
        $('#weaponsheetdialog').dialog('open');
    }
}
function ghOpenFormationSheetDialog() {
    if ( $('#formationsheetdialog').dialog('isOpen') ) {
        $('#formationsheetdialog').dialog('close');
    } else {
        $('#formationsheetdialog').dialog('open');
    }
}

function ghOpenUnitSheetDialog() {
    if ( $('#unitsheetdialog').dialog('isOpen') ) {
        $('#unitsheetdialog').dialog('close');
    } else {
        $('#unitsheetdialog').dialog('open');
    }
}

function ghSelectTabs(e) {
    // e = DOM object
}
function ghInitializeUI() {
    var s = $(".sidenav").sidenav();
    var t = $(".tabs").tabs({
	onShow : ghSelectTabs
    });
    $('#modal01').modal();
//    $('#modal01').modal({
//	onOpenStart : function () {
//	}
//    });

    //title: '<i class="material-icons left">message</i>Message',
    $( "#reportdialog" ).dialog({
	width: 420,
	height: 420,
	resizable: false,
	position : { my: "left center", at : "left center" , of : window }
    });    //  resizeStop: function ( event,ui) { resize_control_dialog(ui.size) }	     
    $('#reportdialog').dialog('close');
    $('#ui-id-1').html('<i class="material-icons left">message</i>Report');

    //title: '<i class="material-icons left">format_list_bulleted</i>Sheet',
    $( "#unitsheetdialog" ).dialog({
	width: 800,
	height: 400,
	resizable: true,
	position : { my: "left center", at : "left center" , of : window }
    });    //  resizeStop: function ( event,ui) { resize_control_dialog(ui.size) }	     
    $('#unitsheetdialog').dialog('close');
    $('#ui-id-2').html('<i class="material-icons left">supervisor_account</i>Units');
    
    //title: '<i class="material-icons left">format_list_bulleted</i>Sheet',
    $( "#weaponsheetdialog" ).dialog({
	width: 500,
	height: 250,
	resizable: true,
	position : { my: "left center", at : "left center" , of : window }
    });    //  resizeStop: function ( event,ui) { resize_control_dialog(ui.size) }	     
    $('#weaponsheetdialog').dialog('close');
    $('#ui-id-3').html('<i class="material-icons left">security</i>Weapons');
    
    //title: '<i class="material-icons left">format_list_bulleted</i>Sheet',
    $( "#formationsheetdialog" ).dialog({
	width: 500,
	height: 250,
	resizable: true,
	position : { my: "left center", at : "left center" , of : window }
    });    //  resizeStop: function ( event,ui) { resize_control_dialog(ui.size) }	     
    $('#formationsheetdialog').dialog('close');
    $('#ui-id-4').html('<i class="material-icons left">view_comfy</i>Formations');

    // Floating Action Button
    $('.fixed-action-btn').floatingActionButton({hoverEnabled:false});
    
    $('#modalover').modal();

    $('select').formSelect();

    $('#movespeednumber').change(function() {
	ghChangeMoveSpeed($(this).val());
    });

    $('input[name="command2radio"]').change(function() {
	var val = $('input[name=command2radio]:checked').val();
	ghChangeCommandRadio( val );
    });

    $('input[name="command2move"]').change(function() {
	var val = $('input[name=command2move]:checked').val();
	ghChangeCommandMoveRadio( val );
    });


    $('input[name="command2direction"]').change(function() {
	if ($(this).prop('checked')) {
	    ghChangeCommandDirectionCheckbox( $(this).val() );  
	} else {
	    ghChangeCommandDirectionCheckbox( 'same' );  
	}
    });
    $('input[name="command2attack"]').change(function() {
	if ($(this).prop('checked')) {
	    ghChangeCommandAttackCheckbox( $(this).val() );  
	} else {
	    ghChangeCommandAttackCheckbox( 'non' );  
	}
    });
    
    $('input[name="enablebgm"]').change(function() {
	var prop = $('#enablebgm').prop('checked');
	GH_SOUND.setBGMCheckbox(prop);
	GH_SOUND.playpaseBGM(prop);
    });
    $('input[name="enablebgmradio"]').change(function() {
	var prop = $('#enablebgm').prop('checked');
	var val = $('input[name=enablebgmradio]:checked').val();
	GH_SOUND.setCurrentBGM(val);
	if ( prop ) GH_SOUND.playpaseBGM(prop);
    });
    $('input[name="enablese"]').change(function() {
	var prop = $('#enablese').prop('checked');
	GH_SOUND.setEffectCheckbox(prop);
    });

    $('input[name="showlatlng"]').change(function() {
	var prop = $('#showlatlng').prop('checked');
	if ( prop ) {
	    GH_SHOW_LMAP_LATLNG = true;
	} else {
	    GH_SHOW_LMAP_LATLNG = false;
	}
    });

    $( 'input[name="simulationspeed"]' ).change( function () {
	ghChangeSpeed( $(this).val() );
    } );

    $( 'input[name="broadcastrate"]' ).change( function () {
	ghChangeBroadcastRate( $(this).val() );
    } );

    $( 'input[name="soundvolume"]' ).change( function () {
	// convert [0 - 100] -> [0 - 1]
	GH_SOUND.setBGMvolume($(this).val()/100);
	GH_SOUND.setEffectVolume($(this).val()/100);
    } );

    $('#gh_aboutmodal').modal();

    // show thums
    //  https://github.com/Dogfalo/materialize/issues/6036
    var array_of_dom_elements = document.querySelectorAll("input[type=range]");
    M.Range.init(array_of_dom_elements);

    
};
function ghSelectUnitSheet(instance,x1,y1,x2,y2,origin) {
    if ( x1 == 2 && x2 == 2 ) {
	// Only One Cell Click
	let cellname = GH_UNIT_SHEET.getValueFromCoords(0,y1);
	GH_SIM.setMapPosition(GH_LMAP,cellname);
	ghOnDoubleClickMarker(null,cellname);//  Show Footer Command
    }
}
function ghInitializeUnitSheet() {

    GH_UNIT_SHEET = jspreadsheet(document.getElementById('unitspreadsheet'), {
        columns: [
	    { type: 'hidden', title: 'keyid' },
	    { type: 'numeric', title: 'No', width: 30 , readOnly: true },
            { type: 'image', title: 'Icon', width: 32 , readOnly: true},
	    { type: 'text', title: 'Name', width: 120 },
	    { type: 'numeric', title: 'Strength', width: 60 },
	    { type: 'numeric', title: 'Fatigue', width: 60 },
	    { type: 'text', title: 'Action', width: 80 },
	    { type: 'text', title: 'Target', width: 120 },
	    { type: 'text', title: 'Weapon', width: 80} ,
	    { type: 'text', title: 'Terrain', width: 100 },
	    { type: 'text', title: 'Formation', width: 100 },
	    { type: 'numeric', title: 'Speed', width: 60 },
	    { type: 'numeric', title: 'Leadership', width: 60 },
	    { type: 'numeric', title: 'Attack', width: 60 },
	    { type: 'numeric', title: 'Defense', width: 60 },
	    { type: 'numeric', title: 'Luck', width: 60 }
        ],
	minDimensions : [ GH_UNIT_SHEET_COLS , 1 ],
	columnSorting : true,
	allowInsertRow : true,
	tableoverflow: true,
	freezeColumns: 2,
	tableWidth: '500px',
	tableHeight: '300px',
        sorting:function(direction) {
            return function(a, b) {
                var valueA = new Number(a[1]);
                var valueB = new Number(b[1]);
                if (! direction) {
		    return (valueA === '' && valueB !== '') ? 1 : (valueA !== '' && valueB === '') ? -1 : (valueA > valueB) ? 1 : (valueA < valueB) ? -1 :  0;
                } else {
		    return (valueA === '' && valueB !== '') ? 1 : (valueA !== '' && valueB === '') ? -1 : (valueA > valueB) ? -1 : (valueA < valueB) ? 1 :  0;
		}
            }
        },
	onselection : ghSelectUnitSheet
    });
}
function ghInitializeWeaponSheet() {

    GH_WEAPON_SHEET = jspreadsheet(document.getElementById('weaponspreadsheet'), {
        columns: [
	    { type: 'hidden', title: 'keyid' },
	    { type: 'numeric', title: 'No', width: 30 , readOnly: true },
	    { type: 'image', title: 'Icon', width: 32 , readOnly: true },
	    { type: 'text', title: 'Name', width: 120 },
            { type: 'numeric', title: 'Range', width: 60 },
            { type: 'numeric', title: 'Use', width: 60 },	    
	    { type: 'numeric', title: 'Agility', width: 60 },
	    { type: 'numeric', title: 'Attack', width: 60 },
	    { type: 'numeric', title: 'Defense', width: 60 }
	],
	minDimensions : [ GH_WEAPON_SHEET_COLS , 1 ],
	columnSorting : true,
	allowInsertRow : true,
	tableoverflow: true,
	freezeColumns: 2,
	tableWidth: '500px',
	tableHeight: '200px',
        sorting:function(direction) {
            return function(a, b) {
                var valueA = new Number(a[1]);
                var valueB = new Number(b[1]);
                if (! direction) {
		    return (valueA === '' && valueB !== '') ? 1 : (valueA !== '' && valueB === '') ? -1 : (valueA > valueB) ? 1 : (valueA < valueB) ? -1 :  0;
                } else {
		    return (valueA === '' && valueB !== '') ? 1 : (valueA !== '' && valueB === '') ? -1 : (valueA > valueB) ? -1 : (valueA < valueB) ? 1 :  0;
		}
            }
        }
    });
}
function ghInitializeFormationSheet() {

    GH_FORMATION_SHEET = jspreadsheet(document.getElementById('formationspreadsheet'), {
        columns: [
	    { type: 'hidden', title: 'keyid' },
	    { type: 'numeric', title: 'No', width: 30 , readOnly: true },
	    { type: 'text', title: 'Name', width: 120 },
	    { type: 'numeric', title: 'Attack', width: 70 },
	    { type: 'numeric', title: 'Defense', width: 70 },
            { type: 'text', title: 'Skill', width: 100 }
	],
	minDimensions : [ GH_FORMATION_SHEET_COLS , 1 ],
	columnSorting : true,
	allowInsertRow : true,
	tableoverflow: true,
	freezeColumns: 2,
	tableWidth: '500px',
	tableHeight: '200px',
        sorting:function(direction) {
            return function(a, b) {
                var valueA = new Number(a[1]);
                var valueB = new Number(b[1]);
                if (! direction) {
		    return (valueA === '' && valueB !== '') ? 1 : (valueA !== '' && valueB === '') ? -1 : (valueA > valueB) ? 1 : (valueA < valueB) ? -1 :  0;
                } else {
		    return (valueA === '' && valueB !== '') ? 1 : (valueA !== '' && valueB === '') ? -1 : (valueA > valueB) ? -1 : (valueA < valueB) ? 1 :  0;
		}
            }
        }
    });
}

function ghAppendEventReport(txt){
    var nowTime = new Date().getTime();
    var timer = $("#timecount").text();
    GH_REPORT.lastappend = txt;
    GH_REPORT.content += "\n" + timer + " " + txt;
    if ( nowTime - GH_REPORT.lastupdate > GH_REPORT.updateinterval ) {
	$('#eventreport').val(GH_REPORT.content);
	$("#eventreport").scrollTop( $("#eventreport")[0].scrollHeight ); // AutoScroll
	GH_REPORT.lastupdate = nowTime;
	GH_SOUND.playEffect('message');
    }
}

function ghChangePlayPauseButton(isplaying) {
    if ( ! isplaying ) {
	$('#playpauseicon').html("play_arrow");
	$('#playbtntext').html("play");    
	$('#playbtn').css("background-color","#26a69a");
    } else {
	$('#playpauseicon').html("pause");
	$('#playbtntext').html("pause");        
	$('#playbtn').css("background-color","#b22222");     
    }
}


///////////////////////
function ghEmakiLoadSoundFile(file){
    $.ajax({
	dataType: "json",
	url: ghEmakiUtilGetResourceURI(GH_RSC_SOUND,file)
    }).done(function(data) {
	GH_SOUND.addSound(data);
    }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	var msg = "sound data cannot load ";
	msg += " XMLHttpRequest " + XMLHttpRequest.status ;
	msg += " textStatus " + textStatus ;
	console.log( msg );
    });
    
}
///////////////////////////////////////
//
//   Load History data
//
function ghSetupSheets(){
    GH_SIM.setupUnitSheet( GH_UNIT_SHEET );
    GH_SIM.setupWeaponSheet( GH_WEAPON_SHEET, GH_WEAPON_SHEET_COLS );
    GH_SIM.setupFormationSheet( GH_FORMATION_SHEET, GH_FORMATION_SHEET_COLS  );
}
function ghCheckLazySheetIcons(){
    let uniticon = GH_SIM.isUnitIconLoaded();
    let weaponicon = GH_SIM.isWeaponIconLoaded();
    if ( uniticon && weaponicon ) {
	ghSetupSheets();
    } else {
	setTimeout(ghCheckLazySheetIcons,2000);
    }
}
function ghShowProperty() {

    $('#gh_preperty_emaki').html( GH_REV );
    $('#gh_preperty_jquery').html( jQuery.fn.jquery );
    $('#gh_preperty_leaflet').html( L.version );
    
    // Property Content
    //if ( GH_SIMJSON.property.revision ) $('#gh_preperty_revision').html( GH_SIMJSON.property.revision );
    if ( GH_SIMJSON.property.author ) $('#gh_preperty_author').html( GH_SIMJSON.property.author );
    if ( GH_SIMJSON.property.mail ) $('#gh_preperty_mail').html( GH_SIMJSON.property.mail );
    if ( GH_SIMJSON.property.datetime ) $('#gh_preperty_datetime').html( GH_SIMJSON.property.datetime );
}
//
//
//
function ghLoadSimulationData(file,lng){
    if ( file == null ) {
	if ( lng == null ) {
	    GH_SIM_FILE = ghEmakiUtilGetSimulationUri( $("[name=fieldname]").val() , 'en');
	} else {
	    GH_SIM_FILE = ghEmakiUtilGetSimulationUri( $("[name=fieldname]").val() , lng);
	}
    } else {
	if ( lng == null ) {
	    GH_SIM_FILE = ghEmakiUtilGetSimulationUri( file, 'en');
	} else {
	    GH_SIM_FILE = ghEmakiUtilGetSimulationUri( file, lng);
	}
    }
    $.ajax({
	dataType: "json",
	url: GH_SIM_FILE
    }).done(function(data) {
	GH_SIMJSON = data;
	GH_SIM = new EmakiManager(GH_SIMJSON,GH_SIM_FILE);
	GH_SIM.initializeScene(GH_LMAP);
	$('#battlename').html( ghEmakiUtilGetStringInRange(GH_SIMJSON.scene.name,22) );
	$('#datecount').html( ghEmakiUtilGetStringInRange(GH_SIMJSON.scene.timestring,12) );
	setTimeout(ghCheckLazySheetIcons,2000);
	ghChangePlayPauseButton(false);

	requestAnimationFrame(ghUpdateFrame);

	ghShowProperty();
    }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	var msg = "history data cannot load ";
	msg += " XMLHttpRequest " + XMLHttpRequest.status ;
	msg += " textStatus " + textStatus ;
	console.log( msg );
    });

}

///////////////////////////////////////
//
//  Simulation Over
//
function ghSimulationOver(corps,unit) {
    let txt = corps + " " + GH_TXT_LOST[GH_LANG] ;
    $('#overmessage').html( txt );
    ghAppendEventReport( txt );
    ghAppendEventReport( GH_TXT_OVER[GH_LANG] );
    ghOnClickPlayPauseButton();
    $('#enablebgm').prop('checked',false); // Stop BGM
    GH_SOUND.pauseBGM();
    GH_SOUND.playEffect('gameover');

    // Close All Dialogs
    if ( $('#reportdialog').dialog('isOpen') ) $('#reportdialog').dialog('close');
    if ( $('#weaponsheetdialog').dialog('isOpen') ) $('#weaponsheetdialog').dialog('close');
    if ( $('#formationsheetdialog').dialog('isOpen') ) $('#formationsheetdialog').dialog('close');
    if ( $('#unitsheetdialog').dialog('isOpen') ) $('#unitsheetdialog').dialog('close');
    
    $('#modalover').modal('open');
    
}
    
function ghEmakiDownloadReport() {
    //var ret = $('#eventreport').val();
    let sname = GH_SIMJSON.scene.name;
    var outfilename = sname.replace(/\s+/g, '') + ".emaki.txt";
    var download = document.createElement("a");
    document.body.appendChild(download);
    download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(GH_REPORT.content));
    download.setAttribute('download', outfilename);    
    download.click();
    download.remove();
}

function ghEmakiDownloadUnitSheet() {
    if ( GH_UNIT_SHEET == null ) return;
    
    GH_UNIT_SHEET.download();
    //var ret = $('#eventreport').val();
//    var outfilename = GH_SIM.getTitle() + ".emaki.txt";
//    var download = document.createElement("a");
//    document.body.appendChild(download);
//    download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(GH_REPORT.content));
//    download.setAttribute('download', outfilename);    
//    download.click();
//    download.remove();
}


///////////////////////////////////////
//
//   Update Scene
//
function ghUpdateFrame() {
    var nowTime = new Date().getTime();
    var diffTime = nowTime - GH_LAST_TIME;

    if ( diffTime < GH_MSPF ) {
	// Too fast
	requestAnimationFrame(ghUpdateFrame);
	return;
    }
    
    if ( GH_IS_PLAYING ) {
	//
	//   Update Units
	//
	GH_SIM.updateScene( GH_LMAP );
	$('#timecount').html( GH_SIM.getCurrentTimeString() );

    } else {
	// Pause Animation
	GH_SIM.updateMarkerBar( GH_LMAP );
    }

    ////////////////////
    requestAnimationFrame(ghUpdateFrame);
    GH_LAST_TIME = nowTime;
}

///////////////////////////////////////
//
//  Communicate between 2D and 3D
//
//   Receive message from 3D window
//
function ghEmakiReceiveMessage(data) {
    if (data.type == 'GH_GETDATA') {
	GH_3DVIEW.sendMessage('GH_GETDATA_ACK',data.sender,{
	    'datafile' : GH_SIM_FILE
	});
    } else if (data.type == 'GH_GETCURRENTUNITDATA') {
	GH_3DVIEW.sendMessage('GH_GETCURRENTUNITDATA_ACK',data.sender,{
	    'currentdata' : GH_SIM.getCurrentUnitParams()
	});
    } else if (data.type == 'GH_GETCLOCK') {
	GH_3DVIEW.sendMessage('GH_GETCLOCK_ACK',data.sender,{
	    "currenttime" : GH_CLOCK.getCurrentDateTime(),
	    "speed" : GH_CLOCK.getSpeed(),
	    "isplaying" : GH_IS_PLAYING
	});
    } else if (data.type == 'UNITREADY') {

    } else {

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
    GH_3DVIEW = new EmakiBroadcast('2dto3d','emaki2d','primary',ghEmakiReceiveMessage);
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

console.log( "Geoglyph Emaki2d jQuery " + jQuery.fn.jquery + " leaflet " + L.version );


////////////////////////////////////////////////
//
//  Document Ready
//   Set up init
//

$(document).ready(function(){

    ghInitializeLeaflet();

    GH_SOUND = new EmakiSoundManager();

    ghInitializeUI();

    ghInitializeUnitSheet();

    ghInitializeWeaponSheet();

    ghInitializeFormationSheet();
    
    ghChangePlayPauseButton(false);

    //   argument load
    let args = ghEmakiUtilGetHtmlArgument("hj");
    let lng = ghEmakiUtilGetHtmlArgument("lg");
    let aitype = ghEmakiUtilGetHtmlArgument("ai");

    if ( aitype.length == 0 ) {
	GH_SIM_AI = 'none';
    } else {
	GH_SIM_AI = aitype[0];
    }
    if ( args.length == 1 ) {
	if ( lng.length == 1 ) {
	    ghLoadSimulationData(args[0],lng[0]);
	} else {
	    ghLoadSimulationData(args[0],'en');
	}
    } else {
	location.href = 'emakiselect.html';
    }
    
});

