import imageDataObjects from './imageData.js';
import { CANVAS, DIFFICULT_PARAM, WINDOW, STATE_APP } from '../common/constans.js';

window.onbeforeunload = function () {
	update_storage( 'state_app', STATE_APP.STOP );
}

chrome.runtime.onMessage.addListener( message => {
	if ( message === 'onfocus' ) {
		window.focus();
	}
} );

let collisionObject = null;
let isGameStop = false;
let isGamePause = false;

const canvas = document.querySelector( 'canvas' );
if ( canvas.getContext ) {
	var ctx = canvas.getContext( '2d' );
	imageDataObjects.ctx = ctx;
	ctx.fillStyle = '#000'; // устанавливаем цвет заливки в черный
	ctx.fillRect( 0, 0, canvas.width, canvas.height );
} else {
	console.warn( 'canvas dont have context or error' );
}


( async function start_game() {
	const { favicon : favicon_href } = await chrome.storage.local.get( 'favicon' );

	const { get_back_ground, get_ship, get_health_count, get_health_arc, get_score_count } = imageDataObjects;
	const healthCount = get_health_count();
	const ship = get_ship();
	const backGround = get_back_ground();
	const scoreCount = get_score_count();

	backGround.draw_back_ground()
	healthCount.draw_health_count();
	scoreCount.draw_score_count();
	ship.drow_ship();

	let health = null;
	let enemies = [];
	let coins = [];

	const enemyRespIntervalId = setInterval( () => {
		const needNewEnemy = check_live_enemy( enemies );
		if ( needNewEnemy ) {
			enemies = create_enemy();
		}
		const needNewItemCoin = check_live_enemy( coins );
		if ( needNewItemCoin ) {
			coins = create_coins( favicon_href );
		}
	}, 2000 );

	const healthyRespIntervalId = setInterval( () => {
		const [ cox, coy ] = get_random_xy();
		health = get_health_arc( cox, coy );
	}, DIFFICULT_PARAM.DIFFICULT * 5000 );

	const highDiffIntervalId = setInterval( () => {
		DIFFICULT_PARAM.DIFFICULT += 1;
	}, 10000 );

	const mainIntervalId = setInterval( () => {
		if ( !isGameStop ) {
			if ( check_collision_arc_rect( enemies, ship ) ) {
				draw_explosion( collisionObject.cox, collisionObject.coy );
				if ( healthCount.count !== 1 ) {
					healthCount.count -= 1;
				} else {
					healthCount.count -= 1;
					stop_game();
				}
			}

			if ( check_collision_arc_rect( coins, ship ) ) {
				draw_scores_animation( collisionObject.cox, collisionObject.coy );
				scoreCount.count++
			}

			if ( check_collision_arc_rect( [ health ], ship ) ) {
				healthCount.count++;
				draw_healing( ship );
			}
		}

		if ( !isGamePause ) {
			update_rect();

			window.requestAnimationFrame( () => {
					backGround.draw_back_ground()
					ship.drow_ship();
					draw_enemies( enemies );
					draw_coins( coins );
					healthCount.draw_health_count();
					scoreCount.draw_score_count();
					health?.draw_health();
				}
			);
		}
	}, 10 );

	window.addEventListener( 'keydown', event => {
		if ( !isGameStop && !isGamePause ) {
			// Движение вправо: стрелка вправо или физическая клавиша D (работает с любой раскладкой)
			if ( event.key === 'ArrowRight' || event.code === 'KeyD' ) {
				ship.move_right();
			}
			// Движение влево: стрелка влево или физическая клавиша A (работает с любой раскладкой)
			else if ( event.key === 'ArrowLeft' || event.code === 'KeyA' ) {
				ship.move_left();
			}
			else if ( event.key === 'Escape' ) {
				window.close();
			}
		} else {
			if ( event.key === 'Escape' ) {
				window.close();
			}
		}

		if ( !isGameStop && event.code === 'Space' ) {
			pause_game();
		}
	} );

	window.addEventListener( 'blur', () => {
		if ( !isGamePause && !isGameStop ) {
			isGamePause = true;
			draw_pause();
		}
	} );

	window.addEventListener( 'resize', () => {
		console.log( 'resize' )
		window.resizeTo( WINDOW.WIDTH, WINDOW.HEIGHT );
	} );

	const stop_game = () => {
		if ( !isGameStop ) {
			isGameStop = true;
			ship.isDead = true
			update_rect();
			clearInterval( enemyRespIntervalId );
			clearInterval( highDiffIntervalId );
			clearInterval( healthyRespIntervalId );

			draw_explosion( ship.cox, ship.coy );

			setTimeout( () => {
				clearInterval( mainIntervalId );
				game_over();
			}, 1500 );
		}
	}

	const pause_game = () => {
		isGamePause = !isGamePause;
		draw_pause();
	}
} )();

