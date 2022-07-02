//
//
//
//   Emaki Terrain 2D
//
//
//
//
//http://geojson.io/
//https://geoman.io/geojson-editor
//
//

//
//  Library params
//
//var GH_HAS_LEAFLET = false;
//if(typeof L != "undefined"){
//    GH_HAS_LEAFLET = true;
//}
//var GH_HAS_CESIUM = false;
//if(typeof Cesium != "undefined"){
//    GH_HAS_CESIUM = true;
//}

///////////////////////////////////////////////////////////////////////////////////////
//
//    Terrain Status
//

//
// Defense Number Struct ID  Field ID
//     5 digit      3 digit   3 digit 
//     00000         000       000
//
//
const GH_TERRAIN_RAW_DIGIT = 1;
const GH_TERRAIN_FIELD_DIGIT  =           1000;
const GH_TERRAIN_STRUCT_DIGIT =       10000000;
const GH_TERRAIN_NODE_DIGIT   = 10000000000000;

const GH_TERRAIN_STRUCT_NON = 999;
const GH_TERRAIN_FIELD_NON = 999;

const GH_TERRAIN_INITIALIZE = 999999;

function ghEmakiTerrainGet(value,type) {
    let b = 0;
    switch (type) {
    case GH_TERRAIN_FIELD_DIGIT :
	return value % GH_TERRAIN_FIELD_DIGIT;
	break;
    case GH_TERRAIN_STRUCT_DIGIT :
	b = value % GH_TERRAIN_STRUCT_DIGIT;
	return Math.floor(b/GH_TERRAIN_FIELD_DIGIT);
	break;
    case GH_TERRAIN_NODE_DIGIT :
	b = value % GH_TERRAIN_NODE_DIGIT;
	return Math.floor(b/GH_TERRAIN_STRUCT_DIGIT);
	break;
    case GH_STATUS_RAW_DIGIT :
	return value;
	break;
    default:
	return value % GH_TERRAIN_FIELD_DIGIT;
    }
}


function ghEmakiTerrainSet(rawdata,value,type) {

    let oldvalue = ghEmakiTerrainGet(rawdata,type);
    let diff = value - oldvalue;
    // If need , diff data check!
    switch (type) {
    case GH_TERRAIN_FIELD_DIGIT :
	if ( diff > -1000 && diff < 1000 ) {
	    return rawdata + ( diff * 1 );
	}
	break;
    case GH_TERRAIN_STRUCT_DIGIT :
	if ( diff > -1000 && diff < 1000 ) {
	    return rawdata + ( diff * 1000 );
	}
	break;
    case GH_TERRAIN_NODE_DIGIT :
	if ( diff > -100000 && diff < 100000 ) {
	    return rawdata + ( diff * 10000000 );
	}
	break;
    case GH_STATUS_RAW_DIGIT :
	return value;
	break;
    default:
	// No change data 
	return rawdata;
    }
}


///////////////////////////////////////

//
//const GH_ST_COLOR = {
//    "fort" : '#5d4037',
//    "catsle" : '#212121',
//    "tower" : '#607d8b',
//    "shrine": '#bf360c'
//}
    
