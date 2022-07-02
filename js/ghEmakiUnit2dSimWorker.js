//
//
//  ghEmakiUnit2d node worker
//
//    // http://makinacorpus.github.io/Leaflet.GeometryUtil/
//    // L.GeometryUtil.bearing(center,attackcenter) + 180.0;
//
//
//it looks like the ugly hack.
// global is undefined error
// https://github.com/aspnet/AspNetCore/issues/6979
// for importScripts('../cesium/Cesium.js');
//
//const window = self.window = self;
window = self.window = self;

importScripts('../js/ghEmakiUtil.js','../js/ghEmakiStatus.js','../js/ghEmakiParams.js','../js/ghEmakiSharedArray.js','../js/ghEmakiClock.js','../js/ghEmakiTerrain.js','../js/ghEmakiFormation.js','../js/turfEmakiLib.min.js');

/////////////////////////////////////////
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
/////////////////////////////////////////

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
	"luck" : 0,
	"speed" : {
	    "max" : 6,
	    "normal" : 4
	}
    }
};
var GH_UNIT_SPEED = {
    "current" : 0,
    "coefficient" : 0
}

var GH_DAMAGE = {
    "accumulation" : 0,
    "attackedcount" : 0,
    "pernodes" : 1.0    
}

var GH_IS_PLAYING = false;

var GH_UNIT_TIMER = null;

var GH_CURRENT_ELAPSED = -1;
var GH_CLOCK = null;

//
//
// Exclusive distance per node
//
var GH_NODE_DISTANCE_METER = GH_METER_PER_NODE; // Default ( initial )
const GH_NODE_RANGE_RATIO = 0.666 / 2.0 ;  //  Half of (  one third , 1 / 3 )

var GH_ATTACK = {
    'unit' : null,
    'interval' : 0,
    'angle' : GH_DIR_FRONT,
    'distance' : 1.0,
    'point' : null,
    'prevattacktime' : -1
}
var GH_NEIGHBOR = {
    "elapsedtime" : null,
    "center" : null,
    "updatedistance" : 200, // [m] feature update distance
    "areasize"       : 350, // [m] bbox feature size
    "structure" : [],
    "structureidx" : [],
    "border" : [],
    "borderidx" : [],
    "field" : [],
    "fieldidx" : []
}

const GH_OBSTACLE_CHECK_DISTANCE_RATIO = 2; // [times]

//  Scene Environment
var GH_WEAPON = {};
var GH_WEAPON_ARY = [];
var GH_FORMATION = {};
var GH_FORMATION_ARY = [];

var GH_STRUCT = [];
var GH_STRUCT_FEATURES = [];

var GH_FIELD = [];
var GH_FIELD_FEATURES = [];

/////////////////////////////////////////

