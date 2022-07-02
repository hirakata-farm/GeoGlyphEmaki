//
//
//
//    Emaki Manager 2D 
//
//    require Leafletjs
//
//
//http://makinacorpus.github.io/Leaflet.GeometryUtil/global.html#closestOnSegment
//L.GeometryUtil.bearing(marker.center.getLatLng(),latlng);
//

//var GH_CORPS = {};
var GH_UNITS = {};
var GH_CLOCK = null;

var GH_STRUCTURE = {};
var GH_STRUCTURE_ARY = [];

var GH_FIELD = {};
var GH_FIELD_ARY = [];

//  Scene Configure
var GH_WEAPON = {};
var GH_WEAPON_ARY = [];
var GH_WEAPON_LENGTH = 0;
var GH_FORMATION = {};
var GH_FORMATION_ARY = [];
var GH_FORMATION_LENGTH = 0;

const GH_SCENE_WORKER_URI = '../js/ghEmakiSceneBroadWorker.js';

function ghEmakiLoadWeaponFile(file) {
    $.ajax({
	dataType: "json",
	url: file,
	async:false
    }).done(function(data) {
	GH_WEAPON = data;
	GH_WEAPON_LENGTH = 0;
	for(var key in GH_WEAPON){
	    if ( GH_WEAPON[key].soundeffect != null ) {
		let obj = new Object();
		obj[key] = {
		    "url" : GH_WEAPON[key].soundeffect,
		    "type" : "effect",
		    "defaultloop" : false
		};
		GH_SOUND.addSound(obj);
	    }
	    if ( GH_WEAPON[key].icon ) {
		GH_WEAPON[key].imgbase64 = null;
		let uri = ghEmakiUtilGetResourceURI(GH_RSC_WEAPONICON, GH_WEAPON[key].icon.image );
		ghEmakiUtilLoadImageToBase64(uri,16,16,GH_WEAPON[key]);
	    }

	    GH_WEAPON_LENGTH++
	}
	GH_WEAPON_ARY = new Array(GH_WEAPON_LENGTH);
	for(var key in GH_WEAPON){
	    GH_WEAPON_ARY[GH_WEAPON[key].index] = key;
	}
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
	async:false
    }).done(function(data) {
	GH_FORMATION = data;
	GH_FORMATION_LENGTH = 0;
	for(var key in GH_FORMATION){
	    GH_FORMATION_LENGTH++;
	}
	GH_FORMATION_ARY = new Array(GH_FORMATION_LENGTH);
	for(var key in GH_FORMATION){
	    GH_FORMATION_ARY[GH_FORMATION[key].index] = key;
	}
    }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	var msg = "Formation data cannot load ";
	msg += " XMLHttpRequest " + XMLHttpRequest.status ;
	msg += " textStatus " + textStatus ;
	console.log( msg );
    });
}

