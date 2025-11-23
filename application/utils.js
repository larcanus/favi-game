// Обрабатывает попадание лазера по объектам
export default function process_laser_hits( enemies, ship, laser, laserImpact, damagePerTick ) {
	const laserX = ship.cox + ship.w / 2;
	let closestEnemy = null;
	let closestY = 0;

	// Сначала находим ближайшего врага на линии лазера
	for ( let i = 0; i < enemies.length; i++ ) {
		const enemy = enemies[ i ];
		if ( enemy && !enemy.isDead && !enemy.outside ) {
			const distX = Math.abs( enemy.coxArc - laserX );

			if ( distX <= enemy.r && enemy.coyArc < ship.coy ) {
				// Ищем врага с максимальным Y (ближайшего к кораблю)
				if ( enemy.coyArc > closestY ) {
					closestY = enemy.coyArc;
					closestEnemy = enemy;
				}
			}
		}
	}

	// Применяем урон только к ближайшему врагу
	if ( closestEnemy ) {
		closestEnemy.damageTime += damagePerTick;

		// Обновляем позицию эффекта попадания
		laserImpact.update_position( laserX, closestEnemy.coyArc + closestEnemy.r );

		// Если урон достиг 2000мс (2 секунды), уничтожаем объект
		if ( closestEnemy.damageTime >= 2000 ) {
			closestEnemy.isDead = true;
			draw_explosion( closestEnemy.cox, closestEnemy.coy );
		}
	}
}
