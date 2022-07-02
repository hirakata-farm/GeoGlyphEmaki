///////////////////////////////////////////////////////////////////////////////////////
//
//  Formation Size
//
//
//  Front      Back    Right    Left 
//  3 digit  3 digit  3 digit  3 digit
//   000       000      000      000 
//
// Unit Formation front side size ( length ) [ meter ]
// Unit Formation right side size ( length ) [ meter ]
// Unit Formation left side size ( length ) [ meter ]
// Unit Formation back side size ( length ) [ meter ]
//
const GH_FORMATIONSIZE_RAW_DIGIT = 1;
const GH_FORMATIONSIZE_ALL_DIGIT = 0;
const GH_FORMATIONSIZE_FRONT_DIGIT = 1000000000000;
const GH_FORMATIONSIZE_BACK_DIGIT =     1000000000;
const GH_FORMATIONSIZE_RIGHT_DIGIT =       1000000;
const GH_FORMATIONSIZE_LEFT_DIGIT =           1000;

const GH_FORMATIONSIZE_INITIALIZE =     1001001001;
//
//console.log(Number.MAX_SAFE_INTEGER);
// output: 9007199254740991
//
function ghEmakiFormationSizeGet(value,type) {
    let b = 0;
    switch (type) {
    case GH_FORMATIONSIZE_LEFT_DIGIT :
	return value % GH_FORMATIONSIZE_LEFT_DIGIT;
	break;
    case GH_FORMATIONSIZE_RIGHT_DIGIT :
	b = value % GH_FORMATIONSIZE_RIGHT_DIGIT;
	return Math.floor(b/GH_FORMATIONSIZE_LEFT_DIGIT);
	break;
    case GH_FORMATIONSIZE_BACK_DIGIT :
	b = value % GH_FORMATIONSIZE_BACK_DIGIT;
	return Math.floor(b/GH_FORMATIONSIZE_RIGHT_DIGIT);
	break;
    case GH_FORMATIONSIZE_FRONT_DIGIT :
	b = value % GH_FORMATIONSIZE_FRONT_DIGIT;
	return Math.floor(b/GH_FORMATIONSIZE_BACK_DIGIT);
	break;
    case GH_FORMATIONSIZE_ALL_DIGIT :
	let left = value % GH_FORMATIONSIZE_LEFT_DIGIT;
	let right = Math.floor((value % GH_FORMATIONSIZE_RIGHT_DIGIT)/GH_FORMATIONSIZE_LEFT_DIGIT);
	let back = Math.floor((value % GH_FORMATIONSIZE_BACK_DIGIT)/GH_FORMATIONSIZE_RIGHT_DIGIT);
	let front = Math.floor((value % GH_FORMATIONSIZE_FRONT_DIGIT)/GH_FORMATIONSIZE_BACK_DIGIT);
	return [ front, back, right, left ];
    case GH_FORMATIONSIZE_RAW_DIGIT :
	return value;
	break;
    default:
	return value;
    }
}

function ghEmakiFormationSizeSet(rawdata,value,type) {

    if ( type == GH_FORMATIONSIZE_ALL_DIGIT ) {
	// value is array [ front, back , right , left ]
	// check range
	if ( Array.isArray(value) ) {
	    if ( value.length == 4 ) {
		for ( var i=0,len=value.length;i<len;i++ ) {
		    if ( value[i] > -1000 && value[i] < 1000 ) {
			value[i] = Math.floor( Math.abs(value[i]) );
		    } else {
			value[i] = 999;
		    }
		}
		return value[0] * GH_FORMATIONSIZE_BACK_DIGIT
		    + value[1] * GH_FORMATIONSIZE_RIGHT_DIGIT
	    	    + value[2] * GH_FORMATIONSIZE_LEFT_DIGIT
	    	    + value[3] ;
	    } else {
		return rawdata;
	    }
	} else {
	    return rawdata;
	}
    } else {
	let oldvalue = ghEmakiFormationSizeGet(rawdata,type);
	let diff = value - oldvalue;
	switch (type) {
	case GH_FORMATIONSIZE_LEFT_DIGIT :
	    if ( diff > -1000 && diff < 1000 ) {
		return rawdata + ( diff * 1 );
	    }
	    break;
	case GH_FORMATIONSIZE_RIGHT_DIGIT :
	    if ( diff > -1000 && diff < 1000 ) {
		return rawdata + ( diff * 1000 );
	    }
	    break;
	case GH_FORMATIONSIZE_BACK_DIGIT :
	    if ( diff > -1000 && diff < 1000 ) {
		return rawdata + ( diff * 1000000 );
	    }
	    break;
	case GH_FORMATIONSIZE_FRONT_DIGIT :
	    if ( diff > -1000 && diff < 1000 ) {
		return rawdata + ( diff * 1000000000 );
	    }
	    break;
	case GH_STATUS_RAW_DIGIT :
	    return value;
	    break;
	default:
	    // Not change data
	    return rawdata;
	}
    }
}

