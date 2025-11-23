import imageDataObjects from './imageData.js';
import { check_collision_arc_rect } from './collision.js';
import {
	draw_explosion,
	draw_scores_animation,
	draw_healing,
	draw_enemies,
	draw_coins,
	update_canvas,
	draw_pause,
	draw_game_over,
	draw_game_win
} from './rendering.js';
import { create_enemy, create_coins, get_random_xy } from './gameObjects.js';
import { find_laser_collision, process_laser_hits, reset_damage_timers } from './laserSystem.js';
import { check_live_objects, update_storage } from './gameLogic.js';
import { DIFFICULT_PARAM, STATE_APP } from '../common/constans.js';

export class Game {
	constructor( ctx, canvas, favicon_href ) {
		this.ctx = ctx;
		this.canvas = canvas;
		this.favicon_href = favicon_href;

		this.isGameStop = false;
		this.isGamePause = false;
		this.collisionObject = null;

		this.pressedKeys = {
			left: false,
			right: false,
			shoot: false
		};

		this.enemies = [];
		this.coins = [];
		this.health = null;

		this.initGameObjects();
		this.initIntervals();
		this.initEventListeners();
	}

	initGameObjects() {
		const {
			get_back_ground,
			get_ship,
			get_health_count,
			get_score_count,
			get_laser,
			get_laser_impact
		} = imageDataObjects;

		this.healthCount = get_health_count();
		this.ship = get_ship();
		this.backGround = get_back_ground();
		this.scoreCount = get_score_count();
		this.laser = get_laser( this.ship );
		this.laserImpact = get_laser_impact();

		this.backGround.draw_back_ground();
		this.healthCount.draw_health_count();
		this.scoreCount.draw_score_count();
		this.ship.drow_ship();
	}

	initIntervals() {
		this.enemyRespIntervalId = setInterval( () => {
			const needNewEnemy = check_live_objects( this.enemies );
			if ( needNewEnemy ) {
				this.enemies = create_enemy();
			}
			const needNewItemCoin = check_live_objects( this.coins );
			if ( needNewItemCoin ) {
				this.coins = create_coins( this.favicon_href );
			}
		}, 2000 );

		this.healthyRespIntervalId = setInterval( () => {
			const { get_health_arc } = imageDataObjects;
			const [ cox, coy ] = get_random_xy();
			this.health = get_health_arc( cox, coy );
		}, DIFFICULT_PARAM.DIFFICULT * 5000 );

		this.highDiffIntervalId = setInterval( () => {
			DIFFICULT_PARAM.DIFFICULT += 1;
		}, 30000 );

		this.mainIntervalId = setInterval( () => {
			this.gameLoop();
		}, 10 );
	}

	gameLoop() {
		if ( !this.isGameStop ) {
			this.checkWinCondition();
			this.checkCollisions();
			this.handleLaser();
		}

		if ( !this.isGamePause ) {
			this.handleMovement();
			this.render();
		}
	}

	checkWinCondition() {
		if ( this.scoreCount.count >= 1000 ) {
			this.winGame();
		}
	}

	checkCollisions() {
		const enemyCollision = check_collision_arc_rect( this.enemies, this.ship );
		if ( enemyCollision.collision ) {
			draw_explosion( enemyCollision.collisionObject.cox, enemyCollision.collisionObject.coy );
			if ( this.healthCount.count !== 1 ) {
				this.healthCount.count -= 1;
			} else {
				this.healthCount.count -= 1;
				this.stopGame();
			}
		}

		const coinCollision = check_collision_arc_rect( this.coins, this.ship );
		if ( coinCollision.collision ) {
			draw_scores_animation( coinCollision.collisionObject.cox, coinCollision.collisionObject.coy );
			this.scoreCount.count++;
		}

		if ( this.health ) {
			const healthCollision = check_collision_arc_rect( [ this.health ], this.ship );
			if ( healthCollision.collision ) {
				this.healthCount.count++;
				draw_healing( this.ship );
			}
		}
	}

