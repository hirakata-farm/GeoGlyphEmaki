//
//
//
//
//
//
// L.GeometryUtil.rotatePoint
//

const GH_UNIT_WORKER_URI = '../js/ghEmakiUnit2dSimWorker.js';

const GH_METER_IN_TARGET_POINT = 3;
const GH_ROUTE_PATH_LAT = 0.002;


/////////////////////////////
//
//    2D marker parameter
//

const GH_MARKER_ARROW = {
    "longscale" : 0.0004,
    "longwidth" : 2,
    "longcolor" : '#b71c1c',
    "shortscale" : 0.0002,
    "shortwidth" : 4,
    "shortcolor" : '#000'
}

const GH_BAR_ICON_URI = [
    '../images/Fbar00.png',
    '../images/Fbar01.png',
    '../images/Fbar02.png',
    '../images/Fbar03.png',
    '../images/Fbar04.png',
    '../images/Fbar05.png',
    '../images/Fbar06.png',
    '../images/Fbar07.png',
    '../images/Fbar08.png',
    '../images/Fbar09.png',
    '../images/Fbar10.png',
    '../images/Fbar11.png',
    '../images/Fbar12.png',
    '../images/Fbar13.png',
    '../images/Fbar14.png',
    '../images/Fbar15.png'
];