function draw_explosion( cox, coy ) {
	const explosion = imageDataObjects.get_explosion( cox, coy );
	explosion.draw_animation();
}

function draw_scores_animation( cox, coy ) {
	const scoreAnimation = imageDataObjects.get_score_animation( cox, coy );
	scoreAnimation.draw_animation();
}

function draw_healing( cox, coy ) {
	const healing = imageDataObjects.get_healing( cox, coy );
	healing.draw_animation();
}

function check_live_enemy( enemies ) {
	if ( !enemies.length ) {
		return true;
	}
	let diedEnemy = 0;
	enemies.forEach( enemy => {
		if ( enemy.outside || enemy.isDead ) {
			diedEnemy++;
		}
	} )
	return diedEnemy >= enemies.length;
}

function create_enemy() {
	const { get_meteor } = imageDataObjects;
	let liveEnemy = [];

	for ( let i = 0; i <= DIFFICULT_PARAM.DIFFICULT - 1; i++ ) {
		const [ cox, coy ] = get_random_xy();
		const enemy = get_meteor( cox, coy );
		liveEnemy.push( enemy );
	}
	return liveEnemy;
}

function create_coins( favicon_href ) {
	const { get_item_coin } = imageDataObjects;
	let liveCoins = [];

	for ( let i = 0; i <= DIFFICULT_PARAM.DIFFICULT - 1; i++ ) {
		const [ cox, coy ] = get_random_xy();
		const coin = get_item_coin( favicon_href, cox, coy );
		liveCoins.push( coin );
	}
	return liveCoins;
}

function get_random_xy() {
	let coxRandom = Math.random() * 1000;
	coxRandom = coxRandom > CANVAS.WIDTH ? coxRandom / 5.53 : coxRandom;
	const coyRandom = Math.random() * 1000 - 1000;

	return [ Math.trunc( coxRandom ), Math.trunc( coyRandom ) ];
}

function draw_enemies( enemies ) {
	enemies.forEach( enemy => {
		enemy.draw_meteor();
	} );
}

function draw_coins( coins ) {
	coins.forEach( coin => {
		coin.draw_coin();
	} );
}

function check_collision_arc_rect( objects, ship ) {
	let collision = false;

	for ( let i = 0; i < objects.length && !collision; i++ ) {
		const obj = objects[ i ];
		if ( obj && !obj.isDead && !obj.outside ) {
			collision = collision_arc_rect( obj, ship );
			collisionObject = obj;

			obj.isDead = collision;
		} else {
			collision = false;
		}
	}
	return collision;
}

function collision_arc_rect( enemy, ship ) {
	let distX = Math.trunc( Math.abs( enemy.coxArc - ship.cox - ship.w / 2 ) );
	let distY = Math.trunc( Math.abs( enemy.coyArc - ship.coy - ship.h / 2 ) );

	if ( distX > ( ship.w / 2 + enemy.r ) ) {
		return false;
	}
	if ( distY > ( ship.h / 2 + enemy.r ) ) {
		return false;
	}

	if ( distX <= ( ship.w / 2 ) ) {
		return true;
	}
	if ( distY <= ( ship.h / 2 ) ) {
		return true;
	}

	const dx = distX - ship.w / 2;
	const dy = distY - ship.h / 2;
	return ( dx * dx + dy * dy <= ( enemy.r * enemy.r ) );
}

function update_rect() {
	ctx.fillStyle = '#000'; // устанавливаем цвет заливки в черный
	ctx.clearRect( 0, 0, canvas.width, canvas.height );
	ctx.fillRect( 0, 0, canvas.width, canvas.height );
}

function game_over() {
	window.requestAnimationFrame( () => {
		ctx.beginPath();
		ctx.font = '45px fantasy';
		ctx.fillText( 'GAME OVER', 170, 230 );
		ctx.fill();
		ctx.closePath();
	} );
}

function draw_pause() {
	update_storage( 'state_app', STATE_APP.PAUSE );

	window.requestAnimationFrame( () => {
		ctx.beginPath();
		ctx.font = '45px fantasy';
		ctx.fillText( 'pause', 200, 230 );
		ctx.fill();
		ctx.closePath();
	} );
}

/**
 * Положить значение в common
 * @param {string} key
 * @param {*} value
 */
function update_storage( key, value ) {
	chrome.storage.local.set( { [ key ] : value } );
}
