//
//
//
//

function EmakiTacUnit(key,type,name,feature,num,normalize,isgeneral,temp,color,pos) {

    ////////////////////////
    // Variables
    
    let myid = key;
    let unittype = type;
    let description = name;
    let nodes = num;
    let nodesnormalize = normalize;
    let ability = feature;

    //  Is General times
    let generaltempratio = 1;
    if ( isgeneral ) generaltempratio = 2.0;

    let basetemp = temp;
    let currenttemp = temp;

    let basecolor = color;

    let initlatlng = L.latLng(pos[0],pos[1]);

    let marker = null;
    let latlng = initlatlng;
    let frontdir = 0;
    let velocity = 0;
    let fatigue = 0;
    let stock = {
	"initialration" : -1,
	"initialbullet" : -1,
	"ration" : 0,
	"bullet" : 0
    }
    let status = {
	"move" : 0,
	"attack" : 0,
	"formation" : 0,
	"weapon" : 0,
	"skill" : 0,
	"item" : 0
    };
    // See ghEmakiStatus.js
    let terrain = {
	"field" : 0,
	"struct" : 0,
	"defense" : 0
    };
    // See ghEmakiTerrain.js
    
    let defaultradius = 3;
    if ( unittype == 'unit' ) defaultradius = 5;
    let defaultopacity = 0.8;
    
    ////////////////////////////
    //  Private functions
    var _MarkerTooltip = function() {
	var txt = "<B>" + description + "</B><BR>";
	txt += myid + "<BR>";
	if ( unittype == 'unit' ) txt += " " + currenttemp;
	return txt;
    }
    var _InitCircleMarker = function(latlng) {
	marker = L.circleMarker(initlatlng, {
	    pane: 'markerPane',
	    color: '#F5F5F5',
	    fillColor: basecolor,
	    fillOpacity: defaultopacity,
	    radius: defaultradius
	});
	marker.bindTooltip(_MarkerTooltip);
    }
    var _RemoveCircleMarker = function(map) {
	if ( marker ) map.removeLayer(marker);
    }
    var _CalcTemprature = function(num) {
	//  Calculate temperature
	currenttemp = basetemp * ( num * nodesnormalize ) * generaltempratio;
    }
    ///////////////////////////////////////////

    _InitCircleMarker(initlatlng);
    _CalcTemprature(nodes);
    
    ////////////////////////
    //
    // External Functions
    //
    this.setStatus = function(val) {
	let v = parseInt(val,10);
	status.move = ghEmakiStatusGet(v,GH_STATUS_MOVE_DIGIT);
	status.attack = ghEmakiStatusGet(v,GH_STATUS_ATTACK_DIGIT);
	status.formation = ghEmakiStatusGet(v,GH_STATUS_FORMATION_DIGIT);
	status.weapon = ghEmakiStatusGet(v,GH_STATUS_WEAPON_DIGIT);
	status.skill = ghEmakiStatusGet(v,GH_STATUS_SKILL_DIGIT);
	status.item = ghEmakiStatusGet(v,GH_STATUS_ITEM_DIGIT);	
    }
    this.getStatus = function(type) {
	switch (type) {
	case GH_STATUS_MOVE_DIGIT :
	    return status.move;
	    break;
	case GH_STATUS_ATTACK_DIGIT :
	    return status.attack;
	    break;
	case GH_STATUS_FORMATION_DIGIT :
	    return status.formation;
	    break;
	case GH_STATUS_WEAPON_DIGIT :
	    return status.weapon;
	    break;
	case GH_STATUS_SKILL_DIGIT :
	    return status.skill;
	    break;
	case GH_STATUS_ITEM_DIGIT :
	    return status.item;
	    break;
	default:
	    return status.move;
	}
    }
    this.setTerrain = function(val) {
	let v = parseInt(val,10);
	terrain.field = ghEmakiTerrainGet(v,GH_TERRAIN_FIELD_DIGIT);
	terrain.struct = ghEmakiTerrainGet(v,GH_TERRAIN_STRUCT_DIGIT);
	terrain.defense = ghEmakiTerrainGet(v,GH_TERRAIN_NODE_DIGIT);
    }
    this.getTerrain = function(type) {
	switch (type) {
	case GH_TERRAIN_FIELD_DIGIT :
	    return terrain.field;
	    break;
	case GH_TERRAIN_STRUCT_DIGIT :
	    return terrain.struct;
	    break;
	case GH_TERRAIN_NODE_DIGIT :
	    return terrain.defense;
	    break;
	default:
	    return terrain.field;
	}
    }
    this.setNodes = function(val) {
	nodes = parseFloat(val);
    }
    this.getNodes = function(val) {
	return nodes;
    }
    this.setLatLng = function(lat,lng) {
	latlng = L.latLng(parseFloat(lat),parseFloat(lng));
    }
    this.setFrontDir = function(dir) {
	frontdir = parseFloat(dir);
    }
    this.getFrontDir = function(dir) {
	return frontdir;
    }
    this.setVelocity = function(vel) {
	velocity = parseFloat(vel);
    }
    this.getVelocity = function() {
	return velocity;
    }
    this.setFatigue = function(fat) {
	fatigue = parseFloat(fat);
    }
    this.setRation = function(val) {
	if ( stock.initialration < 0 ) {
	    stock.initialration = parseFloat(val);
	}
	stock.ration = parseFloat(val);
    }
    this.setBullet = function(val) {
	if ( stock.initiabullet < 0 ) {
	    stock.initialbullet = parseFloat(val);
	}
	stock.bullet = parseFloat(val);
    }
    this.getAbility = function() {
	return ability;
    }
    this.getFatigue = function() {
	return fatigue;
    }
    this.getRation = function() {
	return stock.ration;
    }
    this.getBullet = function() {
	return stock.bullet;
    }
    this.updateTemp = function() {
	if ( terrain.struct == GH_TERRAIN_STRUCT_NON ) {
	    _CalcTemprature(nodes);
	} else {
	    _CalcTemprature(nodes+terrain.defense);
	}
    }
    this.getTemp = function() {
	return currenttemp;
    }
    this.getMarker = function() {
	return marker;
    }
    this.drawMarkerMap = function(map) {
	if ( marker ) {
	    marker.addTo(map);
	}
    }
    this.removeMarkerMap = function(map) {
	if ( marker ) {
	    map.removeLayer(marker);
	}
    }
    this.updateMarkerMap = function(map,lat,lng) {
	if ( marker ) {
            marker.setLatLng(latlng);
	}
    }
    this.getLatLng = function() {
	if ( marker ) {
	    return marker.getLatLng();
	}
    }
    this.getLatLngTemp = function() {
	if ( marker ) {
	    let l = marker.getLatLng();
	    return [ l.lat , l.lng , currenttemp ];
	}
    }
}
