///////////////////////////////
/////////////////////////////
//
//  Broadcast Channel
//https://www.digitalocean.com/community/tutorials/js-broadcastchannel-api
//https://developers.google.com/web/updates/2016/09/broadcastchannel
//
//
//
//   Start up sequence
//
//   (primary)  ghEmaki2d.js
//      ghBroadcastSetup('primary',ghEmakiReceiveMessage);
//
//   (secondary) ghEmaki3d.js
//      ghBroadcastSetup('secondary',ghEmakiReceiveMessage);
//      ghBroadcastConnectionInitialize();
//        INITCONNECTION
//      
//   (primary)
//      ghBroadcastSendUniqueID();
//        INITCONNECTION_ID
//
//   (secondary) 
//      ghEmakiLoadData();
//      ghBroadcastSendCesiumReady();
//        CESIUMREADY
//      
//   (primary)
//      ghBroadcastSendCurrentUnitStatus();
//        CURRENTSTATUS
//
//   (secondary) 
//      ghSetCurrentUnitStatus();
//      ghBroadcastSendUnitReady();
//        UNITREADY
//
//   (primary)
//      ghBroadcastSendClock();
//         CLOCKTIME
//
//	ghBroadcastSendPlayPause();
//        PLAYSTATUS
//
//

const GH_PRIMARY_KEY = 'geoglyphemaki';

function EmakiBroadcast(channelname,myname,mode,callback) {

    let name = 'geoglyph_emaki_';
    let channel = null;
    let selfID = 'unknown';
    let selfName = myname;
    let primaryID = 'unknown';
    let others = [];
    var dateobject = new Date();
    var datetime = dateobject.toString();

    if ( channelname == null ) {
	return null;
    } else {
	name = name + channelname;
    }

    if ( mode == "primary" ) {
	selfID = GH_PRIMARY_KEY;
	primaryID = selfID;
    }

//    var _GetUniqueID = function(myStrong) {
//	var strong = 100000;
//	if (myStrong) strong = myStrong;
//	return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
//    }
    var _GetUniqueID = function(myStrong) {
	var strong = performance.now();
	if (myStrong) strong = strong * myStrong;
	return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()+strong).toString(16)
    }
    var _CheckUniqueID = function(id) {
	for ( var k=0,klen=others.length;k<klen;k++ ) {
	    if ( others[k] == id ) return true;
	}
	return false;
    }

    // Initialize
    if(window.BroadcastChannel){
        channel = new BroadcastChannel(name);
        channel.onmessage = function(evt) {
            if ( evt.data.receiver == 'all' || evt.data.receiver == selfID ) {
		if ( evt.data.type == 'GH_INITCONNECTION' && selfID == GH_PRIMARY_KEY ) {
		    var uid = _GetUniqueID();
		    var i = 3;
		    while (_CheckUniqueID(uid)) {
			i++;
			uid = _GetUniqueID(i);
		    }
		    var dateobject = new Date();
		    var datetime = dateobject.toString();
		    var data = {
			"yourid": uid,
			"primaryid": primaryID,
			"datetime" : datetime,
			"initdata" : evt.data.value
		    };
		    channel.postMessage({
			type: 'GH_INITCONNECTION_ACK',
			sender: selfID,
			receiver: 'all',
			value: data
		    });
		    others.push(uid);
		} else if ( evt.data.type == 'GH_INITCONNECTION_ACK' ) {
		    if ( selfID == 'unknown' && evt.data.value.initdata == selfName ) {
			selfID = evt.data.value.yourid;
			primaryID = evt.data.value.primaryid;
			datetime = evt.data.value.datetime;
			console.log("Receive commection ID from Primary " + selfID);
		    }
		} else {
		    callback(evt.data);
		}
            } else {
		// NOP
		//console.log(evt.data);
	    }
        }
    } else {
        channel = null;
	console.log('Not support Broadcast Cahnnel API');
	return null;
    }

    ////////////////////////
    //
    // External Functions
    //
    this.getID = function() {
	return selfID;
    }
    this.getChannelName = function() {
	return name;
    }
    this.getDateTime = function() {
	return datetime;
    }
    this.getSecondary = function() {
	return others;
    }
    this.isChannelConnected = function() {
	if ( channel == null ) {
	    return false;
	} else {
	    if ( selfID == 'unknown' ) {
		return false;
	    } else {
		return true;
	    }
	}
    }
    this.close = function() {
	if ( channel != null ) {
            channel.close();
	    channel = null;
	}
    }
    this.sendMessage = function(command,oid,param) {
	// oid == 'all' , broadcast all secondary
	if ( channel != null ) {
	    if ( oid == 'primary' ) oid = primaryID;
	    channel.postMessage({
		"type" : command,
		"sender" : selfID,
		"receiver" : oid,
		"value" : param
	    });
	}
    }
    this.sendTransferMessage = function(command,oid,length,array) {
	if ( channel != null ) {
	    if ( oid == 'primary' ) oid = primaryID;
	    let data = {
		"type" : command,
		"sender" : selfID,
		"receiver" : oid,
		"length" : length,
		"value" : array
	    }
	    channel.postMessage(data,[data.value.buffer]);
	}
    }
    this.initPrimaryConnection = function(data) {
	if ( channel != null && selfID == 'unknown' ) {
            channel.postMessage({
		type: 'GH_INITCONNECTION',
		sender: selfID,
		receiver: 'all',
		value: selfName
            });
	}
    }    
}


    
