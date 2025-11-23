export function collision_arc_rect( enemy, ship ) {
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

export function check_collision_arc_rect( objects, ship ) {
	let collision = false;
	let collisionObject = null;

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
	return { collision, collisionObject };
}
