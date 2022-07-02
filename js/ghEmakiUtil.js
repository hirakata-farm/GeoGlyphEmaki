//
//
//
//
//  ghEmaki Utility 
//
//
//
//
//
//

const GH_RSC_BASE_URI = '../RSC/';
const GH_RSC_DATA = 'data';
const GH_RSC_SOUND = 'sounds';
const GH_RSC_WEAPONICON = 'weaponicons';
const GH_RSC_GEOJSON = 'geojson';
const GH_RSC_MODELS = 'models';
const GH_RSC_FACEICON = 'faceicons';
const GH_RSC_OBJECTICON = 'objecticons';

function ghEmakiUtilGetResourceURI(type,file) {
    return GH_RSC_BASE_URI + type + "/" + file;
}
function ghEmakiUtilGetSimulationUri(file,lang) {
    return GH_RSC_BASE_URI + GH_RSC_DATA  + "/" + file + '.' + lang + '.json';
}



function ghEmakiUtilGetUniqueID() {
    let strong = 100000;
    return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
}

function ghEmakiUtilRandomInRange(minValue, maxValue) {
    return (minValue + Math.random() * (maxValue - minValue));
}

function ghEmakiUtilGetNumberInRange(val,min,max) {
    let v =  parseFloat(val);
    if ( isNaN(v) ) {
	return 0;
    }
    if ( v < min ) {
	v = min;
    }
    if ( v > max ) {
	v = max;
    }
    return v;
}

function ghEmakiUtilGetStringInRange(str,max) {
    var len = str.trim().length;
    if ( len > max ) {
	return str.substr(0,max);
    } else {
	return str;
    }

}

function ghEmakiUtilCreateTimeObject(str,year) {
    //00T06:00:00+09:00
    var ret = {
	"year" : 0,
	"months" : 0,
	"days" : 0,
	"hour" : 0,
	"min" : 0,
	"sec" : 0,
	"offset" : 0
    }

    let a = str.split("T");
    let y = a[0].split("-");
    if ( isNaN(y[0]) ) {
	console.log("Error String " + y[0]);
    } else {
	ret.year = parseInt(y[0],10);
    }
    if ( isNaN(y[1]) ) {
	console.log("Error String " + y[1]);
    } else {
	ret.months = parseInt(y[1],10);
    }
    if ( isNaN(y[2]) ) {
	console.log("Error String " + y[2]);
    } else {
	ret.days = parseInt(y[2],10);
    }

    let b = a[1].split(":");
    if ( isNaN(b[0]) ) {
	console.log("Error String " + b[0]);
    } else {
	ret.hour = parseInt(b[0],10);
    }
    if ( isNaN(b[1]) ) {
	console.log("Error String " + b[1]);
    } else {
	ret.min = parseInt(b[1],10);
    }
    let c = b[2].split("+");
    if ( isNaN(c[0]) ) {
	console.log("Error String " + c[0]);
    } else {
	ret.sec = parseInt(c[0],10);
    }
    if ( isNaN(c[1]) ) {
	console.log("Error String " + c[1]);
    } else {
	ret.offset = parseInt(c[1],10);
    }

    //  Important
    // FIX year ( for reason Long past year , BC )
    // Not consdireble time zone offset
    var t = null;
    if ( year == null ) {
	t = new Date( ret.year, ret.months-1, ret.days, ret.hour, ret.min, ret.sec );
    } else {
	t = new Date( year, ret.months-1, ret.days, ret.hour, ret.min, ret.sec );
    }
    console.log(t.toString());
    return t;

}


function ghEmakiUtilConsole(position, str, data) {
    var string = "Emaki: " + position + " : " + str + " : " + data;
    console.log(string);
}

function ghEmakiUtilDetectAttackAngle(defensebearing,attackbearing) {
    //
    //  turf.bearing
    //  Takes two points and finds the geographic bearing between them,
    //  i.e. the angle measured in degrees from the north line (0 degrees)
    //  bearing in decimal degrees, between -180 and 180 degrees (positive clockwise)
    //
    //  mybearing = my bearing angle ( degree ) from north
    //  otherbearing = other bearing angle ( degree ) from north
    //
    //
    //
    //  \      /
    //   \ F / 
    //    \  /
    //     \/
    //L -------- R -
    //    / \
    //   /   \
    //  /  B  \
    //


    if ( defensebearing > 180 ) {
	// for L.GeometryUtil.bearing(marker.center.getLatLng(),latlng);  ( 0 - 360 );
	defensebearing = defensebearing - 360.0;
	// result ( -180 - 180 )   see ghEmakiSharedArray.js [frontdiridx]
    }
    if ( attackbearing > 180 ) {
	// for L.GeometryUtil.bearing(marker.center.getLatLng(),latlng); ( 0 - 360 );
	attackbearing = attackbearing - 360.0;
	// result ( -180 - 180 )   see ghEmakiSharedArray.js [frontdiridx]
    }
    
    let side = 0;
    side = attackbearing - defensebearing ;

    if ( side < -130 ) {
	side = GH_DIR_FRONT;
    } else if ( side < -50 ) {
	side = GH_DIR_RIGHT;
    } else if ( side < 50 ) {
	side = GH_DIR_BACK;
    } else if ( side < 130 ) {
	side = GH_DIR_LEFT;
    } else {
	side = GH_DIR_FRONT;
    }

    return side;
}

function ghEmakiUtilGetHtmlArgument( param ) {
    let str = location.search.substring(1);
    let ret = [];
    if (str) {
        var x = str.split("&");
        for(var i=0,len=x.length;i<len;i++){
            var y = x[i].split("=");
            if ( y[0] == param ) {
                ret.push( y[1] );
            }
        }
    }
    return ret;
}

function ghEmakiUtilLoadImageToBase64( file, width, height, result ) {
    let img = new Image();
    img.src = file;
    img.onload = function () {
	let canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	let ctx = canvas.getContext('2d');
	ctx.clearRect(0,0,width,height);  // Clear transparent
	ctx.drawImage(img,0,0,width,height);
	result.imgbase64 = canvas.toDataURL('image/png');
	//console.log(result);
    }
}
