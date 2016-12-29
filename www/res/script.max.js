(function($) { 
	"use strict";
/*

	SETUP 
	AJAX Requests
	Start Jahr

*/
$.ajaxSetup({
	url:'http://fitcom.plusdrei.at/mobile/app.1.2.x/',
	method:'POST'
});

var maxYear = 2016;
var appVersion = '1.2.0';

/* 

	SETUP Page
	Menu/Navigation
	Reload Page after 2 hours
	Scroll to month
	Create Overlay
	Logs and other stuff

*/
$( document ).ready(function() { 

	/* Navigation */
	$( 'header button#nav-show' ).on( 'click', function() {
		$( '.site-nav ul' ).addClass( 'menu-visible' );
		$( '#nav-show' ).removeClass( 'button-visible' );
		$( '#nav-hide' ).addClass( 'button-visible');
		return false; 		
	});
	$( 'header button#nav-hide' ).on( 'click', function() {
		$( '.site-nav ul' ).removeClass( 'menu-visible' );
		$( '#nav-hide' ).removeClass( 'button-visible' );
		$( '#nav-show' ).addClass( 'button-visible' );
	});
	
	// reset Page after max. 2 hours
	setTimeout( function() { 
		logout();
		top.location.href="index.html"; 
	}, 2*60*60000 );
		

	
	document.addEventListener("deviceready", onDeviceReady, false);
	// device APIs are available
	function onDeviceReady() {
		if ( typeof StatusBar !== 'undefined' ) { StatusBar.hide(); }
		document.addEventListener("resume", function() {
			setTimeout( function() { top.location.href = 'userbereich.html'; },20 );
		}, false);
		
		//page scripts
		$( 'body' ).append( $( '<div id="overlay"><span></span></div>' ) );
		switch( $('body').attr('id') ) {
		
			case 'site-index':
				$('input[type=checkbox]').makeNiceCheckbox();
				if ( document.location.search === '?logout' ) {
					logit( 'logout' );
					logout();
					$('#error2').show();
				} else if ( document.location.search === '?error3' ) {	
					$( 'h1, hr, .sitetext, #disclaimer, #login-area').hide();			
					$( '#error3' ).show();
				} else {
					logit( 'site-index' );
					userOK( loginSuccess );
				}		
			break;	
			case 'site-userbereich':
				logit( 'site-userbereich' );
				userOK( false, function(){ setTimeout( function() { logout(); top.location.href = 'index.html'; },200 ); } );
				getTraining();				
			break;
			case 'site-pwdchange':
				logit( 'site-pwdchange' );
				userOK( false, function(){ setTimeout( function() { logout(); top.location.href = 'index.html'; },200 ); } );
			break;
			case 'site-trainingsplan':
				logit( 'site-trainingsplan' );
				userOK( false, function(){ setTimeout( function() { logout(); top.location.href = 'index.html'; },200 ); } );		
				createPlaner();			
			break;
		}		
		
		
	}
	
}); 

var createPlaner = function() {	
	var today = new Date();
	var year = today.getFullYear();	  
   for ( var y=year; y>=maxYear; y-- )  {
	 $( '#selectYear' ).append( 
	 	$( '<option '+(y===year?'selected':'')+'>'+y+'</option>')
	 );   
   }
   loadYearData( year );
};

var loadYearData = function( year ) {
	overlay(true);
	$( '#select-year-text span' ).html( year );
	$.ajax({
		data:{
			type:'loadtraining',
			uid: sessionStorage.getItem( 'fitcomLogin_uid' ),
			sid: sessionStorage.getItem( 'fitcomLogin_sid' ),
			year: year,
			checkTrainging: true
		}
	}).done( function( data ) {	
		if ( data !== '' ) { data = JSON.parse(data); }
		if ( data.error ) { errorlogout(); return; }		
		if ( data.days ) {
			data = data.days;
			createCalendar( year, data );
		}
	}).fail( function() {
		showError();
	});
};

var createCalendar = function( year, days ) {
	var today = new Date(), t_date, w_date, w, t, j, dX;
	var mon = ['Jänner','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
	var s = '';
	for ( var i in mon ) { 
	if ( typeof mon[i] === 'string' ) { 
		i *= 1;
		s+='<table class="table-trainingsplan">';					
		s+='<tr '+( (i === today.getMonth() && year*1 === today.getFullYear() ) ? 'data-scrollhere="1"':'' )+'><td class="table-month" colspan="7">'+mon[i]+'</td></tr>';
		s+='<tr class="training-week"><td>Mo</td><td>Di</td><td>Mi</td><td>Do</td><td>Fr</td><td>Sa</td><td>So</td></tr>';
				
		t_date = new Date( year, i+1, 0 );
		w_date = new Date( year, i, 1 );
		
		w = w_date.getDay() - 2 ;
		t = t_date.getDate();		
		if ( w < -1  ) { w += 7; }
		
		for ( j=0; j< (t+w>=35?42:35); j++ ) {
			if ( j%7 === 0 ) { s+= '<tr>'; }
			if ( t >= j-w && j-w > 0 ) { 
				dX = year+'-'+(i+1 < 10 ? '0':'' )+(i+1)+'-'+( j-w < 10 ? '0': '' )+(j-w);
				if ( days.indexOf( dX ) > -1 ) {
					s += '<td class="training-day-active '+( days.indexOf( 'X'+dX ) > -1 ? 'training-day-active-data':'' )+' training-ok"><a href="userbereich.html?d='+dX+'">'+(j-w)+'</a></td>';
				} else {
					s+= '<td class="training-day-active">'+(j-w)+'</td>';
				}
			}
			else { s+= '<td></td>'; }
			if ( j%7 === 6 )  { s+= '</tr>'; }
				
		}
		s+='</table>';
	}}

	$( '#cal' ).html( s );
	overlay( false );	
	if ( $('[data-scrollhere="1"]' ).length > 0 ) {
		var o = $('[data-scrollhere="1"]' ).offset();
		window.scrollTo(0,o.top-30 );	
	}	
	
};


var errorlogout = function() {
	top.location.href="index.html?logout";
};

var logout = function() {
	sessionStorage.clear();		
	localStorage.clear();		
};

var submitLogin = function(e) { 
	e.preventDefault();
	if ($('#username').val()==='' || $('#password').val() === '' ) { return false; }
	overlay(true);
	$.ajax({
		data:{
			type:'login',
			email:$('#username').val(),
			password:$('#password').val(),
			eingeloggtbleiben:$('#eingeloggtbleiben').prop('checked')	
		}
	}).done( function(d) {
		if ( d!=='' ) { d = JSON.parse(d); }
		if ( d.error ) { errorlogout(); return; }		
		if ( d.userOK ) { 
			sessionStorage.setItem( 'fitcomLogin', true );
			sessionStorage.setItem( 'fitcomLogin_uid', d.uid );
			sessionStorage.setItem( 'fitcomLogin_sid', d.sid );
			if ( $('#eingeloggtbleiben').prop('checked') ) {
				localStorage.setItem( 'fitcomLogin', true );
				localStorage.setItem( 'fitcomLogin_uid', d.uid );
				localStorage.setItem( 'fitcomLogin_sid', d.sid );
			}
			loginSuccess(); 
		}
		else { 
			logit( 'wrong-login '+$('#username').val() );		
			setTimeout( function() { // Timeout 2s before next login try
				overlay(false);		
				$( '#error1' ).show();
			},2000 );
		}		
	}).fail( function() {
		showError();
	});
};

var loginSuccess = function() {  
	setTimeout( function() { top.location.href="userbereich.html"; }, 200 );
};

var showUpdateInfo = function( data ) {
	var storeLink = '';
		
	switch( device.platform ) {
		case 'Android': 
			storeLink = data.androidStoreLink;
		break;
		case 'iOS':
			storeLink = data.iOSStoreLink;
		break;
		default:
		break;			
	}
	$( 'body' ).append( $( '<div id="overlayStore"><p>Es gibt eine neue Version der FITCOM-App. Bitte mache ein Update.</p><p><br><br>'+storeLink+'</p></div>' ).show() );
	
};

// open external links
$( document ).on( 'click', 'a[target=_blank]', function(e) {
	e.preventDefault();
	window.open( this.href, '_system' );
});

// open external links
$( document ).on( 'click', 'a[target=_system]', function(e) {
	e.preventDefault();
	window.open( this.href, '_system' );
});


var logit = function(s) {
	$.ajax({
		data:{
			type:'logit',
			uid: sessionStorage.getItem( 'fitcomLogin_uid' ),
			content:s,
			appVersion: appVersion
		}
	}).done( function(data) {
		if ( data!=='' ) { data = JSON.parse(data); }
		if ( data.update ) { 
			/*var timer = sessionStorage.getItem( 'fitcomUpdate_time' );
			if ( !timer ||  timer + 24*60*60*1000 > Date.now()) {*/
				//sessionStorage.setItem( 'fitcomUpdate_time', Date.now() );	
				showUpdateInfo(data);						
			/*}*/ 
		}		
	}).fail( function() {
		showError();
	});
};

var userOK = function(cb_true, cb_false) {
	if ( localStorage.getItem( 'fitcomLogin' ) && !sessionStorage.getItem( 'fitcomLogin' )  ) {
		 sessionStorage.setItem( 'fitcomLogin', true );
		 sessionStorage.setItem( 'fitcomLogin_uid', localStorage.getItem( 'fitcomLogin_uid' ) );
		 sessionStorage.setItem( 'fitcomLogin_sid', localStorage.getItem( 'fitcomLogin_sid' ) );
	}
	var ok = localStorage.getItem( 'fitcomLogin' ) || sessionStorage.getItem( 'fitcomLogin' );
	if ( cb_true && ok ) { cb_true(); }
	if ( cb_false && !ok ) { cb_false(); }
};

var overlay = function( b ) {
	if ( b ) {
		$( '#overlay' ).show();
		$( 'body' ).css( { height:'100%', overflow:'hidden' } );	
		window.scrollTo(0,0 );	
	} else {
		$( '#overlay' ).hide();
		$( 'body' ).css( { height:'auto', overflow:'visible' } );	
	}	
};

var getURLParam = function() {
	var d = {};
	if ( document.location.search.indexOf('?d=') === 0 ) {
		d.d = document.location.search.substring(3);
	}	
	return d;		
};

var trainingID = -1;
var getTraining = function() {
	var titel, d;	
	var GET = getURLParam();	
	if ( GET.d ) {
		var dateSplit = GET.d.split('-');
		var date = new Date( dateSplit[0], dateSplit[1]-1, dateSplit[2] );		
		titel = date.getDate()+'.'+(date.getMonth()+1)+'.'+date.getFullYear(); 
		d = date.getTime()/1000;	
	} else {
		titel = 'Heute';
		d = false;	
	}
	
	overlay( true );
	$.ajax({
		data:{
			type:'getTrainData',
			uid: sessionStorage.getItem( 'fitcomLogin_uid' ),
			sid: sessionStorage.getItem( 'fitcomLogin_sid' ),
			d:d
		}
	}).done( function(data) {	
		if ( data !== '' ) { data = JSON.parse(data); }
		if ( data.error ) { errorlogout(); return; }				
		if ( data.next ) {
			$( '#btn_next' ).attr('href', 'userbereich.html?d='+data.next );
		} else {
			$( '#btn_next' ).addClass( 'disabled' );	
		}

		if ( data.prev ) {
			$( '#btn_prev' ).attr('href', 'userbereich.html?d='+data.prev );
		} else {
			$( '#btn_prev' ).addClass( 'disabled' );	
		}
		if ( data.id ) {
			trainingID = data.id;
			$( '#data_header' ).show();
			$( '#train_start' ).html( data.start_Hi);
			
			if ( data.endebutton ) {
				if ( data.autoended ) {
					$('#training_notended' ).show();
				}
			} else {
				$('#training_ended' ).show();
				$('#train_ende').html( data.ende_Hi );
				$('#train_duration').html( data.duration );
			}
			$('#cb_brust').prop('checked', data.cb_brust === "1" );
			$('#cb_schulter').prop('checked', data.cb_schulter === "1" );
			$('#cb_ruecken').prop('checked', data.cb_ruecken === "1" );
			$('#cb_bizeps').prop('checked', data.cb_bizeps === "1" );
			$('#cb_trizeps').prop('checked', data.cb_trizeps === "1" );
			$('#cb_bauch').prop('checked', data.cb_bauch === "1" );
			$('#cb_oberschenkel').prop('checked', data.cb_oberschenkel === "1" );
			$('#cb_wade').prop('checked', data.cb_wade === "1" );
			$('#cb_ausdauer').prop('checked', data.cb_ausdauer === "1" );
			$('#cb_kampfsport').prop('checked', data.cb_kampfsport === "1" );
			$('#cb_gymnastik').prop('checked', data.cb_gymnastik === "1" );
			$('#cb_squash').prop('checked', data.cb_squash === "1" );
			
			$('#txt_brust').val( data.txt_brust );
			$('#txt_schulter').val( data.txt_schulter );
			$('#txt_ruecken').val( data.txt_ruecken );
			$('#txt_bizeps').val( data.txt_bizeps );
			$('#txt_trizeps').val( data.txt_trizeps );
			$('#txt_bauch').val( data.txt_bauch );
			$('#txt_oberschenkel').val( data.txt_oberschenkel );
			$('#txt_wade').val( data.txt_wade );
			$('#txt_ausdauer').val( data.txt_ausdauer );
			$('#txt_kampfsport').val( data.txt_kampfsport );
			$('#txt_gymnastik').val( data.txt_gymnastik );
			$('#txt_squash').val( data.txt_squash );
			
			$('input[type=checkbox]').makeNiceCheckbox();
			$('#traindata').show();
			
			$( '#training-auswahl input[type=checkbox]' ).each( function() {
				if ( $(this).is(':checked') ) {
					var textarea = $( this ).parent().parent().find( 'textarea' );
					textarea.toggle();	
					textarea.css( { height:0  } );
					textarea.css( { height: textarea.get(0).scrollHeight - 7 } );
				}				
			});
			
		} else {
			
			if ( d ) {
				$('#error1').show();	
			} else {
				$('#error2').show();	
			}
				
		}
		overlay( false );	
	}).fail( function() {
		showError();
	});
	$( '.mobile_content > h1' ).html( titel );
};

var saveTraining = function( cb ) {
	overlay( true );
	$.ajax({
		data:{
			type:'savetraining',
			id: trainingID,
			uid: sessionStorage.getItem( 'fitcomLogin_uid' ),
			sid: sessionStorage.getItem( 'fitcomLogin_sid' ),			
			"cb_brust":$('#cb_brust').prop('checked') ? 1 : 0,
			"cb_schulter":$('#cb_schulter').prop('checked') ? 1 : 0,
			"cb_ruecken":$('#cb_ruecken').prop('checked') ? 1 : 0,
			"cb_bizeps":$('#cb_bizeps').prop('checked') ? 1 : 0,
			"cb_trizeps":$('#cb_trizeps').prop('checked') ? 1 : 0,
			"cb_bauch":$('#cb_bauch').prop('checked') ? 1 : 0,
			"cb_oberschenkel":$('#cb_oberschenkel').prop('checked') ? 1 : 0,
			"cb_wade":$('#cb_wade').prop('checked') ? 1 : 0,
			"cb_ausdauer":$('#cb_ausdauer').prop('checked') ? 1 : 0,
			"cb_kampfsport":$('#cb_kampfsport').prop('checked') ? 1 : 0,
			"cb_gymnastik":$('#cb_gymnastik').prop('checked') ? 1 : 0,
			"cb_squash":$('#cb_squash').prop('checked') ? 1 : 0,
			"txt_brust":$('#txt_brust').val(),
			"txt_schulter":$('#txt_schulter').val(),
			"txt_ruecken":$('#txt_ruecken').val(),
			"txt_bizeps":$('#txt_bizeps').val(),
			"txt_trizeps":$('#txt_trizeps').val(),
			"txt_bauch":$('#txt_bauch').val(),
			"txt_oberschenkel":$('#txt_oberschenkel').val(),
			"txt_wade":$('#txt_wade').val(),
			"txt_ausdauer":$('#txt_ausdauer').val(),
			"txt_kampfsport":$('#txt_kampfsport').val(),
			"txt_gymnastik":$('#txt_gymnastik').val(),
			"txt_squash":$('#txt_squash').val()
		}
	}).done( function() {	
		overlay( false );	
		if ( cb ) cb();
	});	
}

var showError = function() {
	overlay( false );	
	setTimeout( function() { top.location.href="index.html?error3"; }, 200 );
};

$( document ).on( 'click', '#loginbutton', submitLogin );
$( document ).on( 'submit', 'form', function(e) { e.preventDefault(); } );
/*$( document ).on( 'focus', 'input', function() { $(this).prop('readonly',false); } );
$( document ).on( 'blur', 'input', function() { $(this).prop('readonly',true); } );*/

var changesnotsaved = false;

$( document ).on( 'change', '#training-auswahl input[type=checkbox]', function(e) { 
	$( this ).parent().parent().find( 'textarea' ).toggle();
	changesnotsaved = true;
});

$( document ).on( 'click', '.inputwrapper canvas', function(e) { 
	$( this ).parent().parent().find( 'textarea' ).toggle();
	changesnotsaved = true;
});


$( document ).on( 'keyup change', 'textarea', function(e) { 
	/*console.log(  $(this).val() );
	var lines = $(this).val().split("\n").length;
	$(this).css( { height: 1.32*lines+'em' } );*/
	$(this).css( { height:0  } );
	$(this).css( { height: $(this).get(0).scrollHeight - 7 } );
	changesnotsaved = true;
	
});

$( document ).on( 'change', '#selectYear', function(e) { 
	e.preventDefault();
	loadYearData( this.value );
});

$( document ).on( 'click', '.stoptrain_delete', function() {

	overlay( true );
	$.ajax({
		data:{
			type:'stoptrain_delete',
			id: trainingID,
			uid: sessionStorage.getItem( 'fitcomLogin_uid' ),
			sid: sessionStorage.getItem( 'fitcomLogin_sid' )			
		}
	}).done( function(data) {	
		if ( data !== '' ) { data = JSON.parse(data); }
		if ( data.error ) { errorlogout(); return; }			
		top.location.reload(); 
	}).fail( function() {
		showError();
	});
});

$( document ).on( 'click', '.fitcom-verlassen', function() {

	overlay( true );
	$.ajax({
		data:{
			type:'stoptrain',
			id: trainingID,
			uid: sessionStorage.getItem( 'fitcomLogin_uid' ),
			sid: sessionStorage.getItem( 'fitcomLogin_sid' )
		}
	}).done( function(data) {	
		if ( data !== '' ) { data = JSON.parse(data); }
		if ( data.error ) { errorlogout(); return; }			
		top.location.reload(); 
	}).fail( function() {
		showError();
	});
	
});

$( document ).on( 'click', '.training-speichern', function() {
	saveTraining();	
});

$( document ).on( 'click', '.passwort-speichern', function() {
	$( '#msg1, #msg2' ).hide();
	overlay( true );
	$.ajax({
		data:{
			type:'changepwd',
			uid: sessionStorage.getItem( 'fitcomLogin_uid' ),
			sid: sessionStorage.getItem( 'fitcomLogin_sid' ),
			"pw-old": $( '#pw-old' ).val(),
			"pw-new": $( '#pw-new' ).val(),
			"pw-new-2": $( '#pw-new-2' ).val(),			
		}
	}).done( function(d) {	
		$( '#pw-old' ).val('');
		$( '#pw-new' ).val('');
		$( '#pw-new-2' ).val('');
		overlay( false );
		if ( d !== '' ) { d = JSON.parse(d); }
		if ( d.error ) { errorlogout(); return; }				
		if ( d.msg === 1 ) { $( '#msg1' ).show(); }
		if ( d.msg === 2 ) { $( '#msg2' ).show(); }
	}).fail( function() {
		showError();
	});
	
});


$( document ).on( 'click', '.btn', function(e) {	
	if ( $(this).hasClass( 'disabled' ) ) {
		e.preventDefault();
		return false;
	}
	if ( changesnotsaved ) {
		e.preventDefault();
		var href = $(this).attr('href')
		saveTraining( function() {
			top.location.href = href;	
		});	
	}
});




}(jQuery));