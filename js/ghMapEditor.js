////////////////////
///
///
///   mapeditor.html
///     - ghMapEditor.js
///
///
///
///
///


var GH_LMAP = null;
var GH_MARKER_NUM = 0;
const GH_MARKER_DELIMITER = '::';
var GH_MARKER_LAYER = null;
var GH_MARKER_PROPERTY = {};

//var GuideLayers = [];
//var LineWidth = 4;
//var PolylineColor = new Array(
//    '#800000', '#ff0000', '#800080', '#ff00ff',
//    '#008000', '#00ff00', '#808000', '#ffff00',
//    '#000080', '#0000ff', '#008080', '#00ffff' );

//
// MAP base layer
//
var GH_LMAP_LAYER0 = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    crossOrigin : true,
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
});
var GH_LMAP_LAYER1 = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
    crossOrigin : true,
    attribution: '&copy; <a href="https://www.arcgis.com/">Esri/ArcGIS</a> contributors'
});
var GH_LMAP_LAYER2 = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    crossOrigin : true,
    attribution: '&copy; <a href="https://www.arcgis.com/">Esri/ArcGIS</a> contributors'
});

var PointColorIcon = {
    "yellow" : L.icon({
        iconUrl: "../libs/images/marker-icon-yellow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [12, 20]
    }),
    "light-blue" : L.icon({
        iconUrl: "../libs/images/marker-icon-light-blue.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [12, 20]
    }),
    "light-green" : L.icon({
        iconUrl: "../libs/images/marker-icon-light-green.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [12, 20]
    }),
    "lime" : L.icon({
        iconUrl: "../libs/images/marker-icon-lime.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [12, 20]        
    }),
    "amber" : L.icon({
        iconUrl: "../libs/images/marker-icon-amber.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [12, 20]        
    }),
    "orange" : L.icon({
        iconUrl: "../libs/images/marker-icon-orange.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [12, 20]        
    }),
    "grey" : L.icon({
        iconUrl: "../libs/images/marker-icon-grey.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [12, 20]        
    }),
    "blue-grey" : L.icon({
        iconUrl: "../libs/images/marker-icon-blue-grey.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [12, 20]        
    })
}

var LoadData = {
    "file" : null,
    "json" : null
};

///////////////////
L.Marker.prototype.setMarkerKey = function (name) {
    if (this.options) {
	this.options.markername = name;
    }
};
L.Marker.prototype.getMarkerKey = function () {
    if (this.options) {
	return this.options.markername;
    } else {
	return null;
    }
};


////////////////////////////////

function ghChangePointColor( val ) {
    let key = $('#gh_unit_key').val();
    if ( key == null || key == "" ) return;
    if ( GH_MARKER_PROPERTY[key] ) {
	let m = ghEmakiGetMarkerLayer(key);
	m.setIcon(PointColorIcon[val]);
	GH_MARKER_PROPERTY[key].color = val;
    }
    
}

function ghChangePointWeapon( val ) {
    let name = $('#gh_marker_name').html();
    if ( name == null || name == "" ) return;

    let ar = val.split(',');
    let res = [];

    for (var i = 0; i < ar.length ; i++) {
	if ( ar[i] != "" && ar[i] != null ) {
	    res.push(ar[i]);
	}
    }
    if ( GH_MARKER_PROPERTY[name] ) {
	GH_MARKER_PROPERTY[name].weapon = res;
    }
}
function ghChangePointStrength( val ) {
    let name = $('#gh_marker_name').html();
    if ( name == null || name == "" ) return;

    if ( GH_MARKER_PROPERTY[name] ) {
	GH_MARKER_PROPERTY[name].strength = parseInt(val,10);
    }
}

