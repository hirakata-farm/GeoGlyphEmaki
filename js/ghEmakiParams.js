
//
//  Constant Params
//
//
const GH_REV = 'Revision 0.10';
const GH_FPS = 30;                  // [ frames/sec ]
const GH_MSPF = 1000/GH_FPS;        // [ mili-sec / frame ]
const GH_MSPF_WORKER = GH_MSPF/2.0; // [ mili-sec / frame ]

//
//  Library params
//
var GH_HAS_LEAFLET = false;
if(typeof L != "undefined"){
    GH_HAS_LEAFLET = true;
}
var GH_HAS_CESIUM = false;
if(typeof Cesium != "undefined"){
    GH_HAS_CESIUM = true;
}


//  1 degree ( lat ) = 110946.3 [m]
//  1 [m] = 0.000009013 ( deg lat )
const GH_LAT_DEG_PER_METER = 0.000009013;
const GH_METER_PER_NODE = 3; // Exclusive distance per person (node)


/////////////////////////////
//
//    UNIT conversion
//

const GH_RADIAN2DEGREE = 180.0 / Math.PI;
const GH_DEGREE2RADIAN = Math.PI / 180.0;

//    UNIT Direction
const GH_DIR_FRONT = 0;
const GH_DIR_RIGHT = 1;
const GH_DIR_LEFT = 2;
const GH_DIR_BACK = 3;

//  Attack Range Sector
//const GH_ATTACK_BEARING_RANGE = 23.0; // [degree]
    
///////////////
//
//  FATIGUE
//
//https://joyfit.jp/aojoy/health_column/post03/
//3000 Kcal / day
//
//https://keisan.casio.jp/exec/system/1536633800
//134[m/s] (8km/h) 
//1 [min] = 133 [m] = 8.7 [Kcal]
//344[min] = 3000Kcal = 45,862[m]
//

const GH_FATIGUE_MAX = 3000;  // [Kcal]
const GH_FATIGUE_MAX_HALF = 1600;  // [Kcal]
const GH_FATIGUE_WEIGHT = 60 * 1.05;

const GH_FATIGUE_VEL_STOP_RATIO = 1;
const GH_FATIGUE_VEL_MOVE_RATIO = 0.8;

const GH_FATIGUE_TER_REPL_RATIO = 3;
const GH_FATIGUE_TER_WAIT_NON_RATIO = 2;
const GH_FATIGUE_TER_WAIT_ATK_RATIO = 0.7;
const GH_FATIGUE_TER_MOVE_RATIO = 0.5;

//
//const GH_FATIGUE_METS[GH_STATUS_MOVE_DIGIT(0-5)][GH_STATUS_ATTACK_DIGIT(0-7)]
//
const GH_FATIGUE_METS = [
    [      0,      0,      0,      0,      0,      0,      0,      0 ],    // NOP
    [      0,      0,      0,      0,      0,      0,      0,      0 ],    // NOP
    [      0,      0,  -12.2,      0,      0,      0,      0,      0 ],    // REPL
    [      0,      0,   -6.8,      4,     16,     16,     16,     20 ],    // WAIT
    [      0,      0,      8,     12,     16,     16,     16,     20 ],    // CHASE
    [      0,      0,      8,     12,     16,     16,     16,     20 ]     // ROUTE
]    


