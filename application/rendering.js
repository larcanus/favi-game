import imageDataObjects from './imageData.js';

export function draw_explosion( cox, coy ) {
	const explosion = imageDataObjects.get_explosion( cox, coy );
	explosion.draw_animation();
}

export function draw_scores_animation( cox, coy ) {
	const scoreAnimation = imageDataObjects.get_score_animation( cox, coy );
	scoreAnimation.draw_animation();
}

export function draw_healing( ship ) {
	const healing = imageDataObjects.get_healing( ship.cox, ship.coy );
	healing.draw_animation();
}

export function draw_enemies( enemies ) {
	enemies.forEach( enemy => {
		enemy.draw_meteor();
	} );
}

export function draw_coins( coins ) {
	coins.forEach( coin => {
		coin.draw_coin();
	} );
}

export function update_canvas( ctx, canvas ) {
	ctx.fillStyle = '#000';
	ctx.clearRect( 0, 0, canvas.width, canvas.height );
	ctx.fillRect( 0, 0, canvas.width, canvas.height );
}

export function draw_pause( ctx ) {
	window.requestAnimationFrame( () => {
		ctx.beginPath();
		ctx.font = '45px fantasy';
		ctx.fillText( 'pause', 200, 230 );
		ctx.fill();
		ctx.closePath();
	} );
}

export function draw_game_over( ctx ) {
	window.requestAnimationFrame( () => {
		ctx.beginPath();
		ctx.fillStyle = '#FF4444';
		ctx.font = '45px fantasy';
		ctx.fillText( 'GAME OVER', 170, 230 );
		ctx.fill();
		ctx.closePath();

		ctx.beginPath();
		ctx.fillStyle = '#FF4444';
		ctx.font = '25px fantasy';
		ctx.fillText( 'Retry?', 240, 300 );
		ctx.fill();
		ctx.closePath();
	} );
}

export function draw_game_win( ctx ) {
	window.requestAnimationFrame( () => {
		ctx.beginPath();
		ctx.fillStyle = '#00FF88';
		ctx.font = '50px fantasy';
		ctx.fillText( 'YOU WIN!', 170, 200 );
		ctx.font = '30px fantasy';
		ctx.fillText( 'Congratulations!', 150, 250 );
		ctx.fill();
		ctx.closePath();
	} );
}
