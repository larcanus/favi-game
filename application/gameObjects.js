import imageDataObjects from './imageData.js';
import { CANVAS, DIFFICULT_PARAM } from '../common/constans.js';

export function get_random_xy() {
	let coxRandom = Math.random() * 1000;
	coxRandom = coxRandom > CANVAS.WIDTH ? coxRandom / 5.53 : coxRandom;
	const coyRandom = Math.random() * 1000 - 1000;

	return [ Math.trunc( coxRandom ), Math.trunc( coyRandom ) ];
}

export function create_enemy() {
	const { get_meteor } = imageDataObjects;
	let liveEnemy = [];

	for ( let i = 0; i <= DIFFICULT_PARAM.DIFFICULT - 1; i++ ) {
		const [ cox, coy ] = get_random_xy();
		const enemy = get_meteor( cox, coy );
		liveEnemy.push( enemy );
	}
	return liveEnemy;
}

export function create_coins( favicon_href ) {
	const { get_item_coin } = imageDataObjects;
	let liveCoins = [];

	for ( let i = 0; i <= DIFFICULT_PARAM.DIFFICULT - 1; i++ ) {
		const [ cox, coy ] = get_random_xy();
		const coin = get_item_coin( favicon_href, cox, coy );
		liveCoins.push( coin );
	}
	return liveCoins;
}