function EmakiStructure(idkey,idx,data,mtype,damagepernodeorcolor) {

    let myid = null;
    let myidx = 0;

    let name = null;
    let owner = null;
    let description = null;
    let endurance = 0;
    let latlng = null;
    let cartesian = null;

    let stock = {
	"initration" : 0,
	"ration" : 0,
	"initbullet" : 0,
	"bullet" : 0
    }
    
    let markertype = 'icon'; // Leaflet Layer Type icon or circle
    let marker = null;  // Leaflet Layer
    let modelobj = null;   // Cesium Entity Object
    let model = null;   // Cesium Viewer 
    
    let damage = {
	"accumulation" : 0,
	"attackcount" : 0,
	"initdefense" : 0,
	"pernodes" : damagepernodeorcolor
    }
    
    let geojsonuri = null;
    let rawgeojson = null;    // 2D geojson turf
    let bordergeojson = null;        // 2D geojson border turf
    let layergeojson = null;         // 2D leaflet layer
    let entitygeojson = null;     // 3D Cesium Object
//    let entity    = null; // 3D Cesium Viewer
//    let circlemarker = null;

    if ( idkey == null ) return;
    if ( data == null ) return;

    //
    //
    //  Private 
    //
    //
    var _MarkerTooltip = function() {
	let txt = name + "<BR>";
	if ( markertype == 'circle' ) {
	    txt += myid;
	} else {
	    txt += GH_TXT_DEFENSE[GH_LANG] + ":" + endurance;
	    txt += "<BR>" + GH_TXT_BULLET[GH_LANG] + ":" + stock.bullet;
	}
	//let txt = name + "<BR>" + description + "<BR>" + GH_TXT_DEFENSE[GH_LANG] + ":" + endurance;
	//let txt = name + "<BR>" + description + "<BR>";
	return txt;
    }
    var _LoadGeojson = function(file) {
	$.ajax({
	    dataType: "json",
	    url: file,
	    async : true
	}).done(function(data) {
	    rawgeojson = data;
	    // create border feature
	    //  explode and convex(combine)
	    bordergeojson = turf.convex.default( turf.explode.default(data) );
        }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	    var msg = "GeoJson data cannot load ";
	    console.log( msg );
	});
    }
    var _LoadLeafletGeojson = function(file) {
	$.ajax({
	    dataType: "json",
	    url: file,
	    async : true
	}).done(function(data) {
	    layergeojson = new L.geoJson(data,{
                style: function (feat) {
                    return {
			'color' : '#5d4037',
			'weight' : 4,
			'lineCap' : 'butt',
			'fill' : true,
			'fillColor' : '#5d4037',
			'fillOpacity' : 0.8
		    };
                }
            });
        }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	    var msg = "GeoJson data cannot load ";
	    console.log( msg );
	});
    }
    var _LoadCesiumGeojson = function(file) {
        var stpromise = Cesium.GeoJsonDataSource.load( file );
        stpromise.then(function (dataSource) {
            //Get the array of entities
            var ent = dataSource.entities.values;
            for (var j = 0; j < ent.length; j++) {
                var et = ent[j];
                et.polygon.material = Cesium.Color.GREY;
                et.polygon.outline = false;
                et.polygon.extrudedHeight = 1;
                et.polygon.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
            }
	    entitygeojson = dataSource;
        }).otherwise(function (error) {
            var msg = "station geojson file cannot load " + uri + " ";
            msg += " XMLHttpRequest " + XMLHttpRequest.status ;
            msg += " textStatus " + textStatus ;
            console.log( msg );        
        });   
    }
    var _SetBullet = function(val) {
	if ( val < 0 ) val = 0;
	if ( val > stock.initbullet ) val = stock.initbullet;
	stock.bullet = val;
    }
    var _Add3DGeoJson = function(view) {
	if ( entitygeojson ) {
	    view.dataSources.add(entitygeojson);
	} else {
	    setTimeout(_Add3DGeoJson, 2000, view );
	}
    }
    var _Add2DGeoJson = function(map) {
	if ( layergeojson ) {
	    layergeojson.addTo(map);
	} else {
	    setTimeout(_Add2DGeoJson, 2000, map );
	}
    }
    ///////////////////////////////////////
    // 
    //  External Method
    //
    this.draw2DMap = function(map,key) {
	if ( marker ) {
	    marker.setMarkerName(key);
	    marker.setMarkerType('structure');
	    marker.addTo(map);
	}
	if ( geojsonuri ) {
	    // async mode
	    _Add2DGeoJson(map);
	}
	//if ( layer ) {
	//    layer.addTo(map);
	//}

	// for test
//	L.geoJson(featureborder,{
//            style: function (f) {
//                return {
//		    'color' : '#FF0000',
//		    'weight' : 4,
//		    'lineCap' : 'butt',
//		    'fill' : true,
//		    'fillColor' : '#FF0000',
//		    'fillOpacity' : 0.8
//		};
//            }
//        }).addTo(map);

    }
    this.remove2DMap = function(map) {
	if ( marker ) map.removeLayer(marker);
	if ( layer ) map.removeLayer(layer);
    }
    this.add3DMap = function(view) {
	if ( modelobj ) {
	    if ( model == null ) {
		model = view.entities.add(modelobj);
	    }
	}
	if ( geojsonuri ) {
	    // async mode
	    _Add3DGeoJson(view);
	}
    }
    this.getName = function() {
	return name;
    }
    this.getDescription = function() {
	return description;
    }
    this.getIndex = function() {
	return myidx;
    }
    this.getPosition = function() {
	return latlng;
    }
    this.getMarker = function() {
	return marker;
    }
    this.getOwner = function() {
	return owner;
    }
    this.getBorderFeature = function() {
	return bordergeojson;
    }
    this.getFeature = function() {
	return rawgeojson;
    }
    this.loadedFeatureLayer = function() {
	if ( geojsonuri ) {
	    if ( layergeojson ) {
		return true;
	    } else {
		return false;
	    }
	} else {
	    return true;
	}
    }
    this.getFeatureLayer = function() {
	if ( geojsonuri ) {
	    return layergeojson;
	} else {
	    return null;
	}
//	if ( geojsonuri ) {
//	    if ( layergeojson ) {
//		return layergeojson;
//	    } else {
//		return 0;
//	    }
//	} else {
//	    return -1;
//	}
    }
    this.getGeoJsonUri = function() {
	return geojsonuri;
    }
    this.isOccupied = function(corp,point) {
	if ( corp == owner ) {
	    if ( border == null ) return false;
	    // convert point(leaflet) to turf
	    point = turf.helpers.point( [point.lng, point.lat] );
	    if ( turf.booleanPointInPolygon.default(point, border,{ignoreBoundary:true}) ) {
		return true;
	    } else {
		return false;
	    }
	} else {
	    return false;
	}
    }
    
    this.setOwner = function(corps) {
	owner = corps;
    }
    this.getEndurance = function() {
	return endurance;
    }
    this.getBullet = function() {
	return stock.bullet;
    }
    this.consumeBullet = function(val) {
	// Reduce Bullet value
	if ( stock.bullet > val ) {
	    _SetBullet(stock.bullet-val);
	    return true;
	} else {
	    return false;
	}
    }
    this.setDamage = function(value) {
	if ( endurance > 1 ) {

	    damage.accumulation += value;
	    damage.attackcount += 1;

	    let currentd = endurance;
	    let damaged = Math.floor(damage.accumulation * damage.pernodes);
	    let nextd = damage.initdefense - damaged;
	    if ( currentd < nextd ) {
		//  Broken Structure
		endurance = 0;
	    } else {
		endurance = nextd;
	    }
	    return endurance;
	} else {
	    return 0;
	}
    }

    //
    //  Initialize
    //
    
    myid = idkey;
    myidx = idx;

    if ( mtype == 'icon' ) {
	// NOP default
    } else if ( mtype == 'circle' ) {
	markertype = 'circle';
    } else {
	// NOP default
    }
    
    if ( data.name ) {
	name = ghEmakiUtilGetStringInRange(data.name,32);
    }
    if ( data.owner ) {
	//owner = ghEmakiUtilGetStringInRange(data.owner,32);
	owner = data.owner;
    }
    if ( data.description ) {
	description = ghEmakiUtilGetStringInRange(data.description,32);
    }
    if ( data.endurance ) {
	endurance = ghEmakiUtilGetNumberInRange(data.endurance,10,100000);
	damage.initdefense = endurance; // damage.pernodes;
    }
    if ( data.stock ) {
	if ( data.stock.ration ) {
	    stock.initration = ghEmakiUtilGetNumberInRange(data.stock.ration,0,10000000);
	    stock.ration = stock.initration;
	}
	if ( data.stock.bullet ) {
	    stock.initbullet = ghEmakiUtilGetNumberInRange(data.stock.bullet,0,10000000);
	    stock.bullet = stock.initbullet;
	}
    }
    if ( data.latlng ) {
	if ( GH_HAS_LEAFLET ) {
	    latlng = L.latLng(parseFloat(data.latlng[0]), parseFloat(data.latlng[1])) ;
	} else {
	    latlng = data.latlng;
	}
	if ( GH_HAS_CESIUM ) {
	    cartesian = Cesium.Cartesian3.fromDegrees(parseFloat(data.latlng[1]), parseFloat(data.latlng[0]), -5);
	} else {
	    cartesian = null;
	}
    }
    if ( data.marker ) {
	if ( GH_HAS_LEAFLET ) {
	    if ( markertype == 'circle' ) {
		marker = L.circleMarker(latlng, {
		    pane: 'markerPane',
		    color: '#F5F5F5',
		    fillColor: damagepernodeorcolor,
		    fillOpacity: 0.8,
		    radius: 3
		});
	    } else {
		let w = data.marker.width|0;
		let h = data.marker.height|0;
		let ih = h;
		let iw = ( w / 2 )|0;
		let ph = -1 * iw;
		let l = L.icon({
		    iconUrl:      ghEmakiUtilGetResourceURI(GH_RSC_OBJECTICON, data.marker.uri ),
		    iconSize:     [w, h], // size of the icon
		    shadowSize:   [w, h], // size of the shadow
		    iconAnchor:   [iw, ih], // point of the icon which will correspond to marker's location
		    shadowAnchor: [0, ih],  // the same for the shadow
		    popupAnchor:  [0, ph] // point from which the popup should open relative to the iconAnchor
		});
		marker = L.marker(latlng, {icon: l});
	    } 
	    marker.on('click', ghOnClickMarker);  
	    marker.bindTooltip(_MarkerTooltip);
	} else {
	    marker = null;
	}
    }
    if ( data.model ) {
	if ( GH_HAS_CESIUM ) {
            var objid = "object_" + myid;
	    let head = 0.0;
            let hpr = Cesium.HeadingPitchRoll.fromDegrees(head,0.0,0.0);
            let orient = Cesium.Transforms.headingPitchRollQuaternion(cartesian,hpr);
	    let txt = description + "<BR>" + GH_TXT_DEFENSE[GH_LANG] + ":" + endurance;
	    //let txt = description;
            modelobj = {
		name : name,
		position : cartesian,
		description : txt,
		orientation : orient,
		model : {
                    uri : ghEmakiUtilGetResourceURI(GH_RSC_MODELS,data.model.uri),
                    scale: data.model.scale,
                    minimumPixelSize :16,
                    heightReference : Cesium.HeightReference.RELATIVE_TO_GROUND,
                    distanceDisplayCondition : new Cesium.DistanceDisplayCondition(0.0,GH_OBJECT_DISPLAY_DISTANCE)
		}
	    };
	} else {
	    modelobj = null;
	}
    }
    if ( data.geometry ) {
	if( typeof data.geometry === 'number'){
	    let center = null;
	    let radius = parseFloat(data.geometry);
	    if ( GH_HAS_LEAFLET ) {
		//circlemarker = L.circle(latlng, {
		//    color: '#FAFAFA',
		//    weight : 1,
		//    fillColor: '#F5F5F5',
		//    fillOpacity: 0.2,
		//    radius: radius
		//});
		center = turf.helpers.point( [ latlng.lng , latlng.lat ]);
	    } else {
		center = turf.helpers.point( [ latlng[1], latlng[0] ] );
	    }
	    bordergeojson = turf.circle.default(center,radius,{ steps : 8, units: 'meters'});
	    rawgeojson = null;
	    geojsonuri = null;
	} else if( typeof data.geometry === 'string'){
	    geojsonuri = ghEmakiUtilGetResourceURI(GH_RSC_GEOJSON, data.geometry );
	    _LoadGeojson(geojsonuri);   //  set variables rawgeojson  // 2D geojson
	    if ( GH_HAS_LEAFLET ) {
		_LoadLeafletGeojson(geojsonuri); //  set variables layergeojson   // 2D leaflet layer
	    }
	    if ( GH_HAS_CESIUM ) {
		_LoadCesiumGeojson(geojsonuri);//  set variables  entitygeojson   // 3D cesium Object
	    }
	} else if ( Array.isArray(data.geometry) ) {
	    geojsonuri = data.geometry;
	    // Not Yet
	} else {
	    // NO correct data
	}
    }
}