function ghEmakiInitMaterializeUI() {

    $('#gh_emakifilemodal').modal();
    var t = $(".tabs").tabs();

//    $('#gh_routefilemodal').modal({
//	onOpenStart : function () {
//	    var n = $('#gh_routefilename').val();
//	    if ( n == "" ) {
//		var geojsonfilename = LoadData.file;
//		if ( geojsonfilename != null ) { 
//		    n = geojsonfilename + ".routejson";
//		    $('#gh_routefilename').val(n);
//		}
//	    }
//	}
//    });

//	

    $('#gh_aboutmodal').modal();


    $( 'input[name="gh_pointcolor"]:radio' ).change( function() {
	ghChangePointColor( $(this).val() );
    });

    $( '#gh_unit_weapon' ).change( function() {
	ghChangePointWeapon( $(this).val() );
    });

    $( '#gh_unit_strength' ).change( function() {
	ghChangePointStrength( $(this).val() );
    });

    // show thums
    //  https://github.com/Dogfalo/materialize/issues/6036
    var array_of_dom_elements = document.querySelectorAll("input[type=range]");
    M.Range.init(array_of_dom_elements);

}

//
//  Context Menu
//
function ghEmakiShowCoordinates (e) {
    var popup = L.popup();
    popup
        .setLatLng(e.latlng)
        .setContent( e.latlng.toString() )
        .openOn(GH_LMAP);
    
}
function ghEmakiCenterMap (e) {
    GH_LMAP.panTo(e.latlng);
}
function ghEmakiZoomIn (e) {
    GH_LMAP.zoomIn();
}
function ghEmakiZoomOut (e) {
    GH_LMAP.zoomOut();
}
function ghEmakiZoomIn2 (e) {
    var z = GH_LMAP.getZoom();
    GH_LMAP.setZoom(z+2);
}
function ghEmakiZoomOut2 (e) {
    var z = GH_LMAP.getZoom();
    GH_LMAP.setZoom(z-2);
}
//function event_end_map(e) {
//    var z = MapL.getZoom();
//    var c = MapL.getCenter();
//    var flag =  $('input[name="mapsync"]').prop('checked');
//    var data = { issync: flag, center: c , zoom: z }; 
//    ghBroadcastMapSync(data);
//}
//function regist_map_end_event() {
//    MapL.on('zoomend', event_end_map );
//    MapL.on('moveend', event_end_map );
//}
//function unregist_map_end_event() {
//    MapL.off('zoomend', event_end_map );
//    MapL.off('moveend', event_end_map );
//}
////////////////////////

function ghEmakiInitMaps() {

    //
    // MAP initialize
    //

    //width = window.innerWidth - 20 - ( 180 * 3 );
    let width = window.innerWidth - 300;
    $('#emakimap').width(width);
    GH_LMAP = L.map('emakimap',{
	doubleClickZoom : false,
	contextmenu: true,
	contextmenuWidth: 140,
	contextmenuItems: [{
	    text: 'Show coordinates',
	    callback: ghEmakiShowCoordinates
	}, {
	    text: 'Center map here',
	    callback: ghEmakiCenterMap
	}, '-', {
	    text: 'Zoom in',
	    icon: '../libs/img/zoom-in.png',
	    callback: ghEmakiZoomIn
	}, {
	    text: 'Zoom out',
	    icon: '../libs/img/zoom-out.png',
	    callback: ghEmakiZoomOut
	}, {
	    text: 'Zoom in x2',
	    icon: '../libs/img/zoom-in.png',
	    callback: ghEmakiZoomIn2
	}, {
	    text: 'Zoom out x2',
	    icon: '../libs/img/zoom-out.png',
	    callback: ghEmakiZoomOut2
	}]

    }).setView([39.74739, -10], 3);
    L.control.scale().addTo(GH_LMAP);
    //
    // Leaflet.GeometryUtil-0.9.3.zip
    // Leaflet.Snap-0.0.5.zip
    // Leaflet.draw-0.4.14.zip
    //
    //
    //  https://github.com/makinacorpus/Leaflet.Snap
    //
    //

    GH_LMAP.addControl(new L.Control.Layers({
	'OSM':GH_LMAP_LAYER0,
	'EsriMap':GH_LMAP_LAYER1,
	'EsriPhoto':GH_LMAP_LAYER2
    }, {},{position:'topright'}));
    GH_LMAP_LAYER0.addTo(GH_LMAP);

    GH_MARKER_NUM = 0;
    GH_MARKER_LAYER = new L.FeatureGroup();
    GH_LMAP.addLayer(GH_MARKER_LAYER);

    var drawControl = new L.Control.Draw({
	draw: {
	    polyline: false,
	    polygon: true,
	    circle: false,
	    rectangle: false,
	    circlemarker: false,
	    marker: true
	},      
	edit: false,
        delete: false
    });

    GH_LMAP.addControl(drawControl);

    GH_LMAP.on('draw:created', function (e) {
	let type = e.layerType,
	    layer = e.layer;
	if (type === 'marker') {
	    var layerid = "Point" + GH_MARKER_NUM + GH_MARKER_DELIMITER;
	    GH_MARKER_LAYER.addLayer(layer);

	    layer.dragging.enable();
	    layer.bindTooltip(layerid);
	    layer.bindPopup( L.popup().setContent( layerid ) );
	    layer.setMarkerKey(layerid);

	    /////////////////////
	    GH_MARKER_PROPERTY[layerid] = {};
	    /////////////////////
	    
	    layer.on('click', ghEmakiShowMarkerData ) ;
	    GH_MARKER_NUM++;
	}
//	if (type === 'marker') {
//	    var txt = "Point [" + PointMarkerNum + "]";
//	    layer.bindTooltip(txt);
//	    PointMarkerLayer.addLayer(layer);
	    
//	    layer.snapediting = new L.Handler.MarkerSnap(MapL, layer);
//	    layer.snapediting.addGuideLayer(GuideLayers);
//	    layer.snapediting.enable();

//	    ghInsertNewPointIndex(txt,layer.getLatLng());
//	    layer.setTitle(txt);
//	    layer.on('click', ghShowPointMarkerDialog ) ;
//	    PointMarkerNum++;
//	}
    });
    GH_LMAP.on('draw:deleted', function (e) {
	// e = LayerGroup
	var layers = e.layers;
	layers.eachLayer(function(layer){
	    console.log(layer);
	});
    });


//    MapL.on('draw:deleted', function (e) {
//	// e = LayerGroup
//	var layers = e.layers;
//	layers.eachLayer(function(layer){
//	    var tt = layer.getTitle();
//	    $(".chiptag").each(function(i,e){
//		if($(e).text() == tt ){
//		    $(e).remove();
//		}
//	    });
//	});
//    });


}


function ghEmakiShowMarkerData(ev) {
    let m = ev.target;
    let key = m.getMarkerKey();
    //$('#gh_marker_name').html(key);
    $('#gh_unit_key').val(key);
    //let ar = a.split(GH_MARKER_DELIMITER);
    //console.log(ar[0]);
    //console.log(ar[1]);
    if ( GH_MARKER_PROPERTY[key] ) {
	$('#gh_unit_name').val(GH_MARKER_PROPERTY[key].name);
	$('#gh_unit_description').val(GH_MARKER_PROPERTY[key].description);
	
	$('#gh_unit_strength').val(GH_MARKER_PROPERTY[key].strength);
	$('#gh_unit_weapon').val(GH_MARKER_PROPERTY[key].weapon);
	$('#gh_unit_color').val(GH_MARKER_PROPERTY[key].circlecolor);
	$('#gh_unit_fillcolor').val(GH_MARKER_PROPERTY[key].circlefillcolor);

	$('#gh_unit_leadership').val(GH_MARKER_PROPERTY[key].leadership);
	$('#gh_unit_attack').val(GH_MARKER_PROPERTY[key].attack);
	$('#gh_unit_defense').val(GH_MARKER_PROPERTY[key].defense);
	$('#gh_unit_searching').val(GH_MARKER_PROPERTY[key].searching);
	$('#gh_unit_luck').val(GH_MARKER_PROPERTY[key].luck);
	$('#gh_unit_speed_max').val(GH_MARKER_PROPERTY[key].speedmax);
	$('#gh_unit_speed_normal').val(GH_MARKER_PROPERTY[key].speednormal);
	
    } else {
	//  Set Initialize data

    }
//    if ( ar.length > 1 ) {
//	let key = ar[1];
//	if ( key == "" ) {
//	    $('#gh_marker_strength').val(0);
//	} else {
//	}
//    }
}
function ghEmakiSetMap( scene ) {
    var latlng = new L.latLng(scene.latlng[0],scene.latlng[1]);
    GH_LMAP.setView(latlng,scene.zoom);
}
function ghEmakiSetUnitsMarker( units ) {

    for(var key in units){
	let l = units[key].initialize.latlng;
	//var layerid = "Point" + GH_MARKER_NUM + GH_MARKER_DELIMITER + key;
	var layerid = key;
        var latlng = new L.latLng(l[0],l[1]);
        //var m = new L.marker(latlng).addTo(GH_LMAP);
	var m = new L.marker(latlng);
	GH_MARKER_LAYER.addLayer(m);

	m.bindPopup( L.popup().setContent( layerid ) );

	m.setMarkerKey(layerid);
	m.bindTooltip(layerid);
	m.dragging.enable();
	m.on('click', ghEmakiShowMarkerData ) ;

	let w = units[key].weapon;
	GH_MARKER_PROPERTY[layerid] = {
	    "color" : null,
	    "name" : units[key].name,
	    "description" : units[key].description,
	    "strength" : units[key].node.strength,
	    "weapon" : w.toString(),
	    "circlecolor" : units[key].node.circle.color,
	    "circlefillcolor" : units[key].node.circle.fillcolor,
	    "leadership" : units[key].ability.leadership,
	    "attack" : units[key].ability.attack,
	    "defense" : units[key].ability.defense,
	    "searching" : units[key].ability.searching,
	    "luck" : units[key].ability.luck,
	    "speedmax" : units[key].ability.speed.max,
	    "speednormal" : units[key].ability.speed.normal
	};
	
	//layer.dragging.enable();
	//layer.bindTooltip(txt);	    
	//layer.setMarkerName(txt);
	//layer.on('click', ghEmakiShowMarkerData ) ;
	GH_MARKER_NUM++;
    }

}

