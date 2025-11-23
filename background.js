import { STATE_APP, WINDOW } from '/common/constans.js';

chrome.runtime.onMessage.addListener( ( message, sender, sendResponse ) => {
	if ( message === STATE_APP.STARTING ) {
		const state = openAppWindow();
		sendResponse( state );
	}
} );

function openAppWindow() {
	try {
		const extensionID = chrome.runtime.id;
		const app = `chrome-extension://${ extensionID }/app.html`;
		const createData = {
			focused : true,
			height : WINDOW.HEIGHT,
			width : WINDOW.WIDTH,
			top : 500,
			left : 500,
			type : 'popup',
			url : app,
		};

		const newWindow = chrome.windows.create( createData );

		newWindow.then( windowObject => {
			update_storage( 'state_app', STATE_APP.RUNNING );
			update_storage( 'window_app_id', windowObject.id );
		} );

		return STATE_APP.RUNNING;
	} catch ( e ) {
		console.log( e )
		return STATE_APP.CRASHED;
	}
}

/**
 * Положить значение в common
 * @param {string} key
 * @param {*} value
 */
function update_storage( key, value ) {
	chrome.storage.local.set( { [ key ] : value } );
}
