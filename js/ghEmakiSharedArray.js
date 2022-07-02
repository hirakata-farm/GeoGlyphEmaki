//////////////////////////////////////////////////////////
//
//
//   Shared Array Index
//      for 2D marker
//
//   data access for unitarray[ (INDEX) ]
//   ex ) unitarray[statusidx]
//
const ghstatusidx = 0;   //  Unit Status  see ghEmakiStatus.js
const ghnodesidx = 1;    //  Number of nodes ( strength of the unit )
const ghlatidx = 2;      //  Latitude Unit Marker [ degree ]
const ghlngidx = 3;      //  Longitude Unit Marker [ degree ]
const ghfrontdiridx = 4; //  Unit Front Angle ( bearing ) [ degree ] ( -180 - +180 )
const ghmovediridx = 5;  //  Unit Moving Direction ( bearing )  [ degree ] ( -180 - +180 )
const ghvelocityidx = 6; //  Unit Base Velocity [ meter / mili-sec ]

// Formation Size data
const ghformationsizeidx = 7; // Unit Formation Size   see ghEmakiFormation.js
//const ghrightsizeidx = 8;   // Unit Formation right side size ( length ) [ meter ]
//const ghleftsizeidx = 9;    // Unit Formation left side size ( length ) [ meter ]
//const ghbacksizeidx = 10;   // Unit Formation back side size ( length ) [ meter ]
const ghrationidx = 8;        // Unit Ration
const ghbulletidx = 9;        // Unit Bullet

//
//  Other params ( Only 2D )
//
const ghfatigueidx = 10;   // Fatigue
const ghtargetlatidx = 11; // Moving target Latitude [ degree ]
const ghtargetlngidx = 12; // Moving target Longitude [ degree ]
const ghterrainidx = 13;   // Terrain status  see ghEmakiTerrain.js

//
//  Other params ( Only 3D )
//
const ghcartesianx = 11;
const ghcartesiany = 12;
const ghcartesianz = 13;
const ghquaternionx = 14;
const ghquaterniony = 15;
const ghquaternionz = 16;
const ghquaternionw = 17;


// Unit Shared Array for 2D
const ghunit2delems = 14; 
const ghunit2dbytes = 8 * ghunit2delems;


// for all nodes data for 2D
//  alignment * elements * property.nodes ; // byte
const ghnode2delems = 2;   // [ lat, lng ]
const ghnode2dbytes = 8 * ghnode2delems;


// Unit Shared Array for 3D
const ghunit3delems = 18; 
const ghunit3dbytes = 8 * ghunit3delems;

// for all nodes data for 3D
//  alignment * elements * property.nodes ; // byte
const ghnode3delems = 5; //  3 is  elements in 3D position cartesian(x,y,z) and 2 is 2D position latlng(lat,lng)
const ghnode3dbytes = 8 * ghnode3delems;