function _SendMessage(command,data) {
    self.postMessage({
	"cmd": command,
	"corps": GH_UNIT.corps,
	"unit": GH_UNIT.id,	
	"value": data });
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
function _SendUnitAttackDamaged(damage) {
    let a = turf.invariant.getCoord(GH_ATTACK.point);
    let data = {
	"damage" : damage,
	"attacker" : GH_UNIT.id,
	"lat": a[1],
	"lng": a[0]
    };
    self.postMessage({
	"cmd": 'attackeddamage',
	"corps": GH_SHAREDUNITS[GH_ATTACK.unit].corps,
	"unit": GH_ATTACK.unit,
	"value": data });
}
function _SendUnitDamageNode(node) {
    self.postMessage({
	"cmd": 'damagenode',
	"corps": GH_UNIT.corps,
	"unit": GH_UNIT.id,
	"value": node });
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
function _GetTerrain(type) {
    let val = GH_UNIT_ARRAY[ghterrainidx];
    return ghEmakiTerrainGet(val,type);
}
function _SetTerrain(value,type) {
    let oldvalue = _GetTerrain(type);
    let val = GH_UNIT_ARRAY[ghterrainidx];
    if ( oldvalue != value ) {
	// Status change, 
	// NOP
    }
    GH_UNIT_ARRAY[ghterrainidx] = ghEmakiTerrainSet(val,value,type);
}

function _SetAttackedStatusOpponentUnit(unitkey,isattacked) {
    // isattacked = true ,  -> append attacked flag
    // isattacked = false,  -> remove attacked flag
    //    let us = GH_HOSTILITY[unitkey].unitarray[ghstatusidx];
    //let us = GH_SHAREDUNITS[unitkey].unitarray[ghstatusidx];
    //let st = us % GH_STATUS_NORMAL_DIGIT;
    let val = GH_SHAREDUNITS[unitkey].unitarray[ghstatusidx];
    let st = ghEmakiStatusGet(val,GH_STATUS_ATTACK_DIGIT);
    if ( isattacked ) {
	//  append attacked flag
	if ( st < GH_STATUS_ATK_NON_ATTACKED ) {
	    GH_SHAREDUNITS[unitkey].unitarray[ghstatusidx] = ghEmakiStatusSet(val,GH_STATUS_ATK_ADD_ATTACKED,GH_STATUS_ATTACK_DIGIT);
	}
    } else {
	if ( st > GH_STATUS_ATK_ATTACK ) {
	    GH_SHAREDUNITS[unitkey].unitarray[ghstatusidx] = ghEmakiStatusSet(val,GH_STATUS_ATK_REMOVE_ATTACKED,GH_STATUS_ATTACK_DIGIT);
	}
    }
}
function _IsStatusAlive(value) {
    let a = ghEmakiStatusGet(value,GH_STATUS_MOVE_DIGIT)
    if ( a < GH_STATUS_REPL ) {
	return false;
    } else {
	return true;
    }
}
function _GetNodeCount() {
    return Math.floor(GH_UNIT_ARRAY[ghnodesidx]);
}

function _GetTwoPointsVector(pointa,pointb) {
    // pointa, poinb = turf.helpers.point();
    //
    //  Vector a->b
    //
    let d = turf.distance.default(pointa,pointb,{units: 'meters'}) ; // [m]
    let a = turf.invariant.getCoord(pointa);
    let b = turf.invariant.getCoord(pointb);
    return [ b[0] - a[0], b[1] - a[1] , d ];
}

function _CalcAttackInterval(weaponid) {
    //
    //  [ min ] -> [ mili-sec ]
    //
    return GH_WEAPON_ARY[weaponid].rapid * 60 * 1000;
}
//function _CalcAttackIntervalParams(weaponid) {
//    //
//    //                                  100000
//    //   attack interval =  -------------------------------
//    //                        4 * [1-10] + [1-100] * 0.6
//    //    min = 18181  mili sec
//    //    max = 1000  mili sec
//    //
//    return 100000 / ( 4 * GH_WEAPON_ARY[weaponid].rapid + GH_UNIT.ability.agility * 0.6 ) ; // next attack interval [mili sec] 
//}
function _CalcDamageAttackValue(formid,weaponid,angle) {
    // formation attack 0 - 10   ( 7 dafalut , 0 - 7 - 10 -> 0.0 - 1.0 - 1.42 )
    // ability attrack 0 - 100   ( 70 dafalut , 0 - 70 - 100 -> 0.0 - 1.0 - 1.42 )
    // attack distance ratio , distance = 0 -> power 100% ,  distance = weapon.range -> power 80%
    //
    //  if ( GH_WEAPON_ARY[dfcweapon].range < GH_WEAPON_ARY[atkweapon].range ) {
    // weapon power ( 1 - ?? )  = base attack value

    ///  Max Power = (weapon power) * formation(1.42) * ability(1.42) * angle(2) * luck(1.5) * distance(1.0) = 6.11755 * (weapon power)

    let f = GH_FORMATION_ARY[formid].attack * 0.1428;
    let a = GH_UNIT.ability.attack * 0.01428;
    let l = GH_UNIT.ability.luck; // 0 - 30
    let d = ( -0.2 / GH_WEAPON_ARY[weaponid].range ) * GH_ATTACK.distance + 1.0; //  y = (-0.2/range) x + 1.0; linear function
    if ( d < 0.3 ) d = 0.3;
    let w = GH_WEAPON_ARY[weaponid].power  

    let r = ghEmakiUtilRandomInRange(1,100);
    let c = 1.0;
    if ( r < l ) {
	c = GH_DAMAGE_ATTACK_CRITICAL;
    } else {
	if ( r > ( 100 - l ) ) {
	    // Miss
	    c = GH_DAMAGE_ATTACK_CRITICAL_MINIMUN;
	} else {
	    // random a little
	    c = 1 + ( r - 50 ) * 0.01;
	}
    }
//    let total = w + f + a;  //  max 100
//    total = total * c * GH_ATTACK_DAMAGE_RATIO[angle];
//    return total;

    return w * f * a * GH_ATTACK_DAMAGE_RATIO[angle] * c * d;
}
function _CalcDamageDefenseValue(formid,weaponid,angle) {

    // formation defense 0 - 10   ( 7 dafalut , 0 - 7 - 10 -> 0.0 - 1.0 - 1.42 )
    // ability denfese 0 - 100   ( 70 dafalut , 0 - 70 - 100 -> 0.0 - 1.0 - 1.42 )
    // defense distance ratio , distance = 0 -> defense 80% ,  distance = weapon.range -> defense 100%
    //
    // weapon Defense ( 1 - ?? )  = base defense value
    ///  Max Defense = (weapon defense) * formation(1.42) * ability(1.42) * angle(1.1) * distance(1.0) = 2.243 * (weapon distance)

    let f = GH_FORMATION_ARY[formid].defense * 0.1428;;
    let w = GH_WEAPON_ARY[weaponid].regist;
    let a = GH_SHAREDUNITS[GH_ATTACK.unit].defense * 0.01428;
    let d = ( 0.2 / GH_WEAPON_ARY[weaponid].range ) * GH_ATTACK.distance + 0.8; //  y = (0.2/range) x + 0.8; linear function

    return w * f * a * GH_DEFENSE_DAMAGE_RATIO[angle] * d;
}


//function _CalcDefenseValue(formid,weaponid,defense,angle) {
//    // formation defense 0 - 10   20%
//    // weapon regist 0 - 10       30%
//    // ability defense 0 - 100   50%
//
//    let f = GH_FORMATION_ARY[formid].defense * 2;
//    let w = GH_WEAPON_ARY[weaponid].regist * 3;
//    let d = defense * 0.5;
//    let total = w + f + d;  //  max 100
//
//    total = total * GH_DEFENSE_DAMAGE_RATIO[angle];
//    
//    return total;
//}

//function _CalcAttackDefenseResult(attack,defense) {
//    let critical = 1.0;
//    let c = ghEmakiUtilRandomInRange(1,100);
//    if ( c < GH_UNIT.ability.luck ) {
//	critical = GH_ATTACK_CRITICAL_DAMAGE;
//    } else {
//	if ( c > ( 100 - GH_UNIT.ability.luck ) ) {
//	    // Miss
//	    critical = GH_ATTACK_CRITICAL_MINIMUN;
//	} else {
//	    // random a little
//	    critical = 1 + ( c - 50 ) * 0.01;
//	}
//    }
//    let res = attack * critical - defense;
//    if ( GH_SHOW_CONSOLE_ATTACK ) {
//	let txt = GH_UNIT.id + " " + GH_UNIT.corps + " <attack> " + attack + "(" + critical + ") " + defense + " = " + res;
//	console.log(txt);
//    }
//    if ( res < 0 ) {
//	// More Defensive than attacker
//	res = GH_ATTACK_MINIMAM_RATIO * attack * critical;
//    } else {
//	// NOP
//    }
//    return res;
//}


//
//   Attack Process
//
////  ghUpdateAttackDamage ( ghEmakiUnit2dSimWorker )
////         |
////         |  'attackeddamage' _SendUnitAttackedDamage
////         |
////  _UnitWorkerReceive   ( ghEmakiUnit2d )
////   setAttackedDamage   ( ghEmakiUnit2d )
////         |
////         |-- GH_STRUCTURE.setDamage ( ghEmakiTerrain )
////         |
////         | 'attackdamageunit' _SendUnitWorker();
////         |
////  ( ghEmakiUnit2dSimWorker )
////   calc attack damage and reduce node
////         |
////         |  'damagenode' _SendUnitDamageNode
////         |
////  _UnitWorkerReceive   ( ghEmakiUnit2d )
////   Marker and Message modified
////
//
//  ghCalculateDamage(interval,status)
//         | 
//     _SendUnitAttackDamaged( resdamage * atkcount )
//         |
//         |  'attackeddamage'
//         |
//   _UnitWorkerReceive ( ghEmakiUnit2d.js )
//	    ghAppendEventReport( txt );
//	    _DrawExplosion(GH_LMAP,L.latLng(data.lat,data.lng));
//	    GH_3DVIEW.sendMessage('GH_EXPLOSION','all'
//	    GH_SOUND.playEffect( _GetWeaponKey( _GetStatus(GH_STATUS_WEAPON_DIGIT) ) );
//         |
//         |
//      GH_UNITS[unit].setAttackedDamage(attacker,damage);
//
//	    _SendUnitWorker('attackdamageunit',damage);
//               damage for Structure -> _SetTerrain(res,GH_TERRAIN_NODE_DIGIT);
//
//         |
//  self.addEventListener('message', function(e)  ghEmakiUnit2dSimWorker.js
//      'attackdamageunit'
//
//
//

function ghCalculateDamage(interval,status) {
    if ( GH_ATTACK.unit == null ) return;
    if ( _IsStatusAlive(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghstatusidx]) ) {
	// NOP
    } else {
	// attack target is not alive
	return;
    }

    let difftime = GH_CLOCK.getElapsed() - GH_ATTACK.prevattacktime;
    if ( difftime < GH_ATTACK.interval  ) {
	return;
    } 

    let atkcount = Math.floor(difftime /  GH_ATTACK.interval) ;
    let atkformid = _GetStatus(GH_STATUS_FORMATION_DIGIT);
    let atkweaponid = _GetStatus(GH_STATUS_WEAPON_DIGIT);

    //  Ammunition Check
    let bulletuse = GH_WEAPON_ARY[atkweaponid].comsumption;
    let currentbullet = GH_UNIT_ARRAY[ghbulletidx];
    let totalcomsumption = bulletuse * atkcount;
    if ( currentbullet < totalcomsumption ) {
	atkcount = Math.floor(currentbullet / bulletuse);
	totalcomsumption = bulletuse * atkcount;
    } else {
	// NOP
    }
    GH_UNIT_ARRAY[ghbulletidx] = currentbullet - totalcomsumption;

    if ( atkcount < 1 ) {
	//  Cannot Attack
	//  Out of Bullet or something
	return;
    }

    //let atkdir = ghEmakiUtilDetectAttackAngle(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghfrontdiridx],GH_UNIT_ARRAY[ghfrontdiridx]);

    let atknodes =  GH_UNIT_ARRAY[ghnodesidx];
    let atkdamage = _CalcDamageAttackValue(atkformid,atkweaponid,GH_ATTACK.angle) * atknodes;

    let dfcformid = ghEmakiStatusGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghstatusidx],GH_STATUS_FORMATION_DIGIT);
    let dfcweaponid = ghEmakiStatusGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghstatusidx],GH_STATUS_WEAPON_DIGIT);
    let dfcnodes = GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghnodesidx];
    let dfcregist = _CalcDamageDefenseValue(dfcformid,dfcweaponid,GH_ATTACK.angle) * dfcnodes;
    
    let resdamage = atkdamage - dfcregist ;
    if ( resdamage < 0 ) {
	resdamage = atkdamage * GH_DAMAGE_ATTACK_MINIMAM_RATIO;
    }
    _SendUnitAttackDamaged( resdamage * atkcount );
    GH_ATTACK.prevattacktime = GH_CLOCK.getElapsed();

}


