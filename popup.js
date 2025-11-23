import { STATE_APP } from '/common/constans.js';

window.onload = async function () {
	await init_popup.onload();
};

const init_popup = {

	state_app : STATE_APP.STARTING,

	async onload() {
		init_popup.start_button = document.getElementById( 'start' );
		init_popup.score_question = document.getElementById( 'score_question' );

		init_popup.addListener();
		await init_popup.generate_score_points();
		await init_popup.set_state_in_button();
	},

	addListener() {
		init_popup.start_button.addEventListener( 'click', init_popup.start_app );
	},

	async set_state_in_button() {
		await init_popup.get_storage_data( 'state_app' ).then( data => {
			let state;
			switch ( data[ 'state_app' ] ) {
				case STATE_APP.STOP:
					state = STATE_APP.START
					break;
				case STATE_APP.PAUSE:
					state = STATE_APP.PAUSE
					break;
				case STATE_APP.RUNNING:
					state = STATE_APP.RUNNING
					break;
				default :
					state = STATE_APP.STARTING
			}

			init_popup.state_app = state;
			init_popup.start_button.innerHTML = state;
		} );
	},

	async generate_score_points() {
		const isOpenApp = await init_popup.check_open_window();
		let numberPoints;
		if ( !isOpenApp ) {
			numberPoints = Math.trunc( Math.random() * 100 )
			if ( numberPoints < 5 ) {
				numberPoints += 10;
			}
			chrome.storage.local.set( { [ 'score_con' ] : numberPoints } );
		} else {
			await init_popup.get_storage_data( 'score_con' ).then( data => {
				numberPoints = data[ 'score_con' ];
			} );
		}
		init_popup.score_question.innerHTML = `${ numberPoints }`;
	},

	async start_app() {
		const isOpenApp = await init_popup.check_open_window();
		await init_popup.get_favicon();

		// если окно не открыто или не крашнулось, можно открыть новое
		if ( !isOpenApp ) {
			chrome.runtime.sendMessage( 'starting', response => {
				init_popup.start_button.innerHTML = response;
			} );
			window.close();
		} else if ( isOpenApp ) {
			chrome.runtime.sendMessage( 'onfocus' );
			window.close();
		}
	},

	async check_open_window() {
		let openWindows = await chrome.windows.getAll();
		let isOpenApp = false;
		let windowID = null;

		await init_popup.get_storage_data( 'window_app_id' ).then( data => {
			windowID = data[ 'window_app_id' ];
		} );

		openWindows.forEach( win => {
			if ( win.type === 'popup' && win.id === windowID ) {
				isOpenApp = true;
			}
		} );

		return isOpenApp;
	},

	/**
	 * Получить значение из common по ключу
	 * @param {string} key
	 * @return {Promise}
	 */
	get_storage_data( key ) {
		return new Promise( ( resolve, reject ) => {
			chrome.storage.local.get( [ key ], data => {
					resolve( data );
				}
			);
			if ( chrome.runtime.lastError ) {
				return reject( chrome.runtime.lastError );
			}
		} );
	},

	/**
	 * Получить ссылку на favicon
	 */
	async get_favicon() {
		let [ tab ] = await chrome.tabs.query( { active : true, currentWindow : true } );

		chrome.scripting.executeScript( {
			target : { tabId : tab.id },
			function : parse_favicon,
		} );

		function parse_favicon() {
			const faviconLinks = window.document.querySelectorAll( `link` );
			let href = null;
			faviconLinks.forEach( link => {
				const isImg = link.href.substring( link.href.length - 3 ) === 'ico' || link.href.substring( link.href.length - 3 ) === 'png';
				if ( link.href.includes( 'favicon' ) && isImg ) {
					href = link.href;
				}
			} );

			href = href ? href : `/images/google_favicon.png`;
			chrome.storage.local.set( { [ 'favicon' ] : href } );
		}
	},
}