function ghEmakiGetMarkerLayer(key) {
    let res = null;
    GH_MARKER_LAYER.eachLayer(function(layer){
	let layerkey = layer.getMarkerKey();
	if ( layerkey.indexOf(key) != -1) {
	    res = layer;
	}
    });
    return res;
}

//function ghEmakiSetUnitsProperty( units ) {
//    for(var key in units){
//	//let l = units[key].initialize.latlng;
//	let w = units[key].weapon;
//	let data = {
//	    "color" : null,
//	    "strength" : units[key].node.strength,
//	    "weapon" : w.toString(),
//	    "circlecolor" : units[key].node.circle.color,
//	    "circlefillcolor" : units[key].node.circle.fillcolor
//	}
//	GH_MARKER_PROPERTY[key] = data;
//    }
//
//}
function ghEmakiFileSelect( data ) {
    var files = data.files;
    var reader = new FileReader();
    LoadData.file = escape(files[0].name);
    LoadData.json = null;

    reader.readAsText(files[0]);
    reader.onload = function(e) {
	$('#gh_emakifilename').val(LoadData.file);
        LoadData.json = JSON.parse(e.target.result);
	if ( LoadData.json.scene ) {
	    ghEmakiSetMap( LoadData.json.scene );
	}
	if ( LoadData.json.units ) {
	    ghEmakiSetUnitsMarker( LoadData.json.units );
	}
	//console.log(LoadData.json);
    }
}
function ghEmakiDownloadJSON() {

    let filename = $('#gh_emakifilename').val();
    
    if ( LoadData.file == null ) { 
        alert("no file name");
        return;
    }
    let resultjson = LoadData.json ;
    if ( resultjson.units ) {
	for(var key in resultjson.units){
	    let m = ghEmakiGetMarkerLayer(key);
	    if ( m != null ) {
		resultjson.units[key].initialize.latlng = [m.getLatLng().lat,m.getLatLng().lng];
	    }

	    if ( GH_MARKER_PROPERTY[key] ) {
		resultjson.units[key].name = GH_MARKER_PROPERTY[key].name;
		resultjson.units[key].description = GH_MARKER_PROPERTY[key].description;

		resultjson.units[key].weapon = GH_MARKER_PROPERTY[key].weapon;
		resultjson.units[key].node.strength = GH_MARKER_PROPERTY[key].strength;

		resultjson.units[key].ability.leadership = GH_MARKER_PROPERTY[key].leadership;
		resultjson.units[key].ability.attack = GH_MARKER_PROPERTY[key].attack;
		resultjson.units[key].ability.defense = GH_MARKER_PROPERTY[key].defense;
		resultjson.units[key].ability.searching = GH_MARKER_PROPERTY[key].searching;
		resultjson.units[key].ability.luck = GH_MARKER_PROPERTY[key].luck;
		resultjson.units[key].ability.speed.max = GH_MARKER_PROPERTY[key].speedmax;
		resultjson.units[key].ability.speed.normal = GH_MARKER_PROPERTY[key].speednormal;

	    }
	}
    }
    var result = JSON.stringify(resultjson);

    var download = document.createElement("a");
    document.body.appendChild(download);
    download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(result));
    download.setAttribute('download', filename);    
    download.click();
    download.remove();

    $('#gh_emakifilemodal').modal('close');
}


