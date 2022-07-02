/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var GH_LMAP;
var GH_LMAP_LAYER = [];

var GH_DATA_INDEX = {};
var GH_DATA = [];
var GH_LANG = 'en';

var GH_BATTLE_ICON = '../images/battle32.png';
var GH_BATTLE_ICON_SIZE = 32;
var GH_INDEX_URI = '../RSC/data/dataindex.json';
var GH_PLAY_BUTTON = '../images/playbutton.png';


//////////////////////////////////////////
function ghDrawMarker(id) {
    let hw = GH_BATTLE_ICON_SIZE/2;
    let uicon = L.icon({
	iconUrl:  GH_BATTLE_ICON,
	iconSize: [GH_BATTLE_ICON_SIZE, GH_BATTLE_ICON_SIZE],    // size of the icon
	iconAnchor: [hw, GH_BATTLE_ICON_SIZE],   // point of the icon which will correspond to marker's location
	popupAnchor:  [0, -hw],   // point from which the popup should open relative to the iconAnchor
    });
    let latlng = L.latLng(GH_DATA[id].scene.latlng[0], GH_DATA[id].scene.latlng[1]) ;
    GH_DATA[id].marker = L.marker(latlng, {icon: uicon});
    GH_DATA[id].marker.addTo(GH_LMAP);

    let txt = "<H5>" + GH_DATA[id].scene.name + "</H5>" + GH_DATA[id].scene.description + "<BR>";
    txt += GH_DATA[id].scene.timestring + "<BR>";
//    txt += "<input type=\"radio\" name=\"dataindex\" value=\" + GH_DATA_INDEX.datalist[id].file + \"> Player vs Player <BR>";
//    txt += "<input type=\"radio\" name=\"dataindex\" value=\" + GH_DATA_INDEX.datalist[id].file + \"> Player vs A.I <BR>";
//    txt += "<input type=\"radio\" name=\"dataindex\" value=\" + GH_DATA_INDEX.datalist[id].file + \"> A.I vs A.I <BR>";
    txt += "<h5><a href=\"emaki2d.html?hj=" + GH_DATA_INDEX.datalist[id].file + "&lg=" + GH_DATA[id].lang + "&ai=none\">";
    //    txt += "<i class=\"material-icons\">play_circle_outline</i>Player vs Player</a></h5>";
    txt += "<img src=\"" + GH_PLAY_BUTTON + "\" style=\"display: block; margin: auto;\"></a></h5>";

    var popup = L.popup({minWidth:200,maxHeight: 360}).setContent( txt );
    GH_DATA[id].marker.bindPopup(popup);
}

function ghLoadHistoryFile(file,lang,id) {
    //ghEmakiUtilGetResourceURI(GH_RSC_DATA, file )
    $.ajax({
	dataType: "json",
	url: file
    }).done(function(data){
	GH_DATA[id] = {
	    "index" : id,
	    "lang" : lang,
	    "scene" : data.scene,
	    "corps" : data.corps,
	    "marker" : null
	};
	ghDrawMarker(id);
    }).fail(function(XMLHttpRequest, textStatus, errorThrown){
	var msg = "polyline data cannot load ";
	msg += " XMLHttpRequest " + XMLHttpRequest.status ;
	msg += " textStatus " + textStatus ;
	msg += " errorThrown " + errorThrown.message ;
	console.log( msg );
    });
}


///////////////////////////////
// Load Field Index data
var GH_DATA_INDEX = {};

$.ajax({
    dataType: "json",
    url: GH_INDEX_URI
}).done(function(res) {
    //
    GH_DATA_INDEX = res;
    //
    //console.log(GH_DATA_INDEX);
    for(let j=0,jlen=GH_DATA_INDEX.datalist.length;j<jlen;j++){
	GH_DATA[j] = new Object();
	let langary = GH_DATA_INDEX.datalist[j].lang;
	let file = null;
	let lng = null;
	for(let k=0,klen=langary.length;k<klen;k++){
	    if ( langary[k] == GH_LANG ) {
		file = ghEmakiUtilGetSimulationUri(GH_DATA_INDEX.datalist[j].file,GH_LANG);
		lng = GH_LANG;
	    }
	}

	// Probabry Need NOT
	if ( file == null ) {
	    file = ghEmakiUtilGetSimulationUri(GH_DATA_INDEX.datalist[j].file,langary[0]);
	    lng = langary[0];
	} else {
	    // NOP
	}
	ghLoadHistoryFile(file,lng,j);
    }

}).fail(function(XMLHttpRequest, textStatus, errorThrown){
    var msg = "Index data cannot load " ;
    msg += " XMLHttpRequest " + XMLHttpRequest.status ;
    msg += " textStatus " + textStatus ;
    msg += " errorThrown " + errorThrown.message ;
    console.log( msg );
})


///////////////////////////////
// Main Map

GH_LMAP = L.map('selectmap',{zoomControl:false}).setView([12.505, -0.09], 2);

GH_LMAP_LAYER[0] = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    crossOrigin : true,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});
GH_LMAP_LAYER[1] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    crossOrigin : true,
    attribution: '&copy; <a href="https://www.arcgis.com/">Esri/ArcGIS</a> contributors'
});
GH_LMAP_LAYER[2] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    crossOrigin : true,
    attribution: '&copy; <a href="https://www.arcgis.com/">Esri/ArcGIS</a> contributors'
});
var baseMaps = {
    'OpenStreetMap': GH_LMAP_LAYER[0],
    'EsriStreetMap':GH_LMAP_LAYER[1],
    'EsriImageryMap':GH_LMAP_LAYER[2]
}
GH_LMAP_LAYER[0].addTo(GH_LMAP);
L.control.layers(baseMaps, {},{position:'bottomright'}).addTo(GH_LMAP);

L.control.zoom({
     position:'topright'
}).addTo(GH_LMAP);

L.control.scale({metrix:true,imperial:false}).addTo(GH_LMAP);

var locationpathary = location.pathname.split('/');
GH_LANG = locationpathary[locationpathary.length-2];