//  Obsolete function
//function ghUpdateAttackDamage(interval,status) {
//    //  Obsolete function
//    if ( GH_ATTACK.unit == null ) return;
//    if ( _IsStatusAlive(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghstatusidx]) ) {
//	// NOP
//    } else {
//	// attack target is not alive
//	return;
//    }
//
//    let difftime = GH_CLOCK.getElapsed() - GH_ATTACK.prevattacktime;
//    if ( difftime < GH_ATTACK.interval  ) {
//	return;
//    } 
//    
//    let atkcount = Math.floor(difftime /  GH_ATTACK.interval) ;
//    
//    let atkformid = _GetStatus(GH_STATUS_FORMATION_DIGIT);
//    let atkweapon = _GetStatus(GH_STATUS_WEAPON_DIGIT);
//    let atknodes =  GH_UNIT_ARRAY[ghnodesidx];
////    let atkdir = ghEmakiUtilDetectAttackAngle(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghfrontdiridx],GH_UNIT_ARRAY[ghfrontdiridx]);
//    let atk = _CalcAttackValue(atkformid,atkweapon,GH_UNIT.ability.attack,atkdir) * atknodes;

//    let dfcformid = ghEmakiStatusGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghstatusidx],GH_STATUS_FORMATION_DIGIT);
//    let dfcweapon = ghEmakiStatusGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghstatusidx],GH_STATUS_WEAPON_DIGIT);
//    let dfcnodes = GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghnodesidx];
//    let def = 0;
//    if ( GH_WEAPON_ARY[dfcweapon].range < GH_WEAPON_ARY[atkweapon].range ) {
//	// NOP
//	// Cannot counter damage
//    } else {
//	def = _CalcDefenseValue(dfcformid,dfcweapon,GH_SHAREDUNITS[GH_ATTACK.unit].defense,atkdir) * dfcnodes;
//    }
//    let damage = 0;
//    for ( var i =0;i<atkcount;i++ ) {
//	damage += _CalcAttackDefenseResult(atk,def);
//    }
//    _SendUnitAttackedDamage(damage);
//    
//    GH_ATTACK.prevattacktime = GH_CLOCK.getElapsed();
//
//}



//https://joyfit.jp/aojoy/health_column/post03/
//3000 Kcal / day
//
//https://keisan.casio.jp/exec/system/1536633800
//134[m/s] (8km/h) 
//1 [min] = 133 [m] = 8.7 [Kcal]
//344[min] = 3000Kcal = 45,862[m]

