

function EmakiClock(desc,start) {
    let description = "";
    let startstring = "";
    let startobject = null;

    let startutime = -1;
    let playutime = 0;
    let pauseutime = 0;
    let prevutime = -1;
    let currentutime = 0;

    let elapsed = 0; // Total Elapsed time from startutime;
    
    let isplaying = false;

    let times = 1.0;

    ///////////////////////////////////////
    // 
    // Initialize
    //
    description = desc;
    if ( start != null ) {
	// ISO8601
	startstring = start;
	startobject = ghEmakiUtilCreateTimeObject(startstring,2000);
    }

    ///////////////////////////////////////
    // 
    //  External Method
    //
    this.play = function() {
	playutime = new Date().getTime();
	if ( prevutime < 0 ) prevutime = playutime;
	if ( startutime < 0 ) {
	    startutime = playutime;
	    elapsed = 0;
	    pauseutime = 0;
	}
	isplaying = true;
    }

    this.pause = function() {
	if ( isplaying ) {
	    pauseutime = new Date().getTime();
	    isplaying = false;
	}
    }
    this.update = function() {
	currentutime = new Date().getTime();
	let diff = 0;
	if ( isplaying ) {
	    if ( prevutime > playutime) {
		diff = ( currentutime - prevutime ) * times;
		//elapsed += ( currentutime - prevutime ) * times;
	    } else {
		if ( prevutime > pauseutime) {
		    diff = ( currentutime - playutime ) * times;
		    //elapsed += ( currentutime - playutime ) * times;
		} else {
		    diff = ( currentutime - prevutime -  playutime + pauseutime ) * times;
		    //elapsed += ( currentutime - prevutime - ( playutime - pauseutime ) ) * times;
		}
	    }
	} else {
	    if ( prevutime > pauseutime) {
		// NOP
		diff = 0;
	    } else {
		if ( prevutime > playutime) {
		    diff = ( pauseutime - prevutime ) * times;
		    //elapsed += ( pauseutime - prevutime ) * times;
		} else {
		    diff = ( pauseutime - playutime ) * times;
		    //elapsed += ( pauseutime - playutime ) * times;
		}
	    }
	}
	elapsed += diff;
	prevutime = currentutime;
	return diff;
    }
    this.getElapsed = function() {
	// Mili Second
	return elapsed;
    }
    this.getDescription = function() {
	return description;
    }
    this.setSpeed = function(t) {
	if ( isNaN(t) ) return;
	times = ghEmakiUtilGetNumberInRange(t,1,6);
    }
    this.getSpeed = function() {
	return times;
    }
    this.getCurrentDateTime = function() {
	let d = new Date( startobject.getTime() + elapsed );
	return d;
    }
    this.getCurrentTimeString = function() {
	let c = new Date( startobject.getTime() + elapsed );
	let h = c.getHours();
	if ( h < 10 ) h = "0" + h;
	let m = c.getMinutes();
	if ( m < 10 ) m = "0" + m;
	let s = c.getSeconds();
	if ( s < 10 ) s = "0" + s;
	return h + ":" + m + ":" + s;
    }

}