//const GH_FATIGUE_MAX = 3000;  // [Kcal]
//const GH_FATIGUE_WEIGHT = 60 * 1.05;
////const GH_METS_WAIT = -1.7;
//const GH_METS_WAIT = -6.8;
//const GH_METS_MOVE = 8.0;
//const GH_METS_ATTACK = 16.0;
//var GH_FATIGUE_COEFF = Array(10);
//GH_FATIGUE_COEFF.fill( GH_METS_WAIT * GH_FATIGUE_WEIGHT / 3600 );
//GH_FATIGUE_COEFF[GH_STATUS_WAIT] = GH_METS_WAIT * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
//GH_FATIGUE_COEFF[GH_STATUS_CHASE] = GH_METS_MOVE * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
//GH_FATIGUE_COEFF[GH_STATUS_ROUTE] = GH_METS_MOVE * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
////GH_FATIGUE_COEFF[GH_STATUS_ATTACK] = GH_METS_ATTACK * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
//GH_FATIGUE_COEFF[GH_STATUS_ATK_ATTACK] = GH_METS_ATTACK * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
//GH_FATIGUE_COEFF[GH_STATUS_ATK_NON_ATTACKED] =  GH_METS_ATTACK * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
//GH_FATIGUE_COEFF[GH_STATUS_ATK_READY_ATTACKED] =  GH_METS_ATTACK * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
//GH_FATIGUE_COEFF[GH_STATUS_ATK_ATTACK_ATTACKED] = GH_METS_ATTACK * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]



//   Fort Benefit
//const GH_METS_WAIT_STRUCTURE = -4.8;
//const GH_METS_WAIT_STRUCTURE = -19.2;
//const GH_METS_ATTACK_STRUCTURE = 7.8;
//const GH_FATIGUE_WAIT_STRUCTURE = GH_METS_WAIT_STRUCTURE * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
//const GH_FATIGUE_ATTACK_STRUCTURE = GH_METS_ATTACK_STRUCTURE * GH_FATIGUE_WEIGHT / 3600;     // [Kacl / sec]
//const GH_FATIGUE_FUNC_ALPHA = Math.pow(0.1,1.0/(GH_FATIGUE_MAX*1.5));  // y = GH_FATIGUE_FUNC_ALPHA^x 

//const GH_FATIGUE_TERRAIN_BENEFIT = 100;
//const GH_FATIGUE_ATTACKED_RATIO = 5.0;



/////////////////////////
//
//   Velocity Ratio
//
const GH_VELOCITY_FRONT_ATTACK_RATIO = 0.2;
const GH_VELOCITY_FRONT_ATTACK_ATTACKED_RATIO = 0.1;
const GH_VELOCITY_BACK_ATTACK_RATIO = 0.4;
const GH_VELOCITY_BACK_ATTACK_ATTACKED_RATIO = 0.2;

const GH_VELOCITY_ATTACK_NON_RATIO = 1.0;
const GH_VELOCITY_ATTACKED_RATIO = 0.5;




/////////////////////////
//
//   Damage Param
//
//  written in json file
var GH_DAMAGE_ATTACK_PER_NODES = 1.0/8000.0;
const GH_DAMAGE_ATTACK_CRITICAL = 1.5;
const GH_DAMAGE_ATTACK_CRITICAL_MINIMUN = 0.5;
const GH_DAMAGE_ATTACK_MINIMAM_RATIO = 0.03;

var GH_ATTACK_DAMAGE_RATIO = [];
GH_ATTACK_DAMAGE_RATIO[GH_DIR_FRONT] = 1.0;
GH_ATTACK_DAMAGE_RATIO[GH_DIR_RIGHT] = 1.5;
GH_ATTACK_DAMAGE_RATIO[GH_DIR_LEFT] = 1.5;
GH_ATTACK_DAMAGE_RATIO[GH_DIR_BACK] =  2.0;
var GH_DEFENSE_DAMAGE_RATIO = [];
GH_DEFENSE_DAMAGE_RATIO[GH_DIR_FRONT] = 1.1;
GH_DEFENSE_DAMAGE_RATIO[GH_DIR_RIGHT] = 0.7;
GH_DEFENSE_DAMAGE_RATIO[GH_DIR_LEFT] = 0.7;
GH_DEFENSE_DAMAGE_RATIO[GH_DIR_BACK] =  0.4;

//
//
//   Within , Target arravied!
//
//
//const GH_LENGTH_TARGET_AREA = 10; // [m];

///////var GH_SHOW_TARGET_PATH = false;


//var GH_VELOCITY_ATTACK_RATIO_FRONT = 0.005;
//const GH_VELOCITY_ATTACK_RATIO_FRONT = 0.01;
//const GH_VELOCITY_ATTACK_RATIO_BACK = 0.8;