function ghFileSelectGeoJSON( data ) {

    var files = data.files;
    var reader = new FileReader();
    LoadData.file = escape(files[0].name);
    LoadData.geojson = null;

    reader.readAsText(files[0]);
    reader.onload = function(e) {

        if ( LoadData.maplayer.length > 0 ) {
            for (var j = 0; j < LoadData.maplayer.length ; j++) {
                var c = LoadData.maplayer[j];
                c.eachLayer(function(layer) {
                    MapL.removeLayer(layer);                        
                });
            }
            for (var j = 0; j < GuideLayers.length ; j++) {
                var c = GuideLayers[j];
                MapL.removeLayer(c);
            }
            LoadData.maplayer = [];
            GuideLayers = [];
        }

        LoadData.geojson = JSON.parse(e.target.result);
        $(LoadData.geojson.features).each(function(key, data) {

            var district = new L.geoJson(data,{
                style: function (feature) {
                    return {color: PolylineColor[FeatureNum % PolylineColor.length],weight:LineWidth,lineCap:'butt'};
                }
            }).bindPopup(function (layer) {
                //var txt = layer.feature.id;
                var txt = layer.feature.properties["@id"];
                txt += "<BR>";
                var c = layer.feature.geometry.coordinates;
                var clen = c.length;
                var chalf = parseInt(clen/2,10);
                txt += "P:" + clen + "<BR>";
                txt += "S:" + c[0][0] + "," + c[0][1] + "<BR>";
                txt += "M" + chalf + ":" + c[chalf][0] + "," + c[chalf][1] + "<BR>";
                txt += "E:" + c[clen-1][0] + "," + c[clen-1][1] + "<BR>";
                if ( layer.feature.properties["tunnel"] ) {
                    txt += "tunnel=" + layer.feature.properties["tunnel"] + "<BR>";
                }
                if ( layer.feature.properties["bridge"] ) {
                    txt += "bridge=" + layer.feature.properties["bridge"] + "<BR>";
                }
                if ( layer.feature.properties["layer"] ) {
                    txt += "layer=" + layer.feature.properties["layer"] + "<BR>";
                }
                return txt;
            });
	    MapL.addLayer(district);
            district.eachLayer(function(layer) {
                var li = layer.getLatLngs();
                for (var j = 0; j < li.length; j++) {
		    if (typeof li[j].length === "undefined") {
			// Only one lat-lng data
			var CircleMarker = L.circleMarker(li[j], {
                            color: '#FFFFFF',
                            weight: 1,
                            opacity: 0.9,
                            fillColor: '#FFFFFF',
                            fillOpacity: 0.3,
                            radius: 1
			});
			console.log(li[j]);
			CircleMarker.addTo(MapL);
			GuideLayers.push(CircleMarker);
		    } else {
			// Multiple(array) lat-lng data
			//  for FIX future work
			console.log(li[j].length);
		    }
                }
            });            

            LoadData.maplayer.push(district);

            FeatureNum++;
        });
	ghBroadcastSendGeoJSON(LoadData,-1);        
    }
}