function ghUpdateFatigue(interval,status,isattack) {

    if ( status < GH_STATUS_REPL ) return; // NOP
	

    let sec = interval / 1000;  // milisec -> sec
    let fatigue = GH_UNIT_ARRAY[ghfatigueidx];
    let ret = ( GH_FATIGUE_METS[status][isattack] * GH_FATIGUE_WEIGHT / 3600 ) * sec;

    //
    // terrain modify
    //
    let terrain = _GetTerrain(GH_TERRAIN_STRUCT_DIGIT);
    if ( terrain == GH_TERRAIN_STRUCT_NON ) {
	// NOP 
    } else {
	if ( status == GH_STATUS_REPL ) {
	    ret = GH_FATIGUE_TER_REPL_RATIO * ret;
	} else if ( status == GH_STATUS_WAIT ) {
	    if ( isattack == GH_STATUS_ATK_NON ) {
		ret = GH_FATIGUE_TER_WAIT_NON_RATIO * ret;
	    } else {
		ret = GH_FATIGUE_TER_WAIT_ATK_RATIO * ret;
	    }
	} else {
	    ret = GH_FATIGUE_TER_MOVE_RATIO * ret;
	}
    }

    //
    // velocity modify
    //
    if ( status < GH_STATUS_CHASE ) {
	// NOP
    } else {
	ret = GH_FATIGUE_VEL_MOVE_RATIO * ( GH_UNIT_SPEED.current / GH_UNIT.ability.speed.normal ) * ret;
    }

    fatigue += ret;
    if ( fatigue < 0 ) fatigue = 0;
    if ( fatigue > GH_FATIGUE_MAX ) fatigue = GH_FATIGUE_MAX;
    GH_UNIT_ARRAY[ghfatigueidx] = fatigue;

    if ( GH_SHOW_CONSOLE_FATIGUE ) {
	let txt = "fatigue>" + GH_UNIT.id + " " + GH_UNIT.corps + " " + fatigue ;
	console.log(txt);
    }

}

function ghUpdateFatigueBAK(interval,status,isattack) {

    let sec = interval / 1000;  // milisec -> sec
    let fat = GH_UNIT_ARRAY[ghfatigueidx];
    let terrain = _GetTerrain(GH_TERRAIN_STRUCT_DIGIT);
    let res = 1.0;

    if ( status < GH_STATUS_WAIT ) return; // NOP
	
    if ( isattack == GH_STATUS_ATK_ATTACK || isattack == GH_STATUS_ATK_ATTACK_ATTACKED ) {
	// Attack
	if ( terrain == GH_TERRAIN_STRUCT_NON ) {
	    res = GH_FATIGUE_COEFF[isattack] * sec;
	} else {
	    // terrain benefit
	    res = GH_FATIGUE_ATTACK_STRUCTURE * sec;
	}
    } else {
	// Wait or Move
	if ( terrain == GH_TERRAIN_STRUCT_NON ) {
	    res = GH_FATIGUE_COEFF[status] * sec;
	} else {
	    // terrain benefit
	    res = GH_FATIGUE_WAIT_STRUCTURE * sec;
	}
    }

    if ( isattack == GH_STATUS_ATK_NON_ATTACKED
	 || isattack == GH_STATUS_ATK_READY_ATTACKED
	 || isattack == GH_STATUS_ATK_ATTACK_ATTACKED ) {
	res = Math.abs(res * GH_FATIGUE_ATTACKED_RATIO);
    }

    //  Speed-Fatigue Correct function
    //let a = ( ( GH_UNIT.speed.fatiguecoeff * GH_UNIT.speed.current * GH_UNIT.speed.current ) + 0.5 );
    let a = ( ( GH_UNIT_SPEED.coefficient * GH_UNIT_SPEED.current * GH_UNIT_SPEED.current ) + 0.5 );
    res = res * a;
    
    fat += res;
    if ( fat < 0 ) fat = 0;
    if ( fat > GH_FATIGUE_MAX ) fat = GH_FATIGUE_MAX;
    GH_UNIT_ARRAY[ghfatigueidx] = fat;

    if ( GH_SHOW_CONSOLE_FATIGUE ) {
	let txt = "fatigue>" + GH_UNIT.id + " " + GH_UNIT.corps + " " + fat ;
	console.log(txt);
    }

}

function ghUpdateVelocity(interval,status,isattack) {

    let v = GH_UNIT_SPEED.current;//  Base Velocity
    if ( status < GH_STATUS_CHASE ) {
	GH_UNIT_ARRAY[ghvelocityidx] = 0.0;
	return;
    }

    let attackratio = 1.0;
    let angleratio = 1.0;
    let angle = Math.cos( ( GH_UNIT_ARRAY[ghmovediridx] - GH_UNIT_ARRAY[ghfrontdiridx] ) * GH_DEGREE2RADIAN );

    //  I attack anyone
    switch ( isattack ) {
    case GH_STATUS_ATK_ATTACK:
	if ( angle > 0 ) {
	    // Front in Attack speed Down
	    angleratio = angle;
	    attackratio = GH_VELOCITY_FRONT_ATTACK_RATIO;
	} else {
	    // Backword speed slowdown
	    angleratio = - angle;
	    attackratio = GH_VELOCITY_BACK_ATTACK_RATIO;
	}
	break;
    case GH_STATUS_ATK_ATTACK_ATTACKED:
	if ( angle > 0 ) {
	    // Front in Attack speed Down
	    angleratio = angle;
	    attackratio = GH_VELOCITY_FRONT_ATTACK_ATTACKED_RATIO;
	} else {
	    // Backword speed slowdown
	    angleratio = - angle;
	    attackratio = GH_VELOCITY_BACK_ATTACK_ATTACKED_RATIO;
	}
	break;
    case GH_STATUS_ATK_NON:
    case GH_STATUS_ATK_READY:	
	angleratio = Math.abs(angle);
	attackratio = GH_VELOCITY_ATTACK_NON_RATIO;
	break;
    case GH_STATUS_ATK_NON_ATTACKED:
    case GH_STATUS_ATK_READY_ATTACKED:	
	angleratio = Math.abs(angle);
	attackratio = GH_VELOCITY_ATTACKED_RATIO;
    default:
	angleratio = Math.abs(angle);
    }

    //  Fatigue
    let f = GH_UNIT_ARRAY[ghfatigueidx];
    if ( f > GH_FATIGUE_MAX_HALF ) {
	v = v * ( ( GH_FATIGUE_MAX - f ) / GH_FATIGUE_MAX_HALF );
    }

    //  Total
    v = v * angleratio * attackratio ;
    GH_UNIT_ARRAY[ghvelocityidx] = v;
}

function ghUpdateVelocityBACK(interval,status,isattack) {

    let attackratio = 1.0;
    let angleratio = 1.0;
    //let v = GH_UNIT.speed.current;
    let v = GH_UNIT_SPEED.current;//  Base Velocity
    if ( status < GH_STATUS_CHASE ) {
	GH_UNIT_ARRAY[ghvelocityidx] = 0.0;
	return;
    }

    let angle = Math.cos( ( GH_UNIT_ARRAY[ghmovediridx] - GH_UNIT_ARRAY[ghfrontdiridx] ) * GH_DEGREE2RADIAN );

    //  I attack anyone
    if ( isattack == GH_STATUS_ATK_ATTACK || isattack == GH_STATUS_ATK_ATTACK_ATTACKED) {
	if ( angle > 0 ) {
	    // Front in Attack speed Down
	    angleratio = angle;
	    attackratio = GH_VELOCITY_ATTACK_RATIO_FRONT;
	} else {
	    // Backword speed slowdown
	    angleratio = - angle;
	    attackratio = GH_VELOCITY_ATTACK_RATIO_BACK;
	}
    } else {
	angleratio = Math.abs(angle);
    }

    //  I attacked by anyone
    if ( isattack == GH_STATUS_ATK_NON_ATTACKED
	 || isattack == GH_STATUS_ATK_READY_ATTACKED
	 || isattack == GH_STATUS_ATK_ATTACK_ATTACKED ) {
	v = v * GH_VELOCITY_ATTACKED_RATIO; // is attacked , slow down
    }

    //  Fatigue
    //  y = GH_FATIGUE_FUNC_ALPHA^x 
    v = v * Math.pow(GH_FATIGUE_FUNC_ALPHA, GH_UNIT_ARRAY[ghfatigueidx]);

    //  Total
    v = v * angleratio * attackratio ;
    GH_UNIT_ARRAY[ghvelocityidx] = v;
}
function ghUpdateMarker(status,interval) {

    if ( status < GH_STATUS_CHASE ) return;

    let center = turf.helpers.point( [ GH_UNIT_ARRAY[ghlngidx], GH_UNIT_ARRAY[ghlatidx] ] );
    let target = turf.helpers.point( [ GH_UNIT_ARRAY[ghtargetlngidx], GH_UNIT_ARRAY[ghtargetlatidx] ] );
    if ( turf.booleanEqual.default(center,target) ) {
	// NOP
	return;
    }
    var angle = turf.bearing.default(center, target);
    var distance = GH_UNIT_ARRAY[ghvelocityidx] * interval;

    var nextpoint = turf.destination.default(center, distance, angle, { units: 'meters'});
    var checkpoint = turf.destination.default(center, GH_OBSTACLE_CHECK_DISTANCE_RATIO * distance, angle, { units: 'meters'});

    if ( ghPointInNeighborFeature(checkpoint) ) {
	// Nextpoint collision
	// Not update current point
    } else {

	let ap = null;
	let apdis = null;
	let frontlength = 2 * ghEmakiFormationSizeGet(GH_UNIT_ARRAY[ghformationsizeidx],GH_FORMATIONSIZE_FRONT_DIGIT);
	checkpoint = turf.destination.default(center, frontlength, angle, { units: 'meters'});
	let isobstacle = false; 
	for ( var key in GH_SHAREDUNITS ) {
	    if ( GH_UNIT.id == key ) {
		// NOP Myself
	    } else {
		if ( _IsHostilityUnits(key) ) {
		     // NOP
		} else	{
		    ap = turf.helpers.point([
			GH_SHAREDUNITS[key].unitarray[ghlngidx],
			GH_SHAREDUNITS[key].unitarray[ghlatidx]
		    ]);
		    apdis = turf.distance.default(checkpoint,ap,{units: 'meters'}) ; // [m]
		    if ( apdis < ghEmakiFormationSizeGet(GH_SHAREDUNITS[key].unitarray[ghformationsizeidx],GH_FORMATIONSIZE_FRONT_DIGIT) ) isobstacle = true;
		}
	    }
	}

	if ( isobstacle ) {
	    // NOP
	} else {
	    var p1 = turf.invariant.getCoord(nextpoint);
	    GH_UNIT_ARRAY[ghlngidx] = p1[0];
	    GH_UNIT_ARRAY[ghlatidx] = p1[1];
	}
    }
    
}

function ghUpdateNodesFormation(interval) {

    var form = _GetStatus(GH_STATUS_FORMATION_DIGIT);
    var lead = GH_UNIT.ability.leadership;
    let nodecnt = _GetNodeCount();
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
	//
	//
	//
	let nodep = turf.helpers.point( [ GH_NODE_ARRAY[idx+1], GH_NODE_ARRAY[idx] ] ); //
    	let nangle = turf.bearing.default(nodep, fpoint);
	let speed = GH_UNIT_ARRAY[ghvelocityidx] ;
	let distance = ghEmakiUtilRandomInRange(speed,speed*2.0) * interval;
	var nextpoint = turf.destination.default(nodep, distance, nangle, { units: 'meters'});
	var checkpoint = turf.destination.default(nodep, GH_OBSTACLE_CHECK_DISTANCE_RATIO * distance , nangle, { units: 'meters'});

	if ( ghPointInNeighborFeature(checkpoint) ) {
	    // Nextpoint collision
	    // move toward center marker
	    nangle = turf.bearing.default(nodep, center);
	    nextpoint = turf.destination.default(nodep, distance * 0.5, nangle, { units: 'meters'});
	} else {
	    // NOP
	}

	var p1 = turf.invariant.getCoord(nextpoint);
	GH_NODE_ARRAY[idx+1] = p1[0];
	GH_NODE_ARRAY[idx] = p1[1];

	if ( ip.yval > frontmax ) frontmax = ip.yval;
	if ( ip.xval > rightmax ) rightmax = ip.xval;
	if ( ip.xval < leftmax ) leftmax = ip.xval;
	if ( ip.yval < backmax ) backmax = ip.yval;
	
    }

