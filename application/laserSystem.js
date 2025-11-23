import { draw_explosion } from './rendering.js';

export function find_laser_collision( enemies, ship ) {
	const laserX = ship.cox + ship.w / 2;
	let closestY = 0;

	for ( let i = 0; i < enemies.length; i++ ) {
		const enemy = enemies[ i ];
		if ( enemy && !enemy.isDead && !enemy.outside ) {
			const distX = Math.abs( enemy.coxArc - laserX );

			if ( distX <= enemy.r ) {
				if ( enemy.coyArc < ship.coy && enemy.coyArc > closestY ) {
					closestY = enemy.coyArc + enemy.r;
				}
			}
		}
	}

	return closestY;
}

export function process_laser_hits( enemies, ship, laser, laserImpact, damagePerTick ) {
	const laserX = ship.cox + ship.w / 2;
	let closestEnemy = null;
	let closestY = 0;

	for ( let i = 0; i < enemies.length; i++ ) {
		const enemy = enemies[ i ];
		if ( enemy && !enemy.isDead && !enemy.outside ) {
			const distX = Math.abs( enemy.coxArc - laserX );

			if ( distX <= enemy.r && enemy.coyArc < ship.coy ) {
				if ( enemy.coyArc > closestY ) {
					closestY = enemy.coyArc;
					closestEnemy = enemy;
				}
			}
		}
	}

	if ( closestEnemy ) {
		closestEnemy.damageTime += damagePerTick;

		laserImpact.update_position( laserX, closestEnemy.coyArc + closestEnemy.r );

		if ( closestEnemy.damageTime >= 2000 ) {
			closestEnemy.isDead = true;
			draw_explosion( closestEnemy.cox, closestEnemy.coy );
		}
	}
}

export function reset_damage_timers( objects ) {
	objects.forEach( obj => {
		if ( obj && !obj.isDead ) {
			obj.damageTime = 0;
		}
	} );
}