	handleLaser() {
		if ( this.pressedKeys.shoot && !this.laser.isActive ) {
			this.laser.activate();
		} else if ( !this.pressedKeys.shoot && this.laser.isActive ) {
			this.laser.deactivate();
			this.laserImpact.reset();
			reset_damage_timers( this.enemies );
		}

		if ( this.laser.isActive ) {
			process_laser_hits( this.enemies, this.ship, this.laser, this.laserImpact, 10 );
		}
	}

	handleMovement() {
		if ( !this.isGameStop ) {
			if ( this.pressedKeys.right ) {
				this.ship.move_right();
			}
			if ( this.pressedKeys.left ) {
				this.ship.move_left();
			}
		}
		update_canvas( this.ctx, this.canvas );
	}

	render() {
		window.requestAnimationFrame( () => {
			this.backGround.draw_back_ground();
			this.ship.drow_ship();

			if ( this.laser.isActive ) {
				const laserEndY = find_laser_collision( this.enemies, this.ship );
				this.laser.draw_laser( laserEndY );

				if ( laserEndY > 0 ) {
					this.laserImpact.draw_impact();
				}
			}

			draw_enemies( this.enemies );
			draw_coins( this.coins );
			this.healthCount.draw_health_count();
			this.scoreCount.draw_score_count();
			this.health?.draw_health();
		} );
	}

	stopGame() {
		if ( !this.isGameStop ) {
			this.isGameStop = true;
			this.ship.isDead = true;
			this.resetKeys();
			update_canvas( this.ctx, this.canvas );
			this.clearIntervals();

			draw_explosion( this.ship.cox, this.ship.coy );

			setTimeout( () => {
				clearInterval( this.mainIntervalId );
				draw_game_over( this.ctx );
			}, 1500 );
		}
	}

	winGame() {
		if ( !this.isGameStop ) {
			this.isGameStop = true;
			this.resetKeys();
			update_canvas( this.ctx, this.canvas );
			this.clearIntervals();

			setTimeout( () => {
				clearInterval( this.mainIntervalId );
				draw_game_win( this.ctx );
			}, 500 );
		}
	}

	pauseGame() {
		this.isGamePause = !this.isGamePause;
		if ( this.isGamePause ) {
			this.resetKeys();
		}
		draw_pause( this.ctx );
		update_storage( 'state_app', STATE_APP.PAUSE );
	}

	resetKeys() {
		this.pressedKeys.left = false;
		this.pressedKeys.right = false;
		this.pressedKeys.shoot = false;
	}

	clearIntervals() {
		clearInterval( this.enemyRespIntervalId );
		clearInterval( this.highDiffIntervalId );
		clearInterval( this.healthyRespIntervalId );
	}

	initEventListeners() {
		window.addEventListener( 'keydown', event => this.handleKeyDown( event ) );
		window.addEventListener( 'keyup', event => this.handleKeyUp( event ) );
		window.addEventListener( 'blur', () => this.handleBlur() );
	}

	handleKeyDown( event ) {
		if ( event.repeat ) return;

		if ( !this.isGameStop && !this.isGamePause ) {
			if ( event.key === 'ArrowRight' || event.code === 'KeyD' ) {
				this.pressedKeys.right = true;
			}
			else if ( event.key === 'ArrowLeft' || event.code === 'KeyA' ) {
				this.pressedKeys.left = true;
			}
			else if ( event.key === 'Control' || event.code === 'ControlLeft' || event.code === 'ControlRight' ) {
				this.pressedKeys.shoot = true;
			}
		}

		if ( event.key === 'Escape' ) {
			window.close();
		}

		if ( !this.isGameStop && event.code === 'Space' ) {
			this.pauseGame();
		}
	}

	handleKeyUp( event ) {
		if ( event.key === 'ArrowRight' || event.code === 'KeyD' ) {
			this.pressedKeys.right = false;
		}
		else if ( event.key === 'ArrowLeft' || event.code === 'KeyA' ) {
			this.pressedKeys.left = false;
		}
		else if ( event.key === 'Control' || event.code === 'ControlLeft' || event.code === 'ControlRight' ) {
			this.pressedKeys.shoot = false;
		}
	}

	handleBlur() {
		if ( !this.isGamePause && !this.isGameStop ) {
			this.isGamePause = true;
			draw_pause( this.ctx );
		}
		this.resetKeys();
	}
}