//
//  GH_DAMAGE PER_NODES
//    larger -> damage value will be small; -> small reduce nodes
//     60;
//    smaller -> damage value will be large; -> much reduce nodes
//
//   see ghEmakiUnit2dSimWorker.js  ghUpdateAttackDamage(interval)
//
//const GH_ATTACK_DAMAGE_PER_NODES = 1.0/70.0; //Okehazama
//const GH_ATTACK_DAMAGE_PER_NODES = 1.0/8000.0;

//


//const GH_CORPS_COLOR = [ 'green', 'maroon' , 'olive', 'orange','green', 'maroon' , 'olive', 'orange' ];


/////////////////////////
//
//  Replenish Param
//

const GH_REPLENISH_BULLET_PER_FRAME = 1;
const GH_REPLENISH_RATION_PER_FRAME = 1;


//////////////////////////////////////////
//
//  For Debug
//
const GH_SHOW_CONSOLE_COMMAND = false;
const GH_SHOW_CONSOLE_FATIGUE = false;
const GH_SHOW_CONSOLE_ATTACK = true;


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//https://retu27.com/denji_seiden_kuron.html
//const GH_FORCE_CONST_BASE = 0.000066743;
//const GH_FORCE_CONST_BASE = 0.18 * 8.9876e-9;
//const GH_FORCE_CONST_BASE = 0.12 * 8.9876e-9;
//const GH_FORCE_CONST_ATR = 1.2 * GH_FORCE_CONST_BASE;  // Atract
//const GH_FORCE_CONST_REP = GH_FORCE_CONST_BASE;      // Reverse
//const GH_FORCE_CONST_ATR_MYCENTER = 1.4 * GH_FORCE_CONST_BASE;  // Atract My Center unit
// k = 8.9876×10^9 N·m2·A−2·s−2  coulomb
// G = 6.67430(15)×10^−11 m3 kg−1 s−2 gravity
//const GH_FORCE_DISTANCE_METER = 0.7; // avoid same corps unit distance ghUpdateNodesForceSimulation(interval)

//////////////////////////////////////////////////////////

//const GH_FATIGUE_WAIT_RECOVER = 0.4 / 100; // 0.003
//const GH_FATIGUE_ALERT_RECOVER = GH_FATIGUE_WAIT_RECOVER * 0.6;
//const GH_FATIGUE_ATTACK = 120.0;
//const GH_FATIGUE_ATTACK_OPPONENT = GH_FATIGUE_ATTACK * 0.1;


// https://ja.wikipedia.org/wiki/%E8%A1%8C%E8%BB%8D#:~:text=%E8%A1%8C%E8%BB%8D1%E6%97%A5%E3%81%AE%E8%A1%8C%E7%A8%8B,120km%E3%82%92%E6%A8%99%E6%BA%96%E3%81%A8%E3%81%99%E3%82%8B%E3%80%82
//  80 [meter/min]
//lower is slower and higher is faster
//const GH_SPEED_BASE = 2.0; 

//
//   attack range
//    = property.attack.range * GH_ATTACK_RANGE
//
//////////const GH_ATTACK_RANGE_ALERT = 50;


//
// 1 - 1000
//  = 0.001 damage small
//  = 10 damage larger
//const GH_ATTACK_DAMAGE = 0.007;
//const GH_ATTACK_DAMAGE = 0.00128;
//const GH_ATTACK_INTERVAL = 40 * 1000 ; // A attack interval  40 sec [ mili sec  ]
//const GH_VELOCITY_BACKWARD_RATIO = -1.8;


////////////////////////
//
//    Command
//
//  route Lat0 Lng0 Lat1 Lng1 Lat2 Lng2 .....
//
//  chase unit ( target object key )
//
//  speed [number]
//
//  attack none
//  attack unit (target object key)
//  attack structure (target object key)  
//
//  wait
//
//  replenish
//
//  formation ( object key )
//
//  weapon ( object key )
//
//
////////////////////////




