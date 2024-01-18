var SlimStat = {
	base64_key_str : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-",
	fingerprint_hash : "",

	// Encodes a string using the UTF-8 encoding. This function is needed by the Base64 Encoder here below
	utf8_encode : function( string ) {
		var n, c, utftext = "";

		string = string.replace(/\r\n/g, "\n");

		for ( n = 0; n < string.length; n++ ) {
			c = string.charCodeAt( n );

			if ( c < 128 ) {
				utftext += String.fromCharCode( c );
			}
			else if ( ( c > 127 ) && ( c < 2048 ) ) {
				utftext += String.fromCharCode( ( c >> 6 ) | 192 );
				utftext += String.fromCharCode( ( c & 63 ) | 128 );
			}
			else {
				utftext += String.fromCharCode( ( c >> 12 ) | 224 );
				utftext += String.fromCharCode( ( ( c >> 6 ) & 63 ) | 128 );
				utftext += String.fromCharCode( ( c & 63 ) | 128 );
			}
		}
		return utftext;
	},

	// Base64 Encode - http://www.webtoolkit.info/
	base64_encode : function( input ) {
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4, output = "", i = 0;

		input = SlimStat.utf8_encode( input );

		while ( i < input.length ) {
			chr1 = input.charCodeAt( i++ );
			chr2 = input.charCodeAt( i++ );
			chr3 = input.charCodeAt( i++ );

			enc1 = chr1 >> 2;
			enc2 = ( ( chr1 & 3 ) << 4 ) | ( chr2 >> 4 );
			enc3 = ( ( chr2 & 15 ) << 2 ) | ( chr3 >> 6 );
			enc4 = chr3 & 63;

			if ( isNaN( chr2 ) ) {
				enc3 = enc4 = 64;
			}
			else if ( isNaN( chr3 ) ) {
				enc4 = 64;
			}

			output = output + SlimStat.base64_key_str.charAt( enc1 ) + SlimStat.base64_key_str.charAt( enc2 ) + SlimStat.base64_key_str.charAt( enc3 ) + SlimStat.base64_key_str.charAt( enc4 );
		}
		return output;
	},

	// Calculates the current page's performance
	get_page_performance : function() {
		slim_performance = window.performance || window.mozPerformance || window.msPerformance || window.webkitPerformance || {};
		if ( "undefined" == typeof slim_performance.timing ){
			return 0;
		}

		return slim_performance.timing.loadEventEnd - slim_performance.timing.responseEnd;
	},

	// Calculates the current page's latency
	get_server_latency : function() {
		slim_performance = window.performance || window.mozPerformance || window.msPerformance || window.webkitPerformance || {};
		if ( "undefined" == typeof slim_performance.timing ){
			return 0;
		}

		return slim_performance.timing.responseEnd - slim_performance.timing.connectEnd;
	},

	// Records the choice made by the visitor and hides the dialog message
	optout : function( event, cookie_value ) {
		event.preventDefault();

		if ( "string" != typeof SlimStatParams.baseurl || SlimStatParams.baseurl.length == 0 ) {
			SlimStatParams.baseurl = '/';
		}

		expiration = new Date();
		expiration.setTime( expiration.getTime() + 31536000000 );
		document.cookie = "slimstat_optout_tracking=" + cookie_value + ";path=" + SlimStatParams.baseurl + ";expires=" + expiration.toGMTString();

		event.target.parentNode.parentNode.removeChild( event.target.parentNode );
	},

	// Retrieves and displays the opt-out message dynamically, to avoid issues with cached pages
	show_optout_message : function() {
		opt_out_cookies = !SlimStat.empty( SlimStatParams.oc ) ? SlimStatParams.oc.split( ',' ) : [];
		if ( !Array.isArray( opt_out_cookies ) ) {
			opt_out_cookies = [];
		}

		show_optout = ( opt_out_cookies.length > 0 );

		for ( var i = 0; i < opt_out_cookies.length; i++ ) {
			if ( SlimStat.get_cookie( opt_out_cookies[ i ] ) != "" ) {
				show_optout = false;
			}
		}

		if ( show_optout ) {
			// Retrieve the message from the server
			try {
				xhr = new XMLHttpRequest();
			} catch ( failed ) {
				return false;
			}

			if ( "object" == typeof xhr ) {
				xhr.open( "POST", SlimStatParams.ajaxurl, true );
				xhr.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
				xhr.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
				xhr.withCredentials = true;
				xhr.send( "action=slimstat_optout_html" );

				xhr.onreadystatechange = function() {
					if ( 4 == xhr.readyState ) {

						document.body.insertAdjacentHTML( 'beforeend', xhr.responseText );
					}
				}

				return true;
			}
		}
	},

	// Attaches an event handler to a node
	add_event : function( obj, type, fn ) {
		if ( obj && obj.addEventListener ) {
			obj.addEventListener( type, fn, false );
		}
		else if ( obj && obj.attachEvent ) {
			obj[ "e" + type + fn ] = fn;
			obj[ type + fn ] = function() { obj[ "e" + type + fn ] ( window.event ); }
			obj.attachEvent( "on"+type, obj[type+fn] );
		}
		else {
			obj[ "on" + type ] = obj[ "e" + type + fn ];
		}
	},

	// Implements a function to find a substring in an array
	in_array : function( needle, haystack ) {
		for ( var i = 0; i < haystack.length; i++ ) {
			if ( needle.indexOf( haystack[ i ].trim() ) != -1 ) {
				return true;
			}
		}
		return false;
	},

	// Checks if a string/array variable is defined and not empty
	empty : function( variable ) {
		if ( "undefined" == typeof variable || variable == null ) {
			return true;
		}
		else if ( "number" == typeof variable ) {
			return variable == 0;
		}
		else if ( "boolean" == typeof variable ) {
			return !variable;
		}
		else if ( "string" == typeof variable || "object" == typeof variable ) {
			return variable.length == 0;
		}
		else {
			return true;
		}
	},

	// Retrieves the value associated to a given cookie
	get_cookie : function( name ) {
		var value = "; " + document.cookie;
		var parts = value.split( "; " + name + "=" );
		if ( parts.length == 2 ) {
			return parts.pop().split( ";" ).shift();
		}
		return "";
	},

	// Sends data back to the server (wrapper for XMLHttpRequest object)
	send_to_server : function( data, use_beacon ) {
		if ( SlimStat.empty( SlimStatParams.ajaxurl )|| SlimStat.empty( data ) ) {
			return false;
		}

		if ( "undefined" == typeof use_beacon ) {
			use_beacon = true;
		}

		if ( use_beacon && navigator.sendBeacon ) {
			navigator.sendBeacon( SlimStatParams.ajaxurl, data );
		}
		else {
			try {
				xhr = new XMLHttpRequest();
			} catch ( failed ) {
				return false;
			}

			if ( "object" == typeof xhr ) {
				xhr.open( "POST", SlimStatParams.ajaxurl, true );
				xhr.setRequestHeader( "Content-type", "application/x-www-form-urlencoded" );
				xhr.setRequestHeader( "X-Requested-With", "XMLHttpRequest" );
				xhr.withCredentials = true;
				xhr.send( data );

				xhr.onreadystatechange = function() {
					if ( 4 == xhr.readyState ) {
						parsed_id = parseInt( xhr.responseText );
						if ( !isNaN( parsed_id ) && parsed_id > 0 ) {
							SlimStatParams.id = xhr.responseText;
						}
					}
				}

				return true;
			}
		}
		
		return false;
	},

	// Tracks events (clicks to download files, mouse coordinates on anchors, etc)
	ss_track : function( note, use_beacon ) {
		// Bail if the pageview ID is negative
		if ( SlimStat.empty( SlimStatParams.id ) || isNaN( parseInt( SlimStatParams.id ) ) || parseInt( SlimStatParams.id ) <= 0 ) {
			return false;
		}

		// Read and initialize input parameters
		note_array = {};

		if ( "undefined" == typeof use_beacon ) {
			use_beacon = true;
		}

		// No event was triggered (weird)
		if ( SlimStat.empty( window.event ) ) {
			return false;
		}

		// This function doesn't track focus events, which are usually triggered along with click events
		if ( SlimStat.empty( window.event.type ) || window.event.type == "focus" ) {
			return false;
		}

		// Find the target node
		if ( !SlimStat.empty( window.event.target ) ) {
			target_node = window.event.target;
		}
		else if ( !SlimStat.empty( window.event.srcElement ) ) {
			target_node = window.event.srcElement;
		}
		else {
			return false;
		}

		var resource_url = "";
		var fingerprint_hash = "";

		// Do we need to record a custom label/note for this event?
		if ( !SlimStat.empty( note ) ) {
			note_array.note = note;
		}

		// Different elements have different properties to record...
		if ( !SlimStat.empty( target_node.nodeName ) ) {
			switch ( target_node.nodeName.toLowerCase() ) {
				case "input":
				case "button":
					// Look for a parent FORM element to get the target action
					parent_node = target_node.parentNode;
					while ( !SlimStat.empty( parent_node ) && !SlimStat.empty( parent_node.nodeName ) && parent_node.nodeName.toLowerCase() != "form" ) {
						parent_node = parent_node.parentNode;
					}

					if ( !SlimStat.empty( parent_node ) && !SlimStat.empty( parent_node.action ) ) {
						resource_url = parent_node.action;
					}
					break;

				default:
					// Look for a parent with a HREF attribute, if this node doesn't have one (i.e., a SPAN within an A element)
					if ( SlimStat.empty( target_node.href ) || "string" != typeof target_node.href ) {
						parent_node = target_node.parentNode;
						while ( !SlimStat.empty( parent_node ) && !SlimStat.empty( parent_node.nodeName ) && SlimStat.empty( parent_node.href ) ) {
							parent_node = parent_node.parentNode;
						}

						if ( !SlimStat.empty( parent_node ) ) {
							if ( !SlimStat.empty( parent_node.hash ) && parent_node.hostname == location.hostname ) {
								resource_url = parent_node.hash;
							}
							else if ( !SlimStat.empty( parent_node.href ) ) {
								resource_url = parent_node.href;
							}
						}
					}
					else if ( !SlimStat.empty( target_node.hash ) ) {
						resource_url = target_node.hash;
					}
					else {
						resource_url = target_node.href;
					}
			}
		}

		// If this element has a title, we can record that as well
		if ( "function" == typeof target_node.getAttribute ) {
			if ( !SlimStat.empty( target_node.textContent ) ) {
				note_array.text = target_node.textContent;
			}
			if ( !SlimStat.empty( target_node.getAttribute( "value" ) ) ) {
				note_array.value = target_node.getAttribute( "value" );
			}
			if ( !SlimStat.empty( target_node.getAttribute( "title" ) ) ) {
				note_array.title = target_node.getAttribute( "title" );
			}
			if ( !SlimStat.empty( target_node.getAttribute( "id" ) ) ) {
				note_array.id = target_node.getAttribute( "id" );
			}
		}

		// Event description and button pressed
		note_array.type = window.event.type;
		if ( "keypress" == window.event.type ) {
			note_array.key = String.fromCharCode( parseInt( window.event.which ) );
		}
		else if ( "mousedown" == window.event.type ) {
			note_array.button = window.event.which == 1 ? 'left' : ( window.event.which == 2 ) ? 'middle' : 'right';
		}

		do_not_track = !SlimStat.empty( SlimStatParams.dnt ) ? SlimStatParams.dnt.split( ',' ) : [];

		if ( !SlimStat.empty( resource_url ) ) {
			// Do not track links containing one of the strings defined in the settings as HREF
			if ( !SlimStat.empty( do_not_track ) && SlimStat.in_array( resource_url, do_not_track ) ) {
				return false;
			}

			// Send the fingerprint hash, in case this is considered a 'download'
			fingerprint_hash = "&fh=" + SlimStat.fingerprint_hash;
		}

		// See if any of the classes associated to this element are listed as "do not track"
		target_classes = ( !SlimStat.empty( target_node.className ) && "string" == typeof target_node.className ) ? target_node.className.split( " " ) : [];
		if ( !SlimStat.empty( do_not_track ) && !SlimStat.empty( target_classes ) ) {
			if ( target_classes.filter( function( value ) { return do_not_track.indexOf( value ) !== -1; } ).length != 0 || ( !SlimStat.empty( target_node.attributes ) && !SlimStat.empty( target_node.attributes.rel ) && !SlimStat.empty( target_node.attributes.rel.value ) && SlimStat.in_array( target_node.attributes.rel.value, do_not_track ) ) ) {
				return false;
			}
		}

		// Event coordinates
		position = "0,0";

		if ( !SlimStat.empty( window.event.pageX ) && !SlimStat.empty( window.event.pageY ) ) {
			position = window.event.pageX + "," + window.event.pageY;
		}
		else if ( !SlimStat.empty( window.event.clientX ) && !SlimStat.empty( document.body.scrollLeft ) && !SlimStat.empty( document.documentElement.scrollLeft ) ) {
			position = window.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft + "," + window.event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
		}

		SlimStat.send_to_server( "action=slimtrack&id=" + SlimStatParams.id + "&res=" + SlimStat.base64_encode( resource_url ) + "&pos=" + position + "&no=" + SlimStat.base64_encode( JSON.stringify( note_array ) ) + fingerprint_hash, use_beacon );

		return true;
	},

	get_slimstat_data : function( fingerprint_components ) {
		screenres = SlimStat.get_component_value( fingerprint_components, "screenResolution", [0, 0] );

		return "&sw=" + screenres[ 0 ] + "&sh=" + screenres[ 1 ] + "&bw=" + window.innerWidth + "&bh=" + window.innerHeight + "&sl=" + SlimStat.get_server_latency() + "&pp=" + SlimStat.get_page_performance() + "&fh=" + SlimStat.fingerprint_hash + "&tz=" + SlimStat.get_component_value( fingerprint_components, "timezoneOffset", 0 );
	},

	get_component_value : function( fingerprint_components, key, default_value ) {
		for ( x = 0; x < fingerprint_components.length; x++ ) {
			if ( fingerprint_components[ x ].key === key ) {
				return fingerprint_components[ x ].value;
			}
		}

		return default_value;
	},

	init_fingerprint_hash : function ( fingerprint_components ) {
		values = fingerprint_components.map(
			function ( component ) {
				return component.value;
			}
		);

		// Generate the unique fingerprint hash
		SlimStat.fingerprint_hash = Fingerprint2.x64hash128( values.join( '' ), 31 );
	}
}

// Helper function
if ( typeof String.prototype.trim !== 'function' ) {
	String.prototype.trim = function() {
		return this.replace( /^\s+|\s+$/g, '' ); 
	}
}
