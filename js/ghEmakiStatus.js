
//
//
//
//


///////////////////////////////////////////////////////////////////////////////////////
//
//    UNIT Status
//

//
//  Item      Skill    Weapon   Formation   Attack     Move
//  2 digit  2 digit  2 digit    1 digit   1 digit   1 digit 
//   00        00        00        0         0          0
//
//
const GH_STATUS_RAW_DIGIT = 1;

const GH_STATUS_MOVE_DIGIT = 10;
const GH_STATUS_RETREAT = 0;
const GH_STATUS_REPL = 2;
const GH_STATUS_WAIT = 3;
const GH_STATUS_CHASE = 4;
const GH_STATUS_ROUTE = 5;

const GH_STATUS_ATTACK_DIGIT = 100;
const GH_STATUS_ATK_NON = 2;
const GH_STATUS_ATK_NON_ATTACKED = 5;
const GH_STATUS_ATK_READY = 3;
const GH_STATUS_ATK_READY_ATTACKED = 6;
const GH_STATUS_ATK_ATTACK = 4;
const GH_STATUS_ATK_ATTACK_ATTACKED = 7;

const GH_STATUS_ATK_ADD_ATTACKED = 3;
const GH_STATUS_ATK_REMOVE_ATTACKED = -3;

const GH_STATUS_FORMATION_DIGIT =       1000;
const GH_STATUS_WEAPON_DIGIT    =     100000;
const GH_STATUS_SKILL_DIGIT     =   10000000;
const GH_STATUS_ITEM_DIGIT      = 1000000000;

const GH_STATUS_INITIALIZE = 23;
//
//console.log(Number.MAX_SAFE_INTEGER);
// output: 9007199254740991
//

var GH_STATUS_COLOR = Array(10);
GH_STATUS_COLOR.fill('#37474F');
GH_STATUS_COLOR[GH_STATUS_REPL] = '#2E7D32';
GH_STATUS_COLOR[GH_STATUS_WAIT] = '#9E9D24';
GH_STATUS_COLOR[GH_STATUS_CHASE] = '#673AB7';
GH_STATUS_COLOR[GH_STATUS_ROUTE] = '#2196F3';
//GH_STATUS_COLOR[GH_STATUS_ATK_ATTACK] = '#b71c1c';
//GH_STATUS_COLOR[GH_STATUS_ATK_NON_ATTACKED] = '#b71c1c';
//GH_STATUS_COLOR[GH_STATUS_ATK_READY_ATTACKED] = '#b71c1c';
GH_STATUS_COLOR[GH_STATUS_ATK_ATTACK_ATTACKED] = '#b71c1c';

const GH_STATUS_RETREAT_NODES = 1;

function ghEmakiStatusGet(value,type) {
    let b = 0;
    switch (type) {
    case GH_STATUS_MOVE_DIGIT :
	return value % GH_STATUS_MOVE_DIGIT;
	break;
    case GH_STATUS_ATTACK_DIGIT :
	b = value % GH_STATUS_ATTACK_DIGIT;
	return Math.floor(b/GH_STATUS_MOVE_DIGIT);
	break;
    case GH_STATUS_FORMATION_DIGIT :
	b = value % GH_STATUS_FORMATION_DIGIT;
	return Math.floor(b/GH_STATUS_ATTACK_DIGIT);
	break;
    case GH_STATUS_WEAPON_DIGIT :
	b = value % GH_STATUS_WEAPON_DIGIT;
	return Math.floor(b/GH_STATUS_FORMATION_DIGIT);
	break;
    case GH_STATUS_SKILL_DIGIT :
	b = value % GH_STATUS_SKILL_DIGIT;
	return Math.floor(b/GH_STATUS_WEAPON_DIGIT);
	break;
    case GH_STATUS_ITEM_DIGIT :
	b = value % GH_STATUS_ITEM_DIGIT;
	return Math.floor(b/GH_STATUS_SKILL_DIGIT);
	break;
    case GH_STATUS_RAW_DIGIT :
	return value;
	break;
    default:
	return value % GH_STATUS_MOVE_DIGIT;
    }
}

function ghEmakiStatusSet(rawdata,value,type) {

    let oldvalue = ghEmakiStatusGet(rawdata,type);
    let diff = value - oldvalue;
    switch (type) {
    case GH_STATUS_MOVE_DIGIT :
	if ( diff > -10 && diff < 10 ) {
	    return rawdata + ( diff * 1 );
	}
	break;
    case GH_STATUS_ATTACK_DIGIT :
	if ( diff > -10 && diff < 10 ) {
	    return rawdata + ( diff * 10 );
	}
	break;
    case GH_STATUS_FORMATION_DIGIT :
	if ( diff > -10 && diff < 10 ) {
	    return rawdata + ( diff * 100 );
	}
	break;
    case GH_STATUS_WEAPON_DIGIT :
	if ( diff > -100 && diff < 100 ) {
	    return rawdata + ( diff * 1000 );
	}
	break;
    case GH_STATUS_SKILL_DIGIT :
	return rawdata + ( diff * 100000 );
	break;
    case GH_STATUS_ITEM_DIGIT :
	return rawdata + ( diff * 10000000 );
	break;
    case GH_STATUS_RAW_DIGIT :
	return value;
	break;
    default:
	// Not change data
	return rawdata;
    }
}