function ghSetPointIndex() {

    PointMarkerNum = 0;

    var points = RouteData.points;

    for (var i = 0; i < points.length ; i++) {

        var latlng = new L.latLng(points[i][1],points[i][0]);
        var m = new L.marker(latlng).addTo(MapL);

        var txt = points[i][2];
        var col = points[i][3];
        m.bindTooltip(txt);
        m.setTitle(txt);
        m.setColorType(col);
        m.setIcon(PointColorIcon[col]);
        PointMarkerLayer.addLayer(m);
        
        m.snapediting = new L.Handler.MarkerSnap(MapL, m);
        m.snapediting.addGuideLayer(GuideLayers);
        m.snapediting.enable();
        
        ghInsertNewPointIndex(txt,col,latlng);
        m.on('click', ghShowPointMarkerDialog ) ;
        
        PointMarkerNum++;
    }
    
}
function ghFileSelectRouteJSON(data) {

    var files = data.files;
    var reader = new FileReader();
    RouteData.filename = escape(files[0].name);
    reader.readAsText(files[0]);
    reader.onload = function(e) {
        var json = JSON.parse(e.target.result);
        if ( json.geojsonfilename == LoadData.file ) {
            // NOP
        } else {
            alert("Other GeoJSON file used");
        }
        
        RouteData.points = json.points;            
        RouteData.routes = json.routes;
        RouteData.stations = json.stations;
        ghSetPointIndex();        
        
	$('#gh_routefilemodal').modal('close');
    } 
}



function ghDownloadRouteJSON() {

    if ( LoadData.file == null ) { 
        alert("no geoJSON data");
        return;
    }

    var result = {
        "filename" : $('#gh_routefilename').val(),
        "geojsonfilename" : LoadData.file,
	"points" : [],
        "routes" : {},
        "stations" : []
    }

   //  Get Points

    var num = 0;
    PointMarkerLayer.eachLayer(function(layer){
	num++;
    });

    if ( num < 1 ) { 
        alert("no points");
        return;
    }

    $( "#pointdata" ).val("");

    PointMarkerLayer.eachLayer(function(layer){
	var correct = ghGetNearestPoint(layer);
	if ( correct == null ) {
	    console.log(layer);
	} else {
	    result.points.push([
                layer.getLatLng().lng,
                layer.getLatLng().lat,
                layer.getTitle(),
                layer.getColorType()
            ]);
	}
    });


    // Get Routes see ghSetRouteIndexModal()
    result.routes = RouteData.routes;

    
    // Get Stations from georoutefind.html update
    result.stations = RouteData.stations;

    var ret = JSON.stringify(result);
    $( "#pointdata" ).val( ret );

    var outfilename =  $('#gh_routefilename').val();

    var download = document.createElement("a");
    document.body.appendChild(download);
    download.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(ret));
    download.setAttribute('download', outfilename);    
    download.click();
    download.remove();

    $('#gh_routeindexmodal').modal('close');
}



function ghSaveRouteIndex() {
    
    var name = $('#gh_routename').html();
    if ( name == "" ) {
        alert("No route name.");
        return;        
    }
    var ret = [];
    var list = $("#pointtarget").children('li');
    list.each(function(i,e){
	var text = $(e).text();
	if ( text == null || text.match(/\S/g) ) {
	    PointMarkerLayer.eachLayer(function(layer){
		var tagtxt = layer.getTitle();
                var col = layer.getColorType();
		if ( tagtxt == text ) {
		    ret.push([layer.getLatLng().lng,layer.getLatLng().lat,text,col]);
		}
	    });
	}
    });
    RouteData.routes[name] = ret;
    
}

function ghSelectRouteIndex() {
    
    var routeindex = $('input[name="gh_routeindex"]:checked').val();   
    if (typeof routeindex === "undefined") {
        alert("Not selected!");
        return;
    }
    
    var ary = RouteData.routes[routeindex];
    $("#pointtarget").empty();      

    var taglist = $('#pointtarget');
    for (var i = 0; i < ary.length ; i++) {
        var txt = ary[i][2];
        var col = ary[i][3];
        var tag = "<li class=\"chiptag " + col + "\">" + txt + "</li>";
        taglist.append(tag);
    }

    $('#gh_routename').html(routeindex);
    $('#gh_newroutename').val(routeindex);

    //
    //  For Sync find HTML
    ghSearchRoute();
}


$(document).ready(function(){

    ghEmakiInitMaterializeUI();

//    ghInitDragandDropArea();

    ghEmakiInitMaps();

});