//    GH_UNIT_ARRAY[ghfrontsizeidx] = frontmax ;
//    GH_UNIT_ARRAY[ghrightsizeidx] = rightmax ;
//    GH_UNIT_ARRAY[ghleftsizeidx] = -1 * leftmax ;
//    GH_UNIT_ARRAY[ghbacksizeidx] = -1 * backmax ;
    
    GH_UNIT_ARRAY[ghformationsizeidx] = ghEmakiFormationSizeSet(
	GH_UNIT_ARRAY[ghformationsizeidx],
	[ frontmax, backmax, rightmax, leftmax ],
	GH_FORMATIONSIZE_ALL_DIGIT);
	
}

/////////////////////////////////////////////
function ghCreateNeighborFeature(world,type,cnt,area,bbox) {

    let ilen=world.length;
    if ( type == 'structure' ) {
	ilen = ilen - 1;
	// structure last index is Border Feature
    }
    for ( var i =0;i<ilen;i++ ) {
	if ( world[i] == null ) {
	    // NOP
	} else {
	    if ( turf.booleanOverlap.default(world[i],area) ) {
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
		if ( turf.booleanContains.default(area,world[i]) ) {
		    if ( type == 'structure' ) {
			GH_NEIGHBOR.structure.push( world[i] );
			GH_NEIGHBOR.structureidx.push( cnt ) ;
		    } else if ( type == 'field' ) {
			GH_NEIGHBOR.field.push( world[i] );
			GH_NEIGHBOR.fieldidx.push( cnt ) ;
		    } else {
			// NOP
		    }
		} else {
		    // Not near feature in this area
		}
	    }
	}
    }

    if ( type == 'structure' ) {
	// Last index 
	// Check structure Border Feature
	if ( world[ilen] ) {
	    if ( turf.booleanOverlap.default(world[ilen],area) ) {
		GH_NEIGHBOR.border.push ( turf.bboxClip.default(world[ilen],bbox) );
		GH_NEIGHBOR.borderidx.push ( cnt );
	    } else {
		if ( turf.booleanContains.default(area,world[ilen]) ) {
		    GH_NEIGHBOR.border.push ( world[ilen] );
		    GH_NEIGHBOR.borderidx.push ( cnt );
		} else {
		    // NOP
		}
	    }
	} else {
	    // NOP
	    // No Features
	    return;
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
	    // Need not update obstacle features
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

function ghUpdateTerrainStatus() {

    let point = turf.helpers.point( [ GH_UNIT_ARRAY[ghlngidx], GH_UNIT_ARRAY[ghlatidx] ] );
    let retid = GH_TERRAIN_STRUCT_NON;
    for (var i=0,len=GH_NEIGHBOR.border.length; i <len ; i++) {
	if ( turf.booleanPointInPolygon.default(point, GH_NEIGHBOR.border[i],{ignoreBoundary:true}) ) {
	    retid = GH_NEIGHBOR.borderidx[i];
	    break;
	} else {
	    // NOP
	}
    }
    _SetTerrain(retid,GH_TERRAIN_STRUCT_DIGIT);
    
    retid = GH_TERRAIN_FIELD_NON;
    for (var i = 0,len=GH_NEIGHBOR.field.length;i<len; i++) {
	let propkey = GH_NEIGHBOR.fieldidx[i];
	if ( GH_FIELD[propkey].keepout ) {
	    // NOP
	} else {
	    if ( turf.booleanPointInPolygon.default(point, GH_NEIGHBOR.field[i],{ignoreBoundary:true}) ) {
		retid = GH_NEIGHBOR.fieldidx[i];
		break;
	    } else {
		// NOP
	    }
	}
    }
    _SetTerrain(retid,GH_TERRAIN_FIELD_DIGIT);
    
    return;

}

//////////////////////////////////////////////////////


function ghUpdateAttackStatus() {
    if ( GH_ATTACK.unit == null ) {
	_SetStatus(GH_STATUS_ATK_NON,GH_STATUS_ATTACK_DIGIT);
	return false;
    } else {
	if ( _IsStatusAlive(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghstatusidx]) ) {
	    // NOP
	} else {
	    // Attack Unit is Retreat or init 
	    GH_ATTACK.unit = null;
	    _SetStatus(GH_STATUS_ATK_NON,GH_STATUS_ATTACK_DIGIT);
	    return false;
	}
    }

    let centerp = [ GH_UNIT_ARRAY[ghlngidx], GH_UNIT_ARRAY[ghlatidx] ];
    let center = turf.helpers.point( centerp );
    let widx = _GetStatus(GH_STATUS_WEAPON_DIGIT);
    if ( ! GH_WEAPON_ARY[widx] ) {
	//  Cannot load weapon data yet. Delay..
	_SetAttackedStatusOpponentUnit(GH_ATTACK.unit,false);
	_SetStatus(GH_STATUS_ATK_READY,GH_STATUS_ATTACK_DIGIT);	
	return false;
    }
    //
    //  Calc Attack Range
    //
    let attackdir = ghEmakiUtilDetectAttackAngle(
	GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghfrontdiridx],
	GH_UNIT_ARRAY[ghfrontdiridx]
    );
    let attacklength = ghEmakiFormationSizeGet(GH_UNIT_ARRAY[ghformationsizeidx],GH_FORMATIONSIZE_FRONT_DIGIT) + GH_WEAPON_ARY[widx].range;
    if ( attackdir == GH_DIR_FRONT ) {
	attacklength += ghEmakiFormationSizeGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghformationsizeidx],GH_FORMATIONSIZE_FRONT_DIGIT);
    } else if ( attackdir == GH_DIR_BACK  ) {
	attacklength += ghEmakiFormationSizeGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghformationsizeidx],GH_FORMATIONSIZE_BACK_DIGIT);
    } else if ( attackdir == GH_DIR_RIGHT ) {
	attacklength += ghEmakiFormationSizeGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghformationsizeidx],GH_FORMATIONSIZE_RIGHT_DIGIT);
    } else if ( attackdir == GH_DIR_LEFT ) {
	attacklength += ghEmakiFormationSizeGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghformationsizeidx],GH_FORMATIONSIZE_LEFT_DIGIT);
    } else {
	// NOP
    }
    
    //
    //  Create Attack area Sector
    //
    let rightsize = ghEmakiFormationSizeGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghformationsizeidx],GH_FORMATIONSIZE_RIGHT_DIGIT);
    let leftsize = ghEmakiFormationSizeGet(GH_SHAREDUNITS[GH_ATTACK.unit].unitarray[ghformationsizeidx],GH_FORMATIONSIZE_LEFT_DIGIT);
    let bearingoffsetright = Math.atan2(rightsize,GH_UNIT_ARRAY[ghfrontdiridx]) * GH_RADIAN2DEGREE;
    let bearingoffsetleft = Math.atan2(leftsize,GH_UNIT_ARRAY[ghfrontdiridx]) * GH_RADIAN2DEGREE;
    let bear1 = GH_UNIT_ARRAY[ghfrontdiridx] - bearingoffsetleft;
    let bear2 = GH_UNIT_ARRAY[ghfrontdiridx] + bearingoffsetright;
    let sector = turf.sector.default(center,attacklength,bear1,bear2,{
	'units' : 'meters',
	'steps' : 16
    });
    
    let array = [];
    let app = [];
    let ap = null;
    let attackline = null;
    for ( var key in GH_SHAREDUNITS ) {
	if ( _IsHostilityUnits(key) ) {
	    app = [ GH_SHAREDUNITS[key].unitarray[ghlngidx],GH_SHAREDUNITS[key].unitarray[ghlatidx] ];
	    ap = turf.helpers.point( app );
	    let d = turf.distance.default(center,ap,{units: 'meters'});
	    if ( d < attacklength ) {
		if ( turf.booleanPointInPolygon.default(ap,sector) ) {
		    if ( key == GH_ATTACK.unit ) {
			attackline = turf.helpers.lineString([ centerp, app ],{name: key});
		    }
		    let data = {
			"key" : key,
			"distance" : d,
			"point" : ap
		    }
		    array.push(data);
		} else {
		    // NOP
		}
	    } else {
		// NOP
	    }
	}
    }
    if ( attackline == null ) {
	// No Hostility in attack area Hostility far away
	_SetAttackedStatusOpponentUnit(GH_ATTACK.unit,false);
	_SetStatus(GH_STATUS_ATK_READY,GH_STATUS_ATTACK_DIGIT);	
	return false;
    } else {
	let isobstacleunit = false;
	let attacki = 0;
	//let unitwidth = 2 * ( GH_UNIT_ARRAY[ghleftsizeidx] + GH_UNIT_ARRAY[ghrightsizeidx] );
	let unitwidth = 2 * ( leftsize + rightsize );
	for (var i = 0; i < array.length; i++) {
	    if ( array[i].key == GH_ATTACK.unit ) {
		attacki = i;
		// NOP
	    } else {
		let dis = turf.pointToLineDistance.default(array[i].point,attackline,{units: 'meters'});
		if ( dis < unitwidth ) isobstacleunit = true;
	    }
	}
	if ( isobstacleunit ) {
	    _SetAttackedStatusOpponentUnit(GH_ATTACK.unit,false);
	    _SetStatus(GH_STATUS_ATK_READY,GH_STATUS_ATTACK_DIGIT);	
	    return false;
	} else {
	    GH_ATTACK.angle = attackdir;
	    let p0 = turf.midpoint.default(center,array[attacki].point) ;
	    GH_ATTACK.point = turf.midpoint.default(p0,array[attacki].point) ;  // 3/4 position
	    GH_ATTACK.distance = array[attacki].distance;
	    GH_ATTACK.interval = _CalcAttackInterval(widx);
	    _SetAttackedStatusOpponentUnit(GH_ATTACK.unit,true);
	    _SetStatus(GH_STATUS_ATK_ATTACK,GH_STATUS_ATTACK_DIGIT);
	    return true;
	}
    }
	
}

