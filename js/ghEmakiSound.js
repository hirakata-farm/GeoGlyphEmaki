//
//
//
//
//
//   Emaki Sound Manager
//
//
//
//

//const GH_SOUND_TYPE0 = {
//    "bgm_a" : {
//	url : "airport_attack.mp3",
//	type : "bgm",
//	defaultloop : true
//    },
//    "bgm_b" : {
//	url : "deck_fight.mp3",
//	type : "bgm",
//	defaultloop : true
//    },
//    "bgm_c" : {
//	url : "railgun_rain.mp3",
//	type : "bgm",
//	defaultloop : true
//    },
//    "bgm_x" : {
//	url : "strategy.mp3",
//	type : "bgm",
//	defaultloop : true
//    },
//    "bgm_y" : {
//	url : "play_to_win.mp3",
//	type : "bgm",
//	defaultloop : true
//    },
//    "shout" : {
//	url : "bark_0.mp3",
//	type : "effect",
//	defaultloop : false
//    },
//    "shoot" : {
//	url : "P_34Ps.mp3",
//	type : "effect",
//	defaultloop : false
//    },
//    "tapping" : {
//	url : "katana_1.mp3",
//	type : "effect",
//	defaultloop : false
//    },
//    "critical" : {
//	url : "Jingle_Achievement_00.mp3",
//	type : "effect",
//	defaultloop : false
//    },
//    "message" : {
//	url : "message_open.mp3",
//	type : "effect",
//	defaultloop : false
//    },
//    "gameover" : {
//	url : "MusicBoxGameOver1.mp3",
//	type : "effect",
//	defaultloop : false
//    }
//}
//    
const GH_DEFAULT_SOUND ={
    "bgm_a" : {
	url : "airport_attack.mp3",
	type : "bgm",
	defaultloop : true
    },
    "bgm_b" : {
	url : "deck_fight.mp3",
	type : "bgm",
	defaultloop : true
    },
    "bgm_c" : {
	url : "railgun_rain.mp3",
	type : "bgm",
	defaultloop : true
    },
    "message" : {
	url : "message_open.mp3",
	type : "effect",
	defaultloop : false
    },
    "gameover" : {
	url : "MusicBoxGameOver1.mp3",
	type : "effect",
	defaultloop : false
    }

}

function EmakiSoundManager(initdata) {

    var volume = 0.1;  //  0 - 1
    var sound = {};
    let currentbgm = 'bgm_a';

//    for(var key in initdata){
//	sound[key] = new Object();
//	sound[key].sound = new Audio( ghEmakiUtilGetResourceURI(GH_RSC_SOUND, initdata[key].url ) );
//	sound[key].sound.loop = initdata[key].defaultloop;
//	sound[key].sound.volume = volume;
//	sound[key].type = initdata[key].type;
//	sound[key].checkbox = false;
//	sound[key].isplaying = false;
//    }

    var _AddSound = function(key,obj) {
	sound[key] = new Object();
	sound[key].sound = new Audio( ghEmakiUtilGetResourceURI(GH_RSC_SOUND, obj.url ) );
	sound[key].sound.loop = obj.defaultloop;
	sound[key].sound.volume = volume;
	sound[key].type = obj.type;
	sound[key].checkbox = false;
	sound[key].isplaying = false;
    }


    //
    //  Initialze Default BGM sound
    //
    for(var key in GH_DEFAULT_SOUND ){
	_AddSound(key,GH_DEFAULT_SOUND[key]);
    }

    ////////////////////////
    //
    // External Functions
    //
    this.addSound = function(data) {
	for(var key in data ){
	    if ( sound[key] ) {
		// Already Exist NOP
	    } else {
		_AddSound(key,data[key]);
	    }
	}
    }

    this.getIsPlaying = function(key) {
	if ( sound[key] ) {
	    return sound[key].isplaying;
	} else {
	    return false;
	}
    }

    this.setCurrentBGM = function(name) {
	if ( sound[name] ) {
	    if ( currentbgm != name && sound[currentbgm].isplaying ) {
		sound[currentbgm].sound.pause();
		sound[currentbgm].isplaying = false;
		sound[currentbgm].checkbox = false;	    
	    };
	    currentbgm = name;
	} else {
	    // No name sound
	}
    }
    this.setBGMCheckbox = function(flag) {
	sound[currentbgm].checkbox = flag;
    }
    this.playBGM = function() {
	if ( sound[currentbgm].checkbox ) {
	    sound[currentbgm].sound.play();
	    sound[currentbgm].isplaying = true;
	}
    }
    this.pauseBGM = function() {
	if ( sound[currentbgm].checkbox ) {
	    sound[currentbgm].sound.pause();
	    sound[currentbgm].isplaying = false;
	}
    }
    this.playpaseBGM = function(type) {
	if ( type ) {
	    sound[currentbgm].sound.play();
	    sound[currentbgm].isplaying = true;
	} else {
	    sound[currentbgm].sound.pause();
	    sound[currentbgm].isplaying = false;
	}
    }
    this.setBGMvolume = function(value) {
	sound[currentbgm].sound.volume = ghEmakiUtilGetNumberInRange(value,0,1);
    }
    this.getBGMvolume = function() {
	return sound[currentbgm].sound.volume;
    }

    //////////////////
    this.setEffectCheckbox = function(flag) {
	for(var key in sound){
	    if ( sound[key].type == 'effect' ) 	sound[key].checkbox = flag;
	}
    }

    this.setEffectVolume = function(value) {
	for(var key in sound){
	    if ( sound[key].type == 'effect' ) 	sound[key].sound.volume = ghEmakiUtilGetNumberInRange(value,0,1);
	}
    }

    this.playEffect = function(key) {
	if ( sound[key] ) {
	    if ( sound[key].type == 'effect' ) {
		if ( sound[key].checkbox ) {
		    // suspend Play duplicate
		    if ( sound[key].sound.currentTime > 0 && sound[key].sound.currentTime < sound[key].sound.duration ) {
			// NOP
		    } else {
			sound[key].sound.play();
		    }
		} else {
		    // NOP
		    //console.log("Unknown type " + type );
		}
	    }
	}
    }

}

