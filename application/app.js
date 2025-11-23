import imageDataObjects from './imageData.js';
import { Game } from './Game.js';
import { update_storage } from './gameLogic.js';
import { WINDOW, STATE_APP } from '../common/constans.js';

window.onbeforeunload = function () {
	update_storage( 'state_app', STATE_APP.STOP );
}

chrome.runtime.onMessage.addListener( message => {
	if ( message === 'onfocus' ) {
		window.focus();
	}
} );

const canvas = document.querySelector( 'canvas' );
if ( canvas.getContext ) {
	const ctx = canvas.getContext( '2d' );
	imageDataObjects.ctx = ctx;
	ctx.fillStyle = '#000';
	ctx.fillRect( 0, 0, canvas.width, canvas.height );
} else {
	console.warn( 'canvas dont have context or error' );
}

( async function start_game() {
	const { favicon: favicon_href } = await chrome.storage.local.get( 'favicon' );

	const ctx = canvas.getContext( '2d' );
	new Game( ctx, canvas, favicon_href );
} )();

window.addEventListener( 'resize', () => {
	console.log( 'resize' );
	window.resizeTo( WINDOW.WIDTH, WINDOW.HEIGHT );
} );