//////////////////////////////////////////
//
//    Main Animation Loop
//
//////////////////////////////////////////
function _ghAnimationLoop() {
    let interval = GH_CLOCK.update();

    ghUpdateNeighborFeature();
    ghUpdateAttackStatus();
    ghUpdateTerrainStatus();
    
    let status = _GetStatus(GH_STATUS_MOVE_DIGIT);
    let isatk = _GetStatus(GH_STATUS_ATTACK_DIGIT);
    
    if ( status > GH_STATUS_RETREAT ) {
	ghUpdateVelocity(interval,status,isatk);
	ghUpdateMarker(status,interval);
	if ( isatk == GH_STATUS_ATK_ATTACK || isatk == GH_STATUS_ATK_ATTACK_ATTACKED ) {
	    //UpdateAttackDamage(interval,status);
	    ghCalculateDamage(interval,status);
	} else {
	    //ghUpdateNodesFormation(interval);
	}
	ghUpdateNodesFormation(interval);
	
	ghUpdateFatigue(interval,status,isatk);

    } else {
	// NOP
    }

    var nextupdate = GH_MSPF_WORKER - interval;// mili second
    if ( nextupdate > 1 ) {
        GH_UNIT_TIMER = setTimeout(_ghAnimationLoop,nextupdate);        
    } else {
        GH_UNIT_TIMER = setTimeout(_ghAnimationLoop,1);        
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
    if ( type == 'weapon' ) {
	GH_WEAPON = {};
	GH_WEAPON_ARY = [];
    } else if ( type == 'formation' ) {
	GH_FORMATION = {};
	GH_FORMATION_ARY = [];
    } else {
	// NOP yet
    }
    let xhr = new XMLHttpRequest();
    xhr.open('GET', uri , true);
    xhr.responseType = 'json';
    xhr.onload = function() {
	if (this.status == 200) {
	    let data = this.response;
	    if ( type == 'weapon' ) {
		GH_WEAPON = data;
		for(var key in GH_WEAPON){
		    GH_WEAPON_ARY.push(GH_WEAPON[key]);
		}
	    } else if ( type == 'formation' ) {
		GH_FORMATION = data;
		for(var key in GH_FORMATION){
		    GH_FORMATION_ARY.push(GH_FORMATION[key]);
		}
	    } else if ( type == 'fieldgeometry' ) {
		// Extract and combine polygon
		if ( data.type == "FeatureCollection" )  {
		    for ( var i=0,len=data.features.length;i<len;i++ ) {
			_ExtractFieldFeatures(data.features[i],cnt);
		    }
		} else {
		    _ExtractFieldFeatures(data,cnt);
		}
	    } else if ( type == 'structgeometry' ) {
		// Extract and combine polygon
		if ( data.type == "FeatureCollection" )  {
		    for ( var i=0,len=data.features.length;i<len;i++ ) {
			_ExtractStructFeatures(data.features[i],cnt);
		    }
		} else {
		    _ExtractStructFeatures(data,cnt);
		}
		// array last index is Border Feature, Correct Here ??
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
	//GH_UNIT.ability.agility = parseFloat(data.value.ability.agility);
	// 30 %  MAX ( luck ratio )
	GH_UNIT.ability.luck = parseFloat(data.value.ability.luck) * 0.3;

	//  Speed Unit Conversion
	// Unit Conversion
	// [km/h] -> [m/mili-sec]
	GH_UNIT.ability.speed.max = parseFloat(data.value.ability.speed.max) / ( 60 * 60 );
	GH_UNIT.ability.speed.normal = parseFloat(data.value.ability.speed.normal) / ( 60 * 60 );
	GH_UNIT_SPEED.current = GH_UNIT.ability.speed.normal; // Default
	GH_UNIT_SPEED.coefficient = 0.5 / ( GH_UNIT_SPEED.current * GH_UNIT_SPEED.current );

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

	GH_DAMAGE.pernodes = parseFloat(data.value.damagepernodes);
	GH_NODE_DISTANCE_METER = parseFloat(data.value.nodedistance);

	// Check Node count 
	if ( GH_INIT_NODE_LENGTH == GH_UNIT_ARRAY[ghnodesidx]  ) {
	    _SendMessage('sharedbuffer','OK');
	} else {
	    _SendMessage('sharedbuffer','wrong');
	}

	_SendMessage('initialize','OK');
    } else if ( command == "unitspeed") {
	// Unit Conversion
	// [km/h] -> [m/mili-sec]
	//GH_UNIT.speed.current = parseFloat(data.value) / 3600 ;
	GH_UNIT_SPEED.current = parseFloat(data.value) / 3600 ;
    } else if ( command == "simulationspeed") {
	let v = parseFloat(data.value.elapsed);
	if ( v >= GH_CURRENT_ELAPSED ) {
	    GH_CLOCK.setSpeed( parseFloat(data.value.speed) );
	    GH_CURRENT_ELAPSED = v;
	    _SendMessage('simulationspeed','OK');
	} else {
	    let res = "wrong elapsed speed "  + v + " " +  GH_CURRENT_ELAPSED;
	    console.log(res);
	}
    } else if ( command == "playpause") {
	let v = parseFloat(data.value.elapsed);
	if ( v >= GH_CURRENT_ELAPSED ) {
	    GH_IS_PLAYING = data.value.isplaying;
	    if ( GH_IS_PLAYING ) {
		GH_CLOCK.play();
		if ( GH_UNIT_TIMER == null ) {
		    GH_UNIT_TIMER = setTimeout(_ghAnimationLoop);
		}
		_SendMessage('scene','playing');
	    } else {
		GH_CLOCK.pause();
		if ( GH_UNIT_TIMER != null ) {
                    clearTimeout(GH_UNIT_TIMER);
                    GH_UNIT_TIMER = null;
		}
		_SendMessage('scene','paused');
	    }
	    GH_CURRENT_ELAPSED = v;
	} else {
	    let res = "wrong elapsed scene "  + v + " " +  GH_CURRENT_ELAPSED;
	    console.log(res);
	}
    } else if ( command == "attack") {
	let unit = data.value;
	if ( unit == null ) {
	    if ( GH_ATTACK.unit ) {
		//  If current status attack,
		//  change attacked status opponent is false
		_SetAttackedStatusOpponentUnit(GH_ATTACK.unit,false);
	    }
	    GH_ATTACK.unit = null;
	    _SetStatus(GH_STATUS_ATK_NON,GH_STATUS_ATTACK_DIGIT);	    
	} else {
	    if ( GH_SHAREDUNITS[unit] ) {
		console.log(GH_UNIT.id + " attack unit for " + unit);
		GH_ATTACK.unit = unit;
		_SetStatus(GH_STATUS_ATK_READY,GH_STATUS_ATTACK_DIGIT);
	    } else {
		GH_ATTACK.unit = null;
		_SetStatus(GH_STATUS_ATK_NON,GH_STATUS_ATTACK_DIGIT);	    
	    }
	}
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
    } else if ( command == "weaponfile") {
	_loadExternalFile(data.value,'weapon',0);
    } else if ( command == "formationfile") {
	_loadExternalFile(data.value,'formation',0);
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
    } else if ( command == "attackdamageunit") {
	GH_DAMAGE.accumulation = GH_DAMAGE.accumulation + parseFloat(data.value);
	GH_DAMAGE.attackedcount = GH_DAMAGE.attackedcount + 1;

	if ( GH_SHOW_CONSOLE_ATTACK ) {
	    let txt = GH_UNIT.id + " " + GH_UNIT.corps + " <damaged> " + data.value + " (" + GH_DAMAGE.attackedcount + ") " + GH_DAMAGE.accumulation;
	    console.log(txt);
	}

	let currentnodes = _GetNodeCount();
	let damagenodes = Math.floor(GH_DAMAGE.accumulation * GH_DAMAGE.pernodes);
	let nextnodes = GH_INIT_NODE_LENGTH - damagenodes;
	if ( nextnodes < 0 ) nextnodes = 0;
	let reducenodes = currentnodes - nextnodes;

	if ( nextnodes < GH_STATUS_RETREAT_NODES ) {
	    // Unit Defeated
	    GH_UNIT_ARRAY[ghnodesidx] = 0;
	    GH_ATTACK.unit = null;
	    _SetStatus(GH_STATUS_RETREAT,GH_STATUS_MOVE_DIGIT);
	} else {
	    GH_UNIT_ARRAY[ghnodesidx] = nextnodes;
	}
	if ( reducenodes > 0 ) {
	    _SendUnitDamageNode(reducenodes);
	}
    } else {
        // NOP
    }
});