//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
//
//function EmakiField(idkey,idx) {
//    
//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////
function EmakiField(idkey,idx,data) {

    let myid = null;
    let myidx = 0;

    let style = null;
    let keepout = true;
    
    let ratio = {
	"speed" : 1.0,
	"attack" : 1.0,
	"defense" : 1.0,
	"fatigue" : 1.0
    }

    let geojsonuri = [];
    let geojsonloaded = 0;
    let geofeature = [];  // 2D geojson turf
    let geolayer = null;  // 2D Leaflet layer

    if ( idkey == null ) return;
    if ( data == null ) return;

    //	
    //  Private
    //
    var _LoadGeojson = function(file) {
	$.ajax({
	    dataType: "json",
	    url: file,
	    async : true
	}).done(function(data) {
	    // Extract and combine polygon
	    turf.meta.featureEach(data, function (currentFeature, featureIndex) {
		turf.meta.flattenEach(currentFeature, function (feature) {
		    if( feature.geometry.type == 'Polygon' ) {
			geofeature.push ( feature );
		    }
		});
	    });
	    geojsonloaded++;

	    if ( GH_HAS_LEAFLET ) {
		if ( geojsonuri.length == geojsonloaded ) {
		    geolayer = new L.geoJson( turf.helpers.featureCollection(geofeature) ,{
			style: function (feature) {
			    return {
				'color' : style.color,
				'weight' : style.weight,
				'fill' : style.fill,
				'fillColor' : style.fillColor,
				'fillOpacity' : style.fillOpacity
			    };
			}
		    });
		}
	    }
        }).fail(function(XMLHttpRequest, textStatus,errorThrown){
	    var msg = "GeoJson data cannot load ";
	    console.log( msg );
	});
    }
    var _Add2DGeoJson = function(map) {
	if ( geojsonuri.length == geojsonloaded ) {
	    if ( geolayer ) {
		geolayer.addTo(map);
	    } else {
		// NOP
	    }
	} else {
	    setTimeout(_Add2DGeoJson, 2000, map );
	}
    }

    //
    //
    //   Extarnal
    //
    //
    this.loadedFeatureLayer = function() {
	if ( geojsonuri.length < 1  ) {
	    return true;
	} else {
	    if ( geolayer ) {
		return true;
	    } else {
		return false;
	    }
	}
    }
    this.getFeatureLayer = function() {
	if ( geojsonuri.length < 1  ) {
	    return null;
	} else {
	    return geolayer;
	}
    }
    this.draw2DMap = function(map) {
	if ( ! GH_HAS_LEAFLET ) return;
	if ( geolayer != null ) map.removeLayer(geolayer);
	// Async check
	_Add2DGeoJson(map);
    }
    this.remove2DMap = function(map) {
	if ( ! GH_HAS_LEAFLET ) return;
	if ( geolayer != null ) map.removeLayer(geolayer);
	geolayer = null;
    }
    this.getRatioParameter = function() {
	return ratio;
    }
    this.getIndex = function() {
	return myidx;
    }
    this.getStyle = function() {
	return style;
    }
    this.getKeepout = function() {
	return keepout;
    }


    //
    //
    //   Initialize
    //
    //
    
    myid = idkey;
    myidx = idx;
 
    if ( data.keepout ) {
	keepput = data.keepout;
    }
    if ( data.style ) {
	style = data.style;
    }
    if ( data.speedratio ) {
	ratio.speed = data.speedratio;
    }
    if ( data.attackratio ) {
	ratio.attack = data.attackratio;
    }
    if ( data.defenseratio ) {
	ratio.defense = data.defenseratio;
    }
    if ( data.fatigueratio ) {
	ratio.fatigue = data.fatigueratio;
    }
    if ( data.geometry ) {
	if( typeof data.geometry === 'string'){
	    let uri = ghEmakiUtilGetResourceURI(GH_RSC_GEOJSON, data.geometry );
	    geojsonloaded = 0;
	    _LoadGeojson(uri);
	    geojsonuri.push ( uri );
	    //  set variables  feature  // 2D geojson
	} else if ( Array.isArray(data.geometry) ) {
	    geojsonloaded = 0;
	    for ( var i=0,len=data.geometry.length;i<len;i++ ) {
		let uri = ghEmakiUtilGetResourceURI(GH_RSC_GEOJSON, data.geometry[i] );
		_LoadGeojson( uri );
		geojsonuri.push ( uri );
	    }
	} else {
	    // NO correct data
	}
    }

}