function EmakiUnit(unitkey,json,starttime,dpn) {

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
    // Speed-Fatigue Function f(x) = a * x^2 + 0.5;
    // f(normal) = 1;
    // f(0) = 0.5;
    // Speed-Fatigue Coeff,  a = 0.5 / ( normal^2 ) ;
//    let weapon = {};
//    let formation = {};
    
    let stime = starttime;
    let damagepernodes = dpn;

    // Unit Shared Array
    let unitarraybuffer = null;
    let unitarray = null;

    // for all nodes data
    let nodearraybuffer = null;
    let nodearray = null;

    let moveaction  =  { 
	"command" : "none" ,  // [ route , chase , wait, replenish, none ]
	"target" : null,      // Target Unit key
	"latlng" : null,      // Target L.LatLng
	"speed" : 0,          // Current Move Speed
	"routeid" : 0,        // Target index in Route corrdinate array
	"route" : []          // Route corrdinate array [ L.latlng, L.latlng  .... ]
    };
    let attackaction  =  { 
	"type"   : null,      // Target Type [ unit, structure, same .. ]
	"target" : null,      // Target Unit key  [ = null , if attack off ]
	"latlng" : null,      // Target L.LatLng
	"weapon" : null,      // Current Weapon Key
	"formation" : null    // Current Formation Key 
    };
    let weapon = {};          //  Weapon key list , this unit use.
    let formation = {};       //  Formation key list , this unit select.

    let sharedunits = {};    // Shared Memory unit data

    //  Thread Worker
    let unitworker = null;  // Thread for calculate position

    let marker = {             // Leaflet marker
	"uri" : null,          // center marker uri
	"imgbase64" : null,    // center marker Icon Base64
     	"center" : null,       //L.marker,
     	"bariconidx" : 0,      // Bar icon index
	"frontarrow" : null ,  //L.polyline,
	"movearrow" : null ,   //L.polyline,
	"circles" : []           // [L.CircleMarker],
    };
    let explosion = {         // Leaflet marker
	"uri" : null,
	"marker" : null,
     	"point" : null,       //L.marker,
     	"time" : 3000         // remove time [mili-sec]
    }
    var initdata = {
	"strength" : 0,
	"distance" : 3,
	"latlng" : null,
	"ration" : 0,
	"bullet" : 0,
	"command" : []
    };

    ////////////////////////////
    //  Private functions
    var _InitData = function(data,node,stock) {
	initdata.strength = ghEmakiUtilGetNumberInRange(node.strength,1,1000000);
	initdata.distance = ghEmakiUtilGetNumberInRange(node.distance,1,1000);	
	initdata.latlng = L.latLng(parseFloat(data.latlng[0]), parseFloat(data.latlng[1]));
	initdata.ration = ghEmakiUtilGetNumberInRange(stock.ration,0,10000000);
	initdata.bullet = ghEmakiUtilGetNumberInRange(stock.bullet,0,10000000);	
	initdata.command = data.command;
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
		moveaction.speed = ability.speed.normal;
	    } else {
		moveaction.speed = 1.0;
	    }
	}
    }
    var _InitWeaponList = function(ary) {
	for ( let i =0,ilen=ary.length;i<ilen;i++ ) {
	    let key = ary[i];
	    if ( GH_WEAPON[key] ) {
		weapon[key] = GH_WEAPON[key];
	    }
	}
    }
    var _GetWeaponKey = function(idx) {
	for(var key in weapon){
	    if ( weapon[key].index == idx ) {
		return key;
	    }
	}
	return null;
    }
    var _InitFormationList = function(ary) {
	for ( let i =0,ilen=ary.length;i<ilen;i++ ) {
	    let key = ary[i];
	    if ( GH_FORMATION[key] ) {
		formation[key] = GH_FORMATION[key];
	    }
	}
    }
    var _GetFormationKey = function(idx) {
	for(var key in formation){
	    if ( formation[key].index == idx ) {
		return key;
	    }
	}
	return null;
    }

    var _GetTerrain = function(type) {
	let val = unitarray[ghterrainidx];
	return ghEmakiTerrainGet(val,type);
    }
    var _SetTerrain = function(value,type) {
	let val = unitarray[ghterrainidx];
	unitarray[ghterrainidx] = ghEmakiTerrainSet(val,value,type);
    }
    var _GetStatus = function(type) {
	let a = unitarray[ghstatusidx];
	return ghEmakiStatusGet(a,type);
    }
    var _SetStatus = function(value,type) {
	let a = unitarray[ghstatusidx];
	unitarray[ghstatusidx] = ghEmakiStatusSet(a,value,type);
    }
    var _GetFatigue = function() {
	var fat = unitarray[ghfatigueidx];
	return Math.floor(fat);
    }
    var _GetMyBullet = function() {
	var b = unitarray[ghbulletidx];
	return Math.floor(b);
    }
    var _SetMyBullet = function(val) {
	if ( val < 0 ) val = 0;
	if ( val > initdata.bullet ) val = initdata.bullet ;
	unitarray[ghbulletidx] = Math.floor(val);
    }
    var _MarkerTooltip = function() {
	var txt = "<B>" + name + "</B><BR>" + GH_TXT_NODES[GH_LANG] + ":" + parseInt(unitarray[ghnodesidx],10);
	txt += "<BR>" + GH_TXT_FATIGUE[GH_LANG] + ":" + _GetFatigue();
	txt += "<BR>" + GH_TXT_BULLET[GH_LANG] + ":" + _GetMyBullet();
	return txt;
    }
    var _InitMarker = function(data) {
	if ( data ) {
	    let latlng = initdata.latlng;
	    let w = data.width|0;
	    let h = data.height|0;
	    let ih = ( h / 2 )|0;
	    let iw = ( w / 2 )|0;
	    let ph = -1 * iw;
	    marker.uri = ghEmakiUtilGetResourceURI(GH_RSC_FACEICON, data.image );
	    ghEmakiUtilLoadImageToBase64(marker.uri,16,16,marker);
	    let uicon = L.icon({
		iconUrl:      marker.uri,
		iconSize:     [w, h],    // size of the icon
		iconAnchor:   [iw, ih],   // point of the icon which will correspond to marker's location
		popupAnchor:  [0, ph],   // point from which the popup should open relative to the iconAnchor
		shadowUrl:    GH_BAR_ICON_URI[0],		
		shadowSize:   [46, 14],  // size of the shadow
		shadowAnchor: [23, h-7]     // size of the shadow
	    });
	    marker.center = L.marker(latlng, {icon: uicon});
	    marker.fbaridx = 0;
	    marker.center.on('click', ghOnClickMarker);   // ghEamki2d.js
	    marker.center.on('dblclick', ghOnDoubleClickMarker);   // ghEamki2d.js	    
	    marker.center.bindTooltip(_MarkerTooltip);

	    var p0 = latlng;
	    var p1 = L.latLng(latlng.lat+ GH_MARKER_ARROW.longscale ,latlng.lng);
	    //var p2 = L.GeometryUtil.rotatePoint(GH_LMAP,p1, GH_UNIT[uid].arrowangle, p0);
	    marker.movearrow = new L.polyline([p0,p1],{weight: GH_MARKER_ARROW.longwidth , color: GH_MARKER_ARROW.longcolor }).arrowheads();

	    var p1 = L.latLng(latlng.lat+ GH_MARKER_ARROW.shortscale ,latlng.lng);
	    marker.frontarrow = new L.polyline([p0,p1],{weight: GH_MARKER_ARROW.shortwidth , color: GH_MARKER_ARROW.shortcolor}).arrowheads();
	}
    }
    var _InitCircle = function(data) {
	if ( data ) {
	    let num = initdata.strength;
	    let latlng = initdata.latlng;
	    var r = GH_METER_PER_NODE * Math.sqrt(num) * GH_LAT_DEG_PER_METER;
	    for ( var i =0;i<num;i++ ) {
		let l = ghEmakiUtilRandomInRange(0.00001,r);
		let thaeta = ghEmakiUtilRandomInRange(0,2 * Math.PI);
		let dx = l * Math.cos(thaeta);
		let dy = l * Math.sin(thaeta);
		marker.circles[i] = L.circleMarker([latlng.lat+dy,latlng.lng+dx], {
		    color: data.color,
		    fillColor: data.fillcolor,
		    fillOpacity: 0.5,
		    radius: data.radius
		});
	    }
	}
    }

    
    var _getBarIconIndex = function(bartype) {
	let maxval = GH_BAR_ICON_URI.length;
	let ret = 0;
	if ( bartype == GH_ICON_BAR_FATIGUE ) {
	    ret = Math.floor(maxval * ( unitarray[ghfatigueidx] / GH_FATIGUE_MAX  ) );
	} else if ( bartype == GH_ICON_BAR_STRENGTH ) {
	    ret = Math.floor(maxval * ( unitarray[ghnodesidx] / initdata.strength  ) );
	} else if ( bartype == GH_ICON_BAR_BULLET ) {
	    ret = Math.floor(maxval * ( unitarray[ghbulletidx] / initdata.bullet  ) );
	} else {
	    //  Default fatigue
	    ret = Math.floor(maxval * ( unitarray[ghfatigueidx] / GH_FATIGUE_MAX  ) );
	}
	if ( ret < 0 ) {
            ret = 0;
	} else if ( ret > maxval - 1 ) {
            ret = maxval - 1 ;
	} else {
	    //NOP calc before
	}
	return ret;
    }
    var _RemoveMarker = function(map) {
	if ( marker.center ) map.removeLayer(marker.center);
	if ( marker.movearrow ) map.removeLayer(marker.movearrow);
	if ( marker.frontarrow ) map.removeLayer(marker.frontarrow);
	marker.center = null;
	marker.movearrow = null;
	marker.frontarrow = null;
    }
    var _RemoveCircles = function(map) {
	for ( var i=0,len=marker.circles.length;i<len;i++ ) {
	    if ( marker.circles[i] ) map.removeLayer(marker.circles[i]);
	}
	marker.circles = [];
    }
    var _CreateExplosionMarker = function() {
	let w = 27;
	let h = 29;
	let ih = ( h / 2 )|0;
	let iw = ( w / 2 )|0;
	let ph = -1 * iw;
	explosion.uri = ghEmakiUtilGetResourceURI( "objecticons" , 'flashanim.png' );
	let l = L.icon({
	    iconUrl:      explosion.uri,
	    iconSize:     [w, h], // size of the icon
	    shadowSize:   [w, h], // size of the shadow
	    iconAnchor:   [iw, ih], // point of the icon which will correspond to marker's location
	    popupAnchor:  [0, ph] // point from which the popup should open relative to the iconAnchor
	});
	return L.marker(L.latLng(0,0), {icon: l});
    }
    var _DrawExplosion = function(map,point) {
	if ( explosion.marker ) {
	    // NOP
	} else {
	    explosion.marker = _CreateExplosionMarker();
	    explosion.marker.addTo(map);
	}
	explosion.marker.setLatLng(point);
	setTimeout(_RemoveExplosion,explosion.time);
    }
    var _RemoveExplosion = function() {
	if ( explosion.marker ) {
	    GH_LMAP.removeLayer(explosion.marker);
	    explosion.marker = null;
	}
    }
    var _SetupSharedArray = function() {
	if(window.SharedArrayBuffer){
	    let length = initdata.strength;
	    try{
		nodearraybuffer = new SharedArrayBuffer(ghnode2dbytes * length);
		nodearray = new Float64Array(nodearraybuffer);
		unitarraybuffer = new SharedArrayBuffer(ghunit2dbytes);
		unitarray = new Float64Array(unitarraybuffer);
	    }catch(e){
		ghEmakiUtilConsole("SetupSharedArray","Failed Node Shared Memory allocate ",null);
	    }
	} else {
            alert("Cannot work property for disable shared array setting");
	    console.log("Shared Array API Not supported ");
	}
    }
    var _InitNodesSharedArray = function() {
	var idx = 0;
	let num = initdata.strength;
	for ( var i =0;i<num;i++ ) {
	    var l = marker.circles[i].getLatLng();
	    idx = i * ghnode2delems;
	    nodearray[idx] = l.lat;
	    nodearray[idx+1] = l.lng;
	}
    }
    var _InitUnitSharedArray = function() {
	let latlng = initdata.latlng;
	unitarray[ghstatusidx] = GH_STATUS_INITIALIZE;
	unitarray[ghnodesidx] = initdata.strength;
	unitarray[ghlatidx] = latlng.lat;
	unitarray[ghlngidx] = latlng.lng;
	unitarray[ghfrontdiridx] = 0.0;  // north
	unitarray[ghmovediridx] = 0.0;
	unitarray[ghvelocityidx] = moveaction.speed;
	unitarray[ghformationsizeidx] = GH_FORMATIONSIZE_INITIALIZE;
	unitarray[ghrationidx] = initdata.ration;
	unitarray[ghbulletidx] = initdata.bullet;
	//unitarray[ghrightsizeidx] = 1.0;
	//unitarray[ghleftsizeidx] = 1.0;
	//unitarray[ghbacksizeidx] = 1.0;
	unitarray[ghfatigueidx] = 0.0;
	unitarray[ghtargetlatidx] = 0.0;
	unitarray[ghtargetlngidx] = 0.0;   
	unitarray[ghterrainidx] = GH_TERRAIN_INITIALIZE;
    }
    //////////////////
    var _SetMoveDirection = function(latlng){
	unitarray[ghtargetlatidx] = latlng.lat;
	unitarray[ghtargetlngidx] = latlng.lng;
	let a = L.GeometryUtil.bearing(marker.center.getLatLng(),latlng);
	// convert 0 - 360 -> -180 - +180
	if ( a > 180 ) a = a - 360.0;
	unitarray[ghmovediridx] = a;
    }
    var _SetFrontDirection = function(type,mylatlng,targetlatlng){
	if ( type == 'same' ) {
	    unitarray[ghfrontdiridx] = unitarray[ghmovediridx] ;
	} else {
	    // convert 0 - 360 -> -180 - +180
	    let a = L.GeometryUtil.bearing(mylatlng,targetlatlng);
	    if ( a > 180 ) a = a - 360.0;
	    unitarray[ghfrontdiridx] = a;
	}
    }
    ///////////////////////////////////////////
    var _UnitWorkerReceive = function(command,corps,unit,data){
	if ( command == 'attackeddamage' ) {
	    let damage = data.damage;
	    let attacker = data.attacker;
	    // unit = attacked unit ( damaged )
	    GH_UNITS[unit].setAttackedDamage(attacker,damage);
	    
	    let txt = GH_UNITS[attacker].getName() + " " + GH_TXT_ATTACK[GH_LANG] + " " + GH_UNITS[unit].getName();
	    ghAppendEventReport( txt );
	    _DrawExplosion(GH_LMAP,L.latLng(data.lat,data.lng));
	    GH_3DVIEW.sendMessage('GH_EXPLOSION','all',{
		"unit" : myid,
		"lat" : data.lat,		
		"lng" : data.lng
	    });
	    GH_SOUND.playEffect( _GetWeaponKey( _GetStatus(GH_STATUS_WEAPON_DIGIT) ) );

	} else if ( command == 'damagenode' ) {
	    let nlen = marker.circles.length;
	    if ( data > nlen ) data = nlen;
	    let idx = nlen-1;
	    for ( var i=0;i<data;i++ ) {
		if ( marker.circles[idx-i] ) {
		    GH_LMAP.removeLayer(marker.circles[idx-i]);
		}
	    }
	    marker.circles.splice(idx-data+1); // array remove cnt
	    let txt = name + GH_TXT_DAMAGE[GH_LANG] + data;
	    ghAppendEventReport( txt );
	} else if ( command == 'attackunit' ) {

	} else if ( command == 'criticalattack' ) {

	} else {

	}
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
    ///////////////////////////////////////////


    
    ////////////////////////
    //
    // External Functions
    //
    this.getName = function() {
	return name;
    }
    this.getDescription = function() {
	return description;
    }
    this.getHostility = function() {
	return hostility;
    }
//    this.initUnitSheetRowData = function(num) {
//	let ary = Array(16);
//	//  array order see ghEmakiMain2d.js ghInitializeUnitSheet()
//	ary[0] = myid;
//	ary[1] = num;
//	ary[2] = marker.imgbase64;
//	ary[3] = name;
//	ary[4] = 'wait';
//	ary[5] = 'normal';
//	ary[6] = Math.floor(unitarray[ghnodesidx]) ;
//	ary[7] = Math.floor(unitarray[ghfatigueidx]) ;
//	ary[8] = 'none';
//	ary[9] = 'none';
//	ary[10] = 'none';
//	ary[11] = 0.0; //  Speed
//	ary[12] = ability.leadership ;
//	ary[13] = ability.attack;
//	ary[14] = ability.defense ;
//	ary[15] = ability.luck ;	
//	return ary;
//    }
    this.getUnitSheetRowData = function(num) {
	let ary = Array(16);
	let mstatus = _GetStatus(GH_STATUS_MOVE_DIGIT);
	let astatus = _GetStatus(GH_STATUS_ATTACK_DIGIT);
	let terrain = _GetTerrain(GH_TERRAIN_STRUCT_DIGIT);
	
	//  array order see ghEmakiMain2d.js ghInitializeUnitSheet()
	ary[0] = myid;
	ary[1] = num;
	ary[2] = marker.imgbase64;
	ary[3] = name;
	ary[4] = Math.floor(unitarray[ghnodesidx]);
	ary[5] = _GetFatigue();
	ary[6] = GH_TXT_STATUS[mstatus][GH_LANG];
	if ( astatus == GH_STATUS_ATK_NON || astatus == GH_STATUS_ATK_NON_ATTACKED ) {
	    if ( mstatus == GH_STATUS_CHASE ) {
		ary[7] = GH_UNITS[moveaction.target].getName() ;
	    } else {
		ary[7] = ' ';
	    }
	} else {
	    if ( attackaction.target == null ) {
		ary[7] =  ' ';
	    } else {
		ary[7] = GH_UNITS[attackaction.target].getName();
	    }
	}
	let key = _GetWeaponKey( _GetStatus(GH_STATUS_WEAPON_DIGIT) )
	if ( key == null ) {
	    ary[8] = ' ';
	} else {
	    ary[8] = weapon[key].description[GH_LANG];
	}

	//let ttt = name + " " + terrain;
	//console.log(ttt);
	if ( terrain == GH_TERRAIN_STRUCT_NON ) {
	    ary[9] = ' ';
	} else {
	    if ( GH_STRUCTURE[ GH_STRUCTURE_ARY[terrain] ] ) {
		if ( GH_STRUCTURE[ GH_STRUCTURE_ARY[terrain] ].getIndex() == terrain ) {
		    ary[9] = GH_STRUCTURE[ GH_STRUCTURE_ARY[terrain] ].getName();
		} else {
		    ary[9] = ' ';
		}
	    } else {
		ary[9] = ' ';
	    }
	}
	key = _GetFormationKey( _GetStatus(GH_STATUS_FORMATION_DIGIT) );
	if ( key == null ) {
	    ary[10] = ' ';
	} else {
	    ary[10] = formation[key].description[GH_LANG];
	}

	if ( mstatus == GH_STATUS_CHASE || mstatus == GH_STATUS_ROUTE ) {
	    ary[11] = moveaction.speed;
	} else {
	    ary[11] = 0;
	}

	ary[12] = ability.leadership ;
	ary[13] = ability.attack ;
	ary[14] = ability.defense ;
	ary[15] = ability.luck;	

	return ary;
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
    this.getAbility = function() {
	return ability;
    }
    this.getCorps = function() {
	return corps;
    }
    this.getInitialCommand = function() {
	return initdata.command;
    }
    this.getMarkerPosition = function() {
	if ( marker.center ) {
	    return marker.center.getLatLng();
	} else {
	    return null;
	}
    }
    this.getMarker = function() {
	if ( marker.center ) {
	    return marker.center;
	} else {
	    return null;
	}
    }
    this.getMarkerBase64 = function() {
	return marker.imgbase64;
    }
    this.getRoutePolyline = function() {
	// First point is always current LatLng
	let p0 = marker.center.getLatLng();
	if ( moveaction.routeid < 1 ) {
	    // Default Route
	    return [
		[ p0.lat, p0.lng],
		[ p0.lat + GH_ROUTE_PATH_LAT, p0.lng ]
	    ];
	} else {
	    let p = [];
	    p.push([ p0.lat, p0.lng]);
	    for(let j=moveaction.routeid,jlen=moveaction.route.length;j<jlen;j++){
		p.push( [ moveaction.route[j].lat, moveaction.route[j].lng ] ); 
	    }
	    return p;
	}
    }
    this.setRoutePolyline = function(latlngs) {
	moveaction.route = latlngs;
	moveaction.routeid = 1;
	//return action.routelayer;
    }
    this.drawMarker2DMap = function(map) {
	if ( marker.center ) {
	    marker.center.setMarkerName(myid);
	    marker.center.setMarkerType('unit');
	    marker.center.addTo(map);
	}
	if ( marker.movearrow ) marker.movearrow.addTo(map);
	if ( marker.frontarrow ) marker.frontarrow.addTo(map);
    }
    this.updateMarker2DMap = function(map,bartype) {
	if ( marker.center == null ) return;
	let latlng = L.latLng(unitarray[ghlatidx],unitarray[ghlngidx]);
        marker.center.setLatLng(latlng);

	let val = _getBarIconIndex(bartype);
	if ( marker.bariconidx != val ) {
	    marker.center._shadow.src = GH_BAR_ICON_URI[val];
	    marker.bariconidx = val;
	}
	
	let p1 = L.latLng(latlng.lat + GH_MARKER_ARROW.longscale,latlng.lng);
	let p2 = L.GeometryUtil.rotatePoint(map,p1,unitarray[ghmovediridx], latlng);
	marker.movearrow.setLatLngs([ latlng,p2 ]);

	let p3 = L.latLng(latlng.lat + GH_MARKER_ARROW.shortscale,latlng.lng);
	let p4 = L.GeometryUtil.rotatePoint(map,p3,unitarray[ghfrontdiridx], latlng);
	marker.frontarrow.setLatLngs([ latlng,p4 ]);
    }
    this.removeMarker2DMap = function(map) {
	_RemoveMarker(map);
    }
    this.drawCircle2DMap = function(map) {
	for ( var i=0,len=marker.circles.length;i<len;i++ ) {
	    if ( marker.circles[i] ) marker.circles[i].addTo(map);
	}
    }
    this.updateCircle2DMap = function(map) {
	if ( marker.center == null ) return;
	var idx = 0;
	for ( var i=0,len=marker.circles.length;i<len;i++ ) {
	    idx = i * ghnode2delems;
	    let latlng = L.latLng(nodearray[idx],nodearray[idx+1]);
            marker.circles[i].setLatLng(latlng);
	}
    }
    this.updateReplenish = function(structurekey,supplybullet,supplyration) {
	let structurebullet = GH_STRUCTURE[structurekey].getBullet();
	if ( structurebullet < supplybullet ) return;
	let current = _GetMyBullet();
	if ( (current+supplybullet) < initdata.bullet ) {
	    if ( GH_STRUCTURE[structurekey].consumeBullet(supplybullet) ) {
		_SetMyBullet(current+supplybullet);
	    }
	} else {
	    // NOP
	}
    }
    this.setAttackedDamage = function(attacker,damage) {
	let tid = _GetTerrain(GH_TERRAIN_STRUCT_DIGIT);
	let skey = null;
	let res = 0;
	if ( tid == GH_TERRAIN_STRUCT_NON ) {
	    _SendUnitWorker('attackdamageunit',damage);
	} else {
	    skey = GH_STRUCTURE_ARY[tid];
	    if ( GH_STRUCTURE[ skey ] ) {
		if ( corps == GH_STRUCTURE[ skey ].getOwner() ) {
		    res = GH_STRUCTURE[ skey ].setDamage(damage); 
		    if ( res > 0 ) {
			//  damage for Structure
			_SetTerrain(res,GH_TERRAIN_NODE_DIGIT);
		    } else {
			//  Structure has NOT endurance value
			_SendUnitWorker('attackdamageunit',damage);
		    }
		} else {
		    _SendUnitWorker('attackdamageunit',damage);
		}
	    } else {
		_SendUnitWorker('attackdamageunit',damage);
	    }
	}
    }
    this.changePlayPause = function(data) {
	_SendUnitWorker('playpause',data);
    }
    this.setSimulationSpeed = function(data) {
	_SendUnitWorker('simulationspeed',data);
    }
    this.getUnitArrayBuffer = function() {
	return unitarraybuffer;
    }
    this.getNodeArrayBuffer = function() {
	return nodearraybuffer;
    }
    this.getNodes = function() {
	return Math.floor(unitarray[ghnodesidx]);
    }
    this.getFatigue = function() {
	return _GetFatigue();
    }
    this.initSharedUnits = function(array) {
	sharedunits = array;
	_SendUnitWorker('sharedunits',sharedunits);
    }
    this.getMoveAction = function() {
	return {
	    'command' : moveaction.command,
	    'target' : moveaction.target,
	    'speed' : moveaction.speed
	}
    }
    this.getAttackAction = function() {
	return {
	    'type' : attackaction.type,
	    'target' : attackaction.target,
	    'weapon' : attackaction.weapon,
	    'formation' : attackaction.formation
	}
    }
    this.setRouteTarget = function() {
	let meter = L.GeometryUtil.length(
	    [ marker.center.getLatLng(),
	      moveaction.route[moveaction.routeid] ]
	);
	if ( meter < GH_METER_IN_TARGET_POINT ) {
	    // route id count up, Next Point
	    if ( moveaction.routeid+1 < moveaction.route.length ) {
		moveaction.routeid++;
	    } else {
		// this route id is , near route last point
		return false;
	    }
	} else {
	    // NOP
	    //moveaction.routeid is same ID
	}
	latlng = moveaction.route[moveaction.routeid];
	_SetMoveDirection(latlng);
	return true;
    }
    this.setChaseTarget = function() {
	let st = GH_UNITS[moveaction.target].getStatus(GH_STATUS_MOVE_DIGIT);
	if ( st > GH_STATUS_RETREAT ) {
	    latlng = GH_UNITS[moveaction.target].getMarkerPosition();
	    _SetMoveDirection(latlng);
	    return true;
	} else {
	    return false;
	}
    }
    this.setWaitTarget = function() {
	unitarray[ghtargetlatidx] = 0;
	unitarray[ghtargetlngidx] = 0;
    }
    this.setReplenishTarget = function() {
	unitarray[ghtargetlatidx] = 0;
	unitarray[ghtargetlngidx] = 0;
    }
    this.setStructure = function(ary) {
	_SendUnitWorker('structure',ary);
    }
    this.setField = function(ary) {
	_SendUnitWorker('field',ary);
    }
    this.setExternalFiles = function(type,data) {
	switch(type) {
	case 'weaponfile' :
	case 'formationfile' :	    
	    _SendUnitWorker(type,data);
	    break;
	default :
	    // NOP
	}
    }
    this.setRouteArrayAction = function(array) {
	// parse Array
	let r = [];
	r.push( marker.center.getLatLng() ); // First point myself 
	for ( let i=0;i<array.length; i=i+2 ) {
	    r.push( L.latLng(array[i], array[i+1]) );
	}
	moveaction.route = r;
	moveaction.routeid = 1; // next target route index
	moveaction.command = 'route';
	moveaction.target = null;
	moveaction.latlng = moveaction.route[moveaction.routeid];
	_SetStatus(GH_STATUS_ROUTE,GH_STATUS_MOVE_DIGIT);
    }
    this.setRouteAction = function() {
	moveaction.routeid = 1; // next target route index
	moveaction.command = 'route';
	moveaction.target = null;
	moveaction.latlng = moveaction.route[moveaction.routeid];
	_SetStatus(GH_STATUS_ROUTE,GH_STATUS_MOVE_DIGIT);
    }
    this.setWaitAction = function() {
	moveaction.command = 'wait';
	moveaction.target = null;
	_SetStatus(GH_STATUS_WAIT,GH_STATUS_MOVE_DIGIT);
    }
    this.setReplenishAction = function() {
	moveaction.command = 'replenish';
	moveaction.target = null;
	_SetStatus(GH_STATUS_REPL,GH_STATUS_MOVE_DIGIT);
    }
    this.setChaseAction = function(key,latlng) {
	if ( latlng == null ) return;
	moveaction.command = 'chase';
	moveaction.target = key;
	moveaction.latlng = latlng;
	unitarray[ghtargetlatidx] = latlng.lat;
	unitarray[ghtargetlngidx] = latlng.lng;
	_SetStatus(GH_STATUS_CHASE,GH_STATUS_MOVE_DIGIT);
    }
    this.setAttackAction = function(type,key,latlng) {
	//   Send Attack Command for Thread
	attackaction.target = key;
	attackaction.type = type;
	attackaction.latlng = latlng;
	_SetFrontDirection(type,marker.center.getLatLng(),latlng);
	//
	//  Attack Status defined ( checked ) in Unit2dSimWorker , NOT HERE!!
	//if ( key == null ) {
	//    _SetStatus(GH_STATUS_ATK_NON,GH_STATUS_ATTACK_DIGIT);
	//} else {
	//    _SetStatus(GH_STATUS_ATK_READY,GH_STATUS_ATTACK_DIGIT);
	//}
	_SendUnitWorker('attack',key);
    }
    this.getAttackAction = function() {
	return attackaction;
    }
    this.setDirection = function(type,latlng) {
	_SetFrontDirection(type,marker.center.getLatLng(),latlng);
    }
    this.getFormation = function() {
	return _GetStatus(GH_STATUS_FORMATION_DIGIT);
    }
//    this.getFormationName = function() {
//	let key = _GetFormationKey( _GetStatus(GH_STATUS_FORMATION_DIGIT) );
//	if ( key == null ) {
//	    return null;
//	} else {
//	    return formation[key].description[GH_LANG];
//	}
//    }
    this.setWeapon = function(type) {
	if ( weapon[type] ) {
	    attackaction.weapon = type;
	    _SetStatus(weapon[type].index,GH_STATUS_WEAPON_DIGIT);
	} else {
	    ghEmakiUtilConsole("setWeapon","Wrong weapon", type);
	}
	return 
    }
    this.getWeapon = function() {
	return _GetStatus(GH_STATUS_WEAPON_DIGIT);
    }
//    this.getWeaponName = function(type) {
//	let key = _GetWeaponKey( _GetStatus(GH_STATUS_WEAPON_DIGIT) );
//	if ( key == null ) {
//	    return null;
//	} else {
//	    if ( type == 'key' ) {
//		return  key;
//	    } else {
//		return weapon[key].description[GH_LANG];
//	    }
//	}
//    }
    this.getWeaponRangeSector = function() {
	let key = _GetWeaponKey( _GetStatus(GH_STATUS_WEAPON_DIGIT) );
	let len0 = ghEmakiFormationSizeGet(unitarray[ghformationsizeidx],GH_FORMATIONSIZE_FRONT_DIGIT);
	let len1 = len0; // unitarray[ghfrontsizeidx];
	let len2 = ghEmakiFormationSizeGet(unitarray[ghformationsizeidx],GH_FORMATIONSIZE_RIGHT_DIGIT);
	let len3 = ghEmakiFormationSizeGet(unitarray[ghformationsizeidx],GH_FORMATIONSIZE_LEFT_DIGIT);
	let bearingoffsetright = Math.atan2(len2,len0) * GH_RADIAN2DEGREE;
	let bearingoffsetleft = Math.atan2(len3,len0) * GH_RADIAN2DEGREE;
	if ( key != null ) {
	    len1 += weapon[key].range;
	}
	return {
	    'latlng' : marker.center.getLatLng(),
	    'inner' : len0,
	    'outer' : len1,
	    'startbearing' : unitarray[ghfrontdiridx] - bearingoffsetleft,
	    'endbearing' : unitarray[ghfrontdiridx] + bearingoffsetright
	}
    }
    this.getWeaponList = function() {
	let ary = [];
	for(var key in weapon){
	    let d = {
		'description' : weapon[key].description[GH_LANG],
		'base64' : weapon[key].imgbase64,
		'value' : key
	    };
	    ary.push(d);
	}
	return ary;
    }
    this.getFrontBearing = function() {
	return unitarray[ghfrontdiridx];
    }
    this.setFormation = function(type) {
	if ( formation[type] ) {
	    attackaction.formation = type;
	    _SetStatus(formation[type].index,GH_STATUS_FORMATION_DIGIT);
	} else {
	    ghEmakiUtilConsole("setFormation","Wrong formation", type);
	}
    }
    this.getFormationList = function() {
	let ary = [];
	for(var key in formation){
	    let d = {
		'description' : formation[key].description[GH_LANG],
		'value' : key
	    };
	    ary.push(d);
	}
	return ary;
    }
    this.getSpeedParams = function() {
	return {
	    "max" : ability.speed.max,
	    "normal" : ability.speed.normal,
	    "current" : moveaction.speed
	}
    }
    this.setSpeedParams = function(val) {
	if ( ability.speed.current != val ) {
	    if ( val > ability.speed.max ) val = ability.speed.max;
	    if ( val < 1 ) val = 1;
	    _SendUnitWorker('unitspeed',val);
	    moveaction.speed = val;
	} else {
	    // NOP
	}
    }
    this.getTerrainStructure = function() {
	let tid = _GetTerrain(GH_TERRAIN_STRUCT_DIGIT);
	if ( tid == GH_TERRAIN_STRUCT_NON ) {
	    return null;
	} else {
	    return tid;
	}
    }
    this.setTerrainStructureEndurance = function(val) {
	_SetTerrain(val,GH_TERRAIN_NODE_DIGIT);
    }
    this.getTerrainField = function() {
	let fid = _GetTerrain(GH_TERRAIN_FIELD_DIGIT);
	if ( fid == GH_TERRAIN_FIELD_NON ) {
	    return null;
	} else {
	    return fid;
	}
    }
    this.clearUnit = function(map) {
	_RemoveMarker(map);
	_RemoveCircles(map);
    }

    ////////////////////////
    //
    //  Initialize
    //
    myid = unitkey;
    name = json.name;
    corps = json.corps;
    description = json.description;
    hostility = json.hostility;
    
    _InitAbility(json.ability);
    _InitData(json.initialize,json.node,json.stock);
    _InitWeaponList(json.weapon);
    _InitFormationList(json.formation);
    
    _InitMarker(json.node.marker);
    _InitCircle(json.node.circle);
    
    _SetupSharedArray();
    _InitNodesSharedArray();
    _InitUnitSharedArray();

    _SetupUnitWorker();
    _SendUnitWorker('initialize',{
	"id" : myid,
	"corps" : corps,
	"hostility" : hostility,
	"ability" : ability,
	"starttime" : stime,
	"damagepernodes" : damagepernodes,
	"nodes" : initdata.strength,
	"nodedistance" : initdata.distance,
	"nodeselems" : ghnode2delems,
	"nodesbytes" : ghnode2dbytes,
	"nodesbuffer" : nodearraybuffer,
	"unitelems" : ghunit2delems,
	"unitbytes" : ghunit2dbytes,
	"unitbuffer" : unitarraybuffer
    });

}