//////////////////////////////////////////////
//
//
//  Formation Unit Function
//
//
function ghGetFormationLines(formation,nodecnt) {
    if ( formation == 0 ) {
	// tate ( 1, 4 )
	return Math.ceil( 1 * Math.sqrt(nodecnt / ( 1 * 4 )) );
    } else if ( formation == 1 ) {
	// yoko	( 4, 1 )
	return Math.ceil( 4 * Math.sqrt(nodecnt / ( 4 * 1 )) );
    } else if ( formation == 2 ) {
	// hou ( 1, 1 )
	return Math.ceil( 1 * Math.sqrt(nodecnt / ( 1 * 1 )) );
    } else if ( formation == 3 ) {
	// ou  Concave ( 2,1 )
	return Math.ceil( 2 * Math.sqrt(nodecnt / ( 2 * 1 )) );
    } else if ( formation == 4 ) {
	// totsu Convex ( 3,2 )
	return Math.ceil( 3 * Math.sqrt(nodecnt / ( 3 * 2 )) );
    } else {
	// 1:1 Square
	return Math.ceil( 1 * Math.sqrt(nodecnt / ( 1 * 1 )) );
    }
}


function ghCalcLineFormation(id,xlines,xcenter,ycenter,randx,randy) {

    // Quantize
    var qx = id % xlines;
    var qy = Math.floor(id/xlines);

    // Calc Ideal Node Coordinate
    var x = ( qx * GH_NODE_DISTANCE_METER ) + randx - xcenter;
    var y = ( qy * GH_NODE_DISTANCE_METER ) + randy - ycenter;
     
    //if ( Math.abs(x) < GH_NODE_DISTANCE_METER ) front = y;
    
    var r = Math.sqrt(x*x+y*y) ; // [meter]
    var theta = Math.atan2(y,x) * GH_RADIAN2DEGREE; // Degree
    theta = 90.0 - theta ;  //  convert ( 0 from North ) clockwise positive

    //let idealpoint = turf.destination.default(center, r, theta + angle , { units: 'kilometers'});
    //return idealpoint;

    return { "radius" : r , "theta" :  theta , "xval" : x, "yval" : y }

}

function ghCalcLinerTransformFormation(id,xlines,xcenter,ycenter,centeroffset,yoffset,randx,randy) {

    // Quantize
    var qx = id % xlines;
    var qy = Math.floor(id/xlines);

    // Calc Ideal Node Coordinate  DEFORM
    var x = ( qx * GH_NODE_DISTANCE_METER ) + randx - xcenter ;
    var y = ( qy * GH_NODE_DISTANCE_METER ) + randy - ycenter ;
    let ky = centeroffset / xcenter;
    if ( x < 0 ) {
	// NOP
    } else {
	ky = -1 * ky;
    }
    y = y + ( ky * x ) + centeroffset + yoffset;
    //if ( Math.abs(x) < GH_NODE_DISTANCE_METER ) front = y;

    var r = Math.sqrt(x*x+y*y) ; // [meter]
    var theta = Math.atan2(y,x) * GH_RADIAN2DEGREE; // Degree
    theta = 90.0 - theta ;  //  rotate ( 0 from North ) clockwise positive
    
    return { "radius" : r , "theta" :  theta , "xval" : x, "yval" : y }

    //let idealpoint = turf.destination.default(center, r, theta + angle , { units: 'kilometers'});
    //return idealpoint;
}


function ghCalcArcTransformFormation(id,xlines,xcenter,ycenter,radius,xradiuscenter,yradiuscenter,yoffset,randx,randy) {

    // Quantize
    var qx = id % xlines;
    var qy = Math.floor(id/xlines);

    // Calc Ideal Node Coordinate  DEFORM
    var x = ( qx * GH_NODE_DISTANCE_METER ) + randx - xcenter;
    var y = ( qy * GH_NODE_DISTANCE_METER ) + randy - ycenter;
    let d = Math.pow(radius, 2 ) - Math.pow( x - xradiuscenter , 2 );

    if ( d < 0 ) d = 0;
    if ( radius < 0 ) {
	y = y - Math.sqrt( d ) + yradiuscenter + yoffset;
    } else {
	y = y + Math.sqrt( d ) + yradiuscenter + yoffset;
    }
    //if ( Math.abs(x) < GH_NODE_DISTANCE_METER ) front = y;
    
    var r = Math.sqrt(x*x+y*y) ; // [meter]
    var theta = Math.atan2(y,x) * GH_RADIAN2DEGREE; // Degree
    theta = 90.0 - theta ;  //  rotate ( 0 from North ) clockwise positive
    return { "radius" : r , "theta" :  theta , "xval" : x , "yval" : y }

    //let idealpoint = turf.destination.default(center, r, theta + angle , { units: 'kilometers'});
    //return idealpoint;
}