////////////////////////////////////////////////
//
//
//
//
//
//
//
//
//
//
function EmakiManager(json,file) {

    if ( json == null ) return;

    //  Local variables
    let sceneworker = null;
    let unitlength = 0;
    let fileuri = {
	"data" : file,
	"weapon" : null,
	"formation" : null,
	"item" : null,
	"skill" : null
    }
    let mapinit = {
	"latlng" : null,
	"zoom" : 0
    }

    //////////////////////////////////
    //
    // Private method
    //
    //  Command
    //
    var _ParseSimCommand = function(key,str) {
	if ( ! GH_UNITS[key] ) {
	    ghEmakiUtilConsole("Unit Command","Wrong unit key", key);
	    return;
	}
	let cmds = str.split(/\s/);
	let res = [];
	for ( let i=0,len=cmds.length;i<len;i++ ) {
	    let a = cmds[i];
	    a = a.replace(/^\s+|\s+$/g, "");
	    if ( a.length > 0 ) {
		res.push(a);
	    }
	}
	if ( res.length > 0 ) _ExecuteSimCommand(key,res);
    }
    var _ExecuteSimCommand = function(key,cmds) {
	if ( GH_UNITS[key] ) {
	    let status = GH_UNITS[key].getStatus(GH_STATUS_MOVE_DIGIT);
	    if ( status == GH_STATUS_RETREAT ) {
		//  Retreat unit
		return;
	    }
	} else {
	    //  No Unit
	    return;
	}
	
	switch (cmds[0]) {
	case 'route' :
	    let data = [];
	    for(let j=1,jlen=cmds.length;j<jlen;j++){
		data.push(parseFloat(cmds[j])); 
	    }
	    if ( data.length < 1 ) {
		GH_UNITS[key].setRouteAction();
	    } else {
		GH_UNITS[key].setRouteArrayAction(data);
	    }
	    break;
	case 'chase' :
	    if ( cmds[1] == 'unit' ) {
		let data = cmds[2];
		if ( GH_UNITS[data] ) {
		    GH_UNITS[key].setChaseAction(data,GH_UNITS[data].getMarkerPosition());
		} else {
		    ghEmakiUtilConsole("CommandUnit","Wrong unit key", data);
		}
	    } else {
		// NOP
	    }
	    break;
	case 'attack' :
	    if ( cmds[1] == 'unit' ) {
		let data = cmds[2];
		if ( GH_UNITS[data] ) {
		    GH_UNITS[key].setAttackAction('unit',data,GH_UNITS[data].getMarkerPosition());
		} else {		    
		    ghEmakiUtilConsole("CommandUnit","Wrong unit key", data);
		    return;
		}
	    } else if ( cmds[1] == 'structure' ) {
		// Not Yet
	    } else if ( cmds[1] == 'none' ) {
		GH_UNITS[key].setAttackAction('same',null,null);
	    } else {
		// NOP
	    }
	    break;
	case 'wait' :
	    GH_UNITS[key].setWaitAction();
	    break;
	case 'replenish' :
	    GH_UNITS[key].setAttackAction('same',null,null);//   Attack Non
	    GH_UNITS[key].setReplenishAction();
	    break;
	case 'formation' :
	    GH_UNITS[key].setFormation(cmds[1]);
	    break;
	case 'weapon' :
	    GH_UNITS[key].setWeapon(cmds[1]);
	    break;
	case 'speed' :
	    GH_UNITS[key].setSpeedParams(parseFloat(cmds[1]));
	    break;
	default:
	    // NOP
	}
    }
    //
    // Update
    //
    var _UpdateStructureStatus = function(key,actstatus,atkstatus) {
	if ( !GH_UNITS[key] ) return;
	let terid = GH_UNITS[key].getTerrainStructure();
	let res = 0;
	let bullet = 0;
	if ( terid == null ) {
	    // NOP
	} else {
	    let stkey = GH_STRUCTURE_ARY[terid];
	    if ( GH_STRUCTURE[stkey] ) {
		if ( GH_STRUCTURE[stkey].getIndex() == terid ) {
		    if ( GH_STRUCTURE[stkey].getOwner() == GH_UNITS[key].getCorps() ) {
			res = GH_STRUCTURE[stkey].getEndurance();
			GH_UNITS[key].setTerrainStructureEndurance(res);
			if ( actstatus == GH_STATUS_REPL ) {
			    GH_UNITS[key].updateReplenish(stkey,GH_REPLENISH_BULLET_PER_FRAME,GH_REPLENISH_RATION_PER_FRAME);
			}
		    }
		} else {
		    // NOP
		}
	    } else {
		// NOP
	    }
	}
    }
    var _UpdateTarget = function(key,actstatus,atkstatus) {
	//  If need , change Status
	if ( !GH_UNITS[key] ) return;
	//let status = GH_UNITS[key].getStatus(GH_STATUS_MOVE_DIGIT);
	switch (actstatus) {
	case GH_STATUS_ROUTE :
	    res = GH_UNITS[key].setRouteTarget();
	    if ( res ) {
		GH_UNITS[key].setStatus(GH_STATUS_ROUTE,GH_STATUS_MOVE_DIGIT);
	    } else {
		//  Route finished Change Status
		GH_UNITS[key].setWaitTarget();
		GH_UNITS[key].setStatus(GH_STATUS_WAIT,GH_STATUS_MOVE_DIGIT);
	    }
	    break;
	case GH_STATUS_CHASE :
	    res = GH_UNITS[key].setChaseTarget();
	    if ( res ) {
		GH_UNITS[key].setStatus(GH_STATUS_CHASE,GH_STATUS_MOVE_DIGIT);
	    } else {
		//  Chase target retreat  Change Status
		GH_UNITS[key].setWaitTarget();
		GH_UNITS[key].setStatus(GH_STATUS_WAIT,GH_STATUS_MOVE_DIGIT);
	    }
	    break;
	case GH_STATUS_WAIT :
	    GH_UNITS[key].setWaitTarget();
	    GH_UNITS[key].setStatus(GH_STATUS_WAIT,GH_STATUS_MOVE_DIGIT);
	    break;
	case GH_STATUS_REPL :
	    if ( atkstatus == GH_STATUS_ATK_NON ) {
		GH_UNITS[key].setReplenishTarget();
		GH_UNITS[key].setStatus(GH_STATUS_REPL,GH_STATUS_MOVE_DIGIT);
	    } else {
		// Attacked Change Status
		GH_UNITS[key].setWaitTarget();
		GH_UNITS[key].setStatus(GH_STATUS_WAIT,GH_STATUS_MOVE_DIGIT);
	    }
	    break;
	default :
	    // NOP
	    // Wrong status
	}
    }
    var _UpdateFrontDirection = function(key) {
	if ( !GH_UNITS[key] ) return;
	let tgt = GH_UNITS[key].getAttackAction();
	if ( tgt == null ) return;
	if ( tgt.target == null || tgt.type == 'same' ) {
	    GH_UNITS[key].setDirection('same',GH_UNITS[key].getMarkerPosition() );
	} else {
	    if ( tgt.type == 'unit' ) {
		if ( GH_UNITS[tgt.target] ) {
		    let status = GH_UNITS[tgt.target].getStatus(GH_STATUS_MOVE_DIGIT);
		    if ( status > GH_STATUS_RETREAT ) {
			GH_UNITS[key].setDirection("unit",GH_UNITS[tgt.target].getMarkerPosition() );
		    } else {
			// NOP
		    }
		} else {
		    // Wrong target key
		    // NOP
		}
	    } else {
		// Not Yet
	    }
	}
    }
    var _UpdateUnitSheet = function(key,movestatus,attackstatus) {
	let id = _GetUnitSheetRowIdx(key);
	if ( id < 0 ) return;

	GH_UNIT_SHEET.resetSelection(false); // for blur Error
	//let movestatus = GH_UNITS[key].getStatus(GH_STATUS_MOVE_DIGIT);
	//let attackstatus = GH_UNITS[key].getStatus(GH_STATUS_ATTACK_DIGIT);

	let rowdata = GH_UNITS[key].getUnitSheetRowData(id);
	//  rowdata[0] = keyid
	//  rowdata[1] = No
	//  rowdata[2] = Corps icon
	//  rowdata[3] = Name
	//  rowdata[4] = Nums
	//  rowdata[5] = Fatigue
	//  rowdata[6] = Action
	//  rowdata[7] = Target
	//  rowdata[8] = Weapon
	//  rowdata[9] = Terrain
	//  rowdata[10] = Formation
	//  rowdata[11] = Speed
	//  rowdata[12] = LeaderShip
	//  rowdata[13] = Attack
	//  rowdata[14] = Defense
	//  rowdata[15] = Luck
	GH_UNIT_SHEET.setRowData(id,rowdata);

	//  Style Color Check
	let num = id + 1;
	let cellname = 'G' + num; //  Cell Name Important
	let style = GH_UNIT_SHEET.getStyle(cellname);
	if ( movestatus < GH_STATUS_REPL ) {
	    if ( style.indexOf('silver') < 0 ) {
		GH_UNIT_SHEET.setStyle(cellname,'color','silver');
	    }
	} else {
	    if ( attackstatus == GH_STATUS_ATK_NON || attackstatus == GH_STATUS_ATK_READY ) {
		if ( style.indexOf('black') < 0 ) {
		    GH_UNIT_SHEET.setStyle(cellname,'color','black');
		}
	    } else {
		if ( style.indexOf('red') < 0 ) {
		    GH_UNIT_SHEET.setStyle(cellname,'color','red');
		}
	    }
	}


    }
    //
    // Scene Worker
    //
    var _SceneWorkerReceive = function(command,data){
	if ( command == 'GH_ORDER' ) {
	    let cmds = data.split(/\s/);
	    let key = cmds[0];
	    if ( GH_UNITS[key] ) {
		cmds.shift();
		_ExecuteSimCommand(key,cmds);
	    } else {
		console.log("Wrong Order " + data);
	    }
	} else {
	    // NOP
	}	
    }
    var _SetupSceneWorker = function(){
	if (window.Worker){
            if ( sceneworker == null ) {
		sceneworker = new Worker(GH_SCENE_WORKER_URI);
		sceneworker.addEventListener('message', function(event) {
                    var ret = event.data;
		    _SceneWorkerReceive(ret.cmd,ret.value);
		});
		sceneworker.addEventListener('error', function(err) {
                    console.error(err);
		});
            }
	} else {
            sceneworker = null;
	    console.log('Not support Web Workers');	
	}
    }
    var _CloseSceneWorker = function(){
	if ( sceneworker != null ) {
            sceneworker.terminate();
            sceneworker = null;
	}
    }
    var _SendSceneWorker = function(command,data) {
	if ( sceneworker != null ) {
	    sceneworker.postMessage({
		"cmd": command,
		"value": data });
	}
    }
    var _GetUnitSheetRowIdx = function(key) {
	let c = GH_UNIT_SHEET.getColumnData(0);
	for ( let i=0,len=c.length;i<len;i++ ) {
	    if ( c[i] == key ) {
		return i;
	    }
	}
	return -1;
    }
    var _RetireUnit = function(key) {
	let p = GH_UNITS[key].getMarkerPosition();
	if ( p == null ) return;

	GH_UNITS[key].clearUnit(GH_LMAP);
	let name = GH_UNITS[key].getName();
	let sttext = GH_TXT_STATUS[GH_STATUS_RETREAT][GH_LANG];
	
	ghAppendEventReport( name + " " + sttext );
	for(var ckey in GH_SIMJSON.corps){
	    if ( GH_SIMJSON.corps[ckey].general == key ) {
		ghSimulationOver(GH_SIMJSON.corps[ckey].name,key);
		_SendSceneWorker('simulationover',{
		    "corps" : ckey,
		    "unit" : key,
		    "elapsed" : GH_CLOCK.getElapsed(),
		    "timestring" : GH_CLOCK.getCurrentTimeString()
		});
	    }
	}

    }


    ///////////////////////////////////////
    // 
    //  External Method
    //
    this.initializeScene = function(map) {
	map.panTo( mapinit.latlng );
	map.setZoom( mapinit.zoom );
	for(var key in GH_UNITS ){
	    GH_UNITS[key].drawMarker2DMap(map);
	    GH_UNITS[key].drawCircle2DMap(map);

	    let strcmd = GH_UNITS[key].getInitialCommand();
	    for ( var i=0,len=strcmd.length;i<len;i++ ) {
		_ParseSimCommand(key,strcmd[i]);
	    }
	}

	for(var key in GH_STRUCTURE){
	    GH_STRUCTURE[key].draw2DMap(map,key);
	}
	for(var key in GH_FIELD){
	    GH_FIELD[key].draw2DMap(map);
	}

    }

    this.setMapPosition = function(map,key) {
	if ( key == null ) {
	    map.panTo( initlatlng );
	    map.setZoom( initzoom );
	} else {
	    if ( GH_UNITS[key] )  {
		let m = GH_UNITS[key].getMarkerPosition();
		if ( m != null ) map.panTo( m );
	    } else {
		ghEmakiUtilConsole("setMapPosition","Wrong unit key", key);
	    }
	}
    }
    this.drawMarker = function(map) {
	for(var key in GH_UNITS ){
	    GH_UNITS[key].drawMarkerMap(map,key);
	}
    }
    this.drawNodes = function(map) {
	for(var key in GH_UNITS ){
	    GH_UNITS[key].drawNodesMap(map);
	}
    }
    this.getCurrentTimeString = function() {
	return GH_CLOCK.getCurrentTimeString();
    }
    this.getUnitName = function(key,type) {
	if ( type == 'unit' ) {
	    if (GH_UNITS[key]){
		return GH_UNITS[key].getName();
	    } else {
		ghEmakiUtilConsole("getUnitName","Wrong Unit key", key);
		return null;
	    }
	} else if ( type == 'structure' ) {
	    if (GH_STRUCTURE[key]){
		return GH_STRUCTURE[key].getName();
	    } else {
		ghEmakiUtilConsole("getUnitName","Wrong Structure key", key);
		return null;
	    }
	} else {
	    return 'point';
	}
    }
    this.getUnitDescription = function(key,type) {
	if ( type == 'unit' ) {
	    if (GH_UNITS[key]){
		return GH_UNITS[key].getDescription();
	    } else {
		ghEmakiUtilConsole("getUnitDescription","Wrong Unit key", key);
		return null;
	    }
	} else if ( type == 'structure' ) {
	    if (GH_STRUCTURE[key]){
		return GH_STRUCTURE[key].getDescription();
	    } else {
		ghEmakiUtilConsole("getUnitDescription","Wrong Structure key", key);
		return null;
	    }
	} else {
	    return null;
	}
    }
    this.getUnitStatus = function(key) {
	if (GH_UNITS[key]){
	    return {
		'move' : GH_UNITS[key].getStatus(GH_STATUS_MOVE_DIGIT),
		'attack' : GH_UNITS[key].getStatus(GH_STATUS_ATTACK_DIGIT),
		'formation' : GH_UNITS[key].getStatus(GH_STATUS_FORMATION_DIGIT),
		'weapon' : GH_UNITS[key].getStatus(GH_STATUS_WEAPON_DIGIT)		
	    }
	} else {
	    return {
		'move' : GH_STATUS_INIT,
		'attack' : GH_STATUS_ATK_NON,
		'formation' : 0,
		'weapon' : 0
	    }
	    ghEmakiUtilConsole("getUnitStatus","Wrong unit key", key);
	}
    }
    this.getUnitAction = function(key,type) {
	if ( GH_UNITS[key] )  {
	    if ( type == 'move' ) {
		return GH_UNITS[key].getMoveAction();
	    } else if ( type == 'attack' ) {
		return GH_UNITS[key].getAttackAction();
	    } else {
		// NOP
	    }
	} else {
	    ghEmakiUtilConsole("get Unit Actionr","Wrong unit key", key);
	}
    }
    this.getUnitMarker = function(key) {
	if ( GH_UNITS[key] )  {
	    return GH_UNITS[key].getMarker();
	} else {
	    ghEmakiUtilConsole("get Unit Marker","Wrong unit key", key);
	}
    }
    this.getRoutePolyline = function(key) {
	if (GH_UNITS[key]){
	    return GH_UNITS[key].getRoutePolyline();
	    //return L.Polyline.Plotter(pp,{ weight: 3, color: '#e11'});
	} else {
	    return null;
	}
    }
    this.setRoutePolyline = function(key,latlngs) {
	if (GH_UNITS[key]){
	    GH_UNITS[key].setRoutePolyline(latlngs);
	} else {
	    return null;
	}
    }
    this.getUnitWeaponList = function(key) {
	if (GH_UNITS[key]){
	    return GH_UNITS[key].getWeaponList();
	} else {
	    ghEmakiUtilConsole("getUnitWeaponList","Wrong unit key", key);
	    return null;
	}
    }
    this.getUnitFormationList = function(key) {
	if (GH_UNITS[key]){
	    return GH_UNITS[key].getFormationList();
	} else {
	    ghEmakiUtilConsole("getUnitFormationList","Wrong unit key", key);
	    return null;
	}
    }
    this.getUnitSpeedParams = function(key) {
	if (GH_UNITS[key]){
	    return GH_UNITS[key].getSpeedParams();
	} else {
	    ghEmakiUtilConsole("getUnitSpeedParams","Wrong unit key", key);
	    return null;
	}
    }
    this.getUnitWeaponSector = function(key) {
	if (GH_UNITS[key]){
	    return GH_UNITS[key].getWeaponRangeSector();
	} else {
	    return null;
	}
    }
    this.setupUnitSheet = function(sheet) {
	if ( sheet == null ) return;

	let rowidx = 1;
	let data = null;
	let isgeneral = false;
	for(var key in GH_UNITS){
	    isgeneral = false;
	    data = GH_UNITS[key].getUnitSheetRowData(rowidx);
	    let corpskey = GH_UNITS[key].getCorps();
	    if ( key == GH_SIMJSON.corps[corpskey].general ) isgeneral = true;

	    sheet.insertRow(data,rowidx );

	    let num = rowidx + 1;
	    //  Icon Columns
	    let cellname = 'C' + num;
	    sheet.setStyle(cellname,'cursor','pointer');

	    //  Name Columns
	    cellname = 'D' + num;
	    sheet.setStyle(cellname,'color',GH_SIMJSON.corps[corpskey].color);
	    if ( isgeneral ) {
		sheet.setStyle(cellname,'font-weight','bold');
	    }

	    //  Action Columns
	    cellname = 'E' + num;
	    sheet.setStyle(cellname,'color','black');
	    
	    rowidx++;
	}
	
	//  Check fitst NULL rows
	let d = sheet.getRowData(0);
	if ( d[0] == '' && d[1] == '' ) sheet.deleteRow(0);
	
    }
    this.setupWeaponSheet = function(sheet,cols) {
	if ( sheet == null ) return;

	let rowidx = 1;
	for(var key in GH_WEAPON){
	    let data = [];
	    data[0] = key;
	    data[1] = GH_WEAPON[key].index + 1;
	    data[2] = GH_WEAPON[key].imgbase64;
	    data[3] = GH_WEAPON[key].description[GH_LANG];
	    data[4] = GH_WEAPON[key].range;
	    data[5] = GH_WEAPON[key].comsumption;
	    data[6] = GH_WEAPON[key].rapid;
	    data[7] = GH_WEAPON[key].power;
	    data[8] = GH_WEAPON[key].regist;	    	    
	    sheet.insertRow(data,rowidx );
	    rowidx++;
	}

	//  Check fitst NULL rows
	let d = sheet.getRowData(0);
	if ( d[0] == '' && d[1] == '' ) sheet.deleteRow(0);
	
    }
    this.setupFormationSheet = function(sheet,cols) {
	if ( sheet == null ) return;

	let rowidx = 1;
	for(var key in GH_FORMATION){
	    let data = [];
	    data[0] = key ;
	    data[1] = GH_FORMATION[key].index + 1;
	    data[2] = GH_FORMATION[key].description[GH_LANG];
	    data[3] = GH_FORMATION[key].attack ;
	    data[4] = GH_FORMATION[key].defense ;
	    data[5] = ' '; // Not Yet GH_FORMATION[key].skill
	    sheet.insertRow(data,rowidx );
	    rowidx++;
	}

	//  Check fitst NULL rows
	let d = sheet.getRowData(0);
	if ( d[0] == '' && d[1] == '' ) sheet.deleteRow(0);
	
    }
    
    this.selectUnitSheet = function(key) {
	let id = _GetUnitSheetRowIdx(key);
	if ( id < 0 ) {
	    return;
	} else {
	    GH_UNIT_SHEET.resetSelection(true);
	    GH_UNIT_SHEET.updateSelectionFromCoords(0, id, GH_UNIT_SHEET_COLS-1, id);
	}

    }
    this.isUnitIconLoaded = function() {
	let res = true;
	for(var key in GH_UNITS){
	    if ( GH_UNITS[key].getMarkerBase64() == null ) {
		res = false;
	    }
	}
	return res;
    }
    this.isWeaponIconLoaded = function() {
	let res = true;
	for(var key in GH_WEAPON){
	    if ( GH_WEAPON[key].icon ) {
		if ( GH_WEAPON[key].imgbase64 == null ) {
		    res = false;
		}
	    }
	}
	return res;
    }

    this.setUnitCommand = function(unitkey,commands) {
	if ( ! GH_UNITS[unitkey] ) {
	    ghEmakiUtilConsole("Unit Command","Wrong unit key", unitkey);
	    return;
	}
	_ExecuteSimCommand(unitkey,commands);
    }
    this.changePlayPause = function(isplaying) {
	if ( isplaying ) {
	    GH_CLOCK.play();
	} else {
	    GH_CLOCK.pause();
	}
	for(var key in GH_UNITS){
	    GH_UNITS[key].changePlayPause({
		"isplaying" : isplaying,
		"elapsed" : GH_CLOCK.getElapsed()
	    });
	}
	_SendSceneWorker('playpause',{
		"isplaying" : isplaying,
		"elapsed" : GH_CLOCK.getElapsed()
	});
    }
    this.setSimulationSpeed = function(value) {
	GH_CLOCK.setSpeed(value);
	let d = {
	    "speed" : value,
	    "elapsed" : GH_CLOCK.getElapsed()
	}
	for(var key in GH_UNITS){
	    GH_UNITS[key].setSimulationSpeed(d);
	}
	_SendSceneWorker('simulationspeed',d);
    }
    this.setBroadcastRate = function(value) {
	_SendSceneWorker('transferinterval',{ "mspf" : GH_MSPF, "rate" : value });
    }
    this.getCurrentUnitParams = function() {
	var ret = {};
	for(var key in GH_UNITS){
	    ret[key] = {
		"corps" : GH_UNITS[key].getCorps(),
		"status" : GH_UNITS[key].getStatus(GH_STATUS_RAW_DIGIT),
		"latlng" : GH_UNITS[key].getMarkerPosition(),
		"direction" : GH_UNITS[key].getFrontBearing(),
		"nodes" : GH_UNITS[key].getNodes()
	    }
	}
	return ret;	
    }
    this.updateMarkerBar = function(map) {
	for(var key in GH_UNITS){
	    GH_UNITS[key].updateMarker2DMap(map,GH_ICON_BAR_TYPE);
	}
    }
    this.updateScene = function(map) {
	let elapsedtime = GH_CLOCK.update();
	for(var key in GH_UNITS){
	    let actstatus = GH_UNITS[key].getStatus(GH_STATUS_MOVE_DIGIT);
	    let atkstatus = GH_UNITS[key].getStatus(GH_STATUS_ATTACK_DIGIT);
	    if ( actstatus < GH_STATUS_REPL ) {
		// NOP
	    } else {

		_UpdateStructureStatus(key,actstatus,atkstatus);
		_UpdateTarget(key,actstatus,atkstatus);
		
		// Update Current Direction
		_UpdateFrontDirection(key);
		    
		//  Update Position
		GH_UNITS[key].updateMarker2DMap(map,GH_ICON_BAR_TYPE);
		GH_UNITS[key].updateCircle2DMap(map);

	    }

	    // Check Unit Fatigue
	    //  for simulation over
	    if ( GH_UNITS[key].getFatigue() > GH_FATIGUE_MAX || actstatus == GH_STATUS_RETREAT ) {
		// re-treat !!
		_RetireUnit(key);
	    }

	    // Update Unit Data
	    _UpdateUnitSheet(key,actstatus,atkstatus);

	}

    }



    ////////////////////////
    //
    //
    //   Initialize
    //
    //
    //
    
    //  Scene
    if ( json.scene.starttime ) {
	GH_CLOCK = new EmakiClock(json.scene.timestring,json.scene.starttime);
    }
    if ( json.scene.latlng ) {
	mapinit.latlng = L.latLng(json.scene.latlng[0], json.scene.latlng[1]) ;
    }
    if ( json.scene.zoom ) {
	mapinit.zoom = ghEmakiUtilGetNumberInRange(json.scene.zoom,1,18);
    }
    //  Configure
    if ( json.configure.damagepernodes ) {
	GH_ATTACK_DAMAGE_PER_NODES = parseFloat(json.configure.damagepernodes);
    }
    if ( json.configure.weapon ) {
	fileuri.weapon = ghEmakiUtilGetResourceURI(GH_RSC_DATA, json.configure.weapon );
	ghEmakiLoadWeaponFile(fileuri.weapon);
    }
    if ( json.configure.formation ) {
	fileuri.formation = ghEmakiUtilGetResourceURI(GH_RSC_DATA, json.configure.formation );
	ghEmakiLoadFormationFile(fileuri.formation);
    }
    //
    //  Unit Data
    //
    unitlength = 0;
    for(var key in json.units){
	GH_UNITS[key] = new EmakiUnit( key, json.units[key] , json.scene.starttime , GH_ATTACK_DAMAGE_PER_NODES );
	unitlength++;
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
	var mapstruct = json.map.structure;
	var count = 0;
	for(var key in mapstruct ){
	    GH_STRUCTURE[key] = new EmakiStructure( key, count, mapstruct[key] , 'icon', GH_ATTACK_DAMAGE_PER_NODES);
	    GH_STRUCTURE_ARY.push(key);
	    count++;
	}
	for ( let i=0,len=GH_STRUCTURE_ARY.length;i<len;i++ ) {
	    var key = GH_STRUCTURE_ARY[i];
	    stary.push ( mapstruct[key] );
	}
    }
    
    //  Fields Data
    let fdary = [];
    if ( json.map.field == null  ) {
	// NOP
    } else {
	var mapfield = json.map.field;
	var count = 0;
	for(var key in mapfield ){
	    GH_FIELD[key] = new EmakiField( key, count, mapfield[key]);
	    GH_FIELD_ARY.push(key);
	    count++;
	}
	for ( let i=0,len=GH_FIELD_ARY.length;i<len;i++ ) {
	    var key = GH_FIELD_ARY[i];
	    fdary.push ( mapfield[key] );
	}
    }

    //
    // Set up External files Object for Worker Thread
    for(var key in GH_UNITS){
	GH_UNITS[key].setExternalFiles("weaponfile",fileuri.weapon);
	GH_UNITS[key].setExternalFiles("formationfile",fileuri.formation);
	if ( stary.length > 0 ) GH_UNITS[key].setStructure(stary);
	if ( fdary.length > 0 ) GH_UNITS[key].setField(fdary);
    }

    //
    //  Set Up Scene Worker
    //
    _SetupSceneWorker();
    _SendSceneWorker('loaddata',{ "json" : json, "file" : fileuri.data });
    _SendSceneWorker('sharedunits',sharedunits);

    
}

