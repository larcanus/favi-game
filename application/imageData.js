import { CANVAS, DIFFICULT_PARAM } from '../common/constans.js';

const imageDataObjects = {

	ctx : null,

	get_ship() {
		class Ship {
			constructor( ctx ) {
				this.image = new Image( CANVAS.WIDTH, CANVAS.HEIGHT + 1000 );
				this.image.src = `/images/ship.png`;
				this.ctx = ctx;
				this.cox = 5;
				this.coy = 360;
				this.w = 75;
				this.h = 90;
				this.sw = 140;
				this.sh = 140;
				this.dw = 130;
				this.dh = 130;
				this.dx = 1;
				this.dy = 1;
				this.isDead = false;
			}

			drow_ship() {
				if ( !this.isDead ) {
					this.ctx.beginPath();
					this.ctx.rect( this.cox, this.coy, this.w, this.h );
					this.ctx.drawImage( this.image, 0, 0, this.sw, this.sh, this.cox - 10, this.coy - 20, this.dw, this.dh, );
					this.ctx.closePath();
				}

			}

			move_right() {
				if ( !this.isDead ) {
					this.cox = Math.max( 0, Math.min( CANVAS.WIDTH - this.w, this.cox + this.dx ) );
					this.cox += this.dx;
					if ( this.cox > CANVAS.WIDTH - this.w ) {
						this.cox = CANVAS.WIDTH - this.w;
					}
				}
			}

			move_left() {
				if ( !this.isDead ) {
					this.cox = Math.max( 0, Math.min( CANVAS.WIDTH - this.w, this.cox - this.dx ) );
					this.cox -= this.dx;
					if ( this.cox < 0 ) {
						this.cox = 0;
					}
				}
			}
		}

		return new Ship( imageDataObjects.ctx );
	},

	get_laser( ship ) {
		class Laser {
			constructor( ctx, ship ) {
				this.ctx = ctx;
				this.ship = ship;
				this.isActive = false;
				this.width = 8;
				this.color = '#00BFFF';
				this.glowColor = '#4DD0FF';
			}

			draw_laser( targetY = 0 ) {
				if ( !this.isActive || this.ship.isDead ) return;

				const startX = this.ship.cox - 3 + this.ship.w / 2;
				const startY = this.ship.coy;
				const endY = targetY;

				this.ctx.save();

				// Внешнее свечение
				this.ctx.shadowBlur = 20;
				this.ctx.shadowColor = this.glowColor;

				// Основной луч
				this.ctx.beginPath();
				this.ctx.strokeStyle = this.color;
				this.ctx.lineWidth = this.width;
				this.ctx.moveTo( startX, startY );
				this.ctx.lineTo( startX, endY );
				this.ctx.stroke();

				// Внутренний яркий луч
				this.ctx.beginPath();
				this.ctx.strokeStyle = '#FFFFFF';
				this.ctx.lineWidth = this.width / 2;
				this.ctx.moveTo( startX, startY );
				this.ctx.lineTo( startX, endY );
				this.ctx.stroke();

				this.ctx.restore();
			}

			activate() {
				this.isActive = true;
			}

			deactivate() {
				this.isActive = false;
			}
		}

		return new Laser( imageDataObjects.ctx, ship );
	},

	get_laser_impact() {
		class LaserImpact {
			constructor( ctx ) {
				this.ctx = ctx;
				this.x = 0;
				this.y = 0;
				this.frame = 0;
				this.maxFrame = 8;
				this.particles = [];
			}

			update_position( x, y ) {
				this.x = x;
				this.y = y;
				this.frame++;

				// Создаём новые частицы
				if ( this.frame % 2 === 0 ) {
					for ( let i = 0; i < 3; i++ ) {
						this.particles.push( {
							x: x + ( Math.random() - 0.5 ) * 20,
							y: y + ( Math.random() - 0.5 ) * 20,
							vx: ( Math.random() - 0.5 ) * 4,
							vy: ( Math.random() - 0.5 ) * 4,
							life: 20,
							size: Math.random() * 3 + 2
						} );
					}
				}

				// Обновляем и удаляем старые частицы
				this.particles = this.particles.filter( p => {
					p.x += p.vx;
					p.y += p.vy;
					p.life--;
					p.size *= 0.95;
					return p.life > 0;
				} );

				if ( this.frame >= this.maxFrame ) {
					this.frame = 0;
				}
			}

			draw_impact() {
				if ( !this.x || !this.y ) return;

				this.ctx.save();

				// Центральная вспышка
				const pulseSize = 15 + Math.sin( this.frame * 0.5 ) * 5;

				// Внешнее свечение
				const gradient = this.ctx.createRadialGradient( this.x, this.y, 0, this.x, this.y, pulseSize );
				gradient.addColorStop( 0, 'rgba(255, 255, 255, 0.8)' );
				gradient.addColorStop( 0.3, 'rgba(0, 191, 255, 0.6)' );
				gradient.addColorStop( 0.6, 'rgba(255, 165, 0, 0.3)' );
				gradient.addColorStop( 1, 'rgba(255, 0, 0, 0)' );

				this.ctx.fillStyle = gradient;
				this.ctx.beginPath();
				this.ctx.arc( this.x, this.y, pulseSize, 0, Math.PI * 2 );
				this.ctx.fill();

				// Яркий центр
				this.ctx.fillStyle = '#FFFFFF';
				this.ctx.beginPath();
				this.ctx.arc( this.x, this.y, 5, 0, Math.PI * 2 );
				this.ctx.fill();

				// Рисуем частицы
				this.particles.forEach( p => {
					const alpha = p.life / 20;
					this.ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 0, ${alpha})`;
					this.ctx.beginPath();
					this.ctx.arc( p.x, p.y, p.size, 0, Math.PI * 2 );
					this.ctx.fill();
				} );

				// Кольца ударной волны
				const ringSize = ( this.frame / this.maxFrame ) * 25;
				const ringAlpha = 1 - ( this.frame / this.maxFrame );
				this.ctx.strokeStyle = `rgba(0, 191, 255, ${ringAlpha * 0.6})`;
				this.ctx.lineWidth = 2;
				this.ctx.beginPath();
				this.ctx.arc( this.x, this.y, ringSize, 0, Math.PI * 2 );
				this.ctx.stroke();

				this.ctx.restore();
			}

			reset() {
				this.x = 0;
				this.y = 0;
				this.frame = 0;
				this.particles = [];
			}
		}

		return new LaserImpact( imageDataObjects.ctx );
	},

	get_enemy_rect( cox, coy ) {
		class Enemy {
			constructor( ctx, cox, coy ) {
				this.ctx = ctx;
				this.cox = cox || 65;
				this.coy = coy || -65;
				this.dx = 0;
				this.dy = 1;
				this.w = 40;
				this.h = 40;
				this.outside = false;
				this.isDead = false;
			}

			draw_enemy( cox ) {
				this.cox += cox;
				this.coy += this.dy;
				this.ctx.beginPath();

				if ( this.coy > -20 ) {
					this.ctx.rect( this.cox, this.coy, this.w, this.h );
					this.outside = false;
				}
				if ( this.coy > CANVAS.HEIGHT ) {
					this.outside = true;
				}
				this.ctx.fillStyle = '#0095DD';
				this.ctx.fill();
				this.ctx.closePath();

			}
		}

		return new Enemy( imageDataObjects.ctx, cox, coy );
	},

	get_health_count() {
		class Health_count {
			constructor( ctx ) {
				this.image = new Image( CANVAS.WIDTH, CANVAS.HEIGHT + 1000 )
				this.image.src = `/images/health_count.png`;
				this.ctx = ctx;
				this.cox = 5;
				this.coy = 5;
				this.w = 25;
				this.h = 25;
				this.sw = 40;
				this.sh = 40;
				this.dw = 30;
				this.dh = 30;
				this.count = 3;
			}

			draw_health_count() {
				this.ctx.beginPath();
				this.ctx.fillStyle = '#1389FE';
				this.ctx.drawImage( this.image, 0, 0, this.sw, this.sh, this.cox, this.coy, this.dw, this.dh, );
				this.ctx.font = '25px fantasy';
				this.ctx.fillText( this.count, this.cox + 35, this.coy + 22 );
				this.ctx.fill();
				this.ctx.closePath();
			}
		}

		return new Health_count( imageDataObjects.ctx );
	},

	get_score_count() {
		class Score_count {
			constructor( ctx ) {
				this.ctx = ctx;
				this.coy = 5;
				this.count = 0;
			}

			draw_score_count() {
				this.ctx.beginPath();
				this.ctx.fillStyle = '#1389FE';
				this.ctx.font = '23px fantasy';

				const fullText = `score : ${this.count}`;
				const textWidth = this.ctx.measureText( fullText ).width;
				const cox = CANVAS.WIDTH - textWidth - 10;

				this.ctx.fillText( fullText, cox, this.coy + 21 );
				this.ctx.fill();
				this.ctx.closePath();
			}
		}

		return new Score_count( imageDataObjects.ctx );
	},

	get_back_ground() {
		class Back_ground {
			constructor( ctx ) {
				this.image = new Image( CANVAS.WIDTH, CANVAS.HEIGHT + 1000 )
				this.image.src = `/images/stars_bg.jpg`;
				this.h = CANVAS.HEIGHT;
				this.cox = -1;
				this.coy = -1;
				this.ctx = ctx;
				this.speed = 1.3;
			}

			draw_back_ground() {
				this.ctx.drawImage( this.image, this.cox, this.coy, CANVAS.WIDTH, this.h );
				this.ctx.drawImage( this.image, this.cox, this.coy - CANVAS.HEIGHT, CANVAS.WIDTH, this.h );
				this.coy += this.speed;
				if ( this.coy >= CANVAS.HEIGHT ) {
					this.coy = -1;
				}
			}
		}

		return new Back_ground( imageDataObjects.ctx );
	},

	get_meteor( cox, coy ) {
		class Meteor {
			constructor( ctx, cox, coy ) {
				this.image = new Image();
				this.image.src = `/images/meteor_1.png`;
				this.sh = 60;
				this.sw = 60;
				this.dh = 60;
				this.dw = 60;
				this.cox = 10 + cox;
				this.coy = 10 + coy;
				this.coxArc = 40 + cox;
				this.coyArc = 40 + coy;
				this.ctx = ctx;
				this.dx = 0;
				this.dy = DIFFICULT_PARAM.DIFFICULT / 4;
				this.r = 25;
				this.isDead = false;
				this.outside = false;
				this.damageTime = 0;
			}

			draw_meteor() {
				if ( this.coy > -20 && this.coy < 800 && !this.isDead ) {
					this.ctx.beginPath();
					// рисование круглой фигуры
					this.ctx.arc( this.coxArc, this.coyArc, this.r, 0, Math.PI * 2, true );
					// this.ctx.fillStyle = '#e30a3d'; // todo убрать в проде
					// this.ctx.fill();
					// добавление картинки в canvas
					this.ctx.drawImage( this.image, 0, 0, this.sh, this.sw, this.cox, this.coy, this.dh, this.dw );

					// Индикатор урона
					if ( this.damageTime > 0 ) {
						const damagePercent = this.damageTime / 2000;
						this.ctx.strokeStyle = '#FF0000';
						this.ctx.lineWidth = 3;
						this.ctx.beginPath();
						this.ctx.arc( this.coxArc, this.coyArc, this.r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * damagePercent, false );
						this.ctx.stroke();
					}

					this.ctx.closePath();
					this.outside = false;
				}

				if ( this.coy > CANVAS.HEIGHT ) {
					this.outside = true;
				}

				this.coy += this.dy;
				this.coyArc += this.dy;
			}
		}

		return new Meteor( imageDataObjects.ctx, cox, coy );
	},

	get_health_arc( cox, coy ) {
		class Healthy {
			constructor( ctx, cox, coy ) {
				this.image = new Image();
				this.image.src = `/images/health.png`;
				this.sh = 60;
				this.sw = 60;
				this.dh = 60;
				this.dw = 60;
				this.cox = 10 + cox;
				this.coy = 10 + coy;
				this.coxArc = 35 + cox;
				this.coyArc = 35 + coy;
				this.ctx = ctx;
				this.dx = 0;
				this.dy = DIFFICULT_PARAM.DIFFICULT / 4;
				this.r = 25;
				this.outside = false;
				this.isDead = false;
			}

			draw_health() {
				if ( this.coy > -20 && this.coy < 800 && !this.isDead ) {
					this.ctx.beginPath();
					// рисование круглой фигуры
					this.ctx.arc( this.coxArc, this.coyArc, this.r, 0, Math.PI * 2, true );
					// добавление картинки в canvas
					this.ctx.drawImage( this.image, 0, 0, this.sh, this.sw, this.cox, this.coy, this.dh, this.dw );
					this.ctx.closePath();
					this.outside = false;
				}

				if ( this.coy > CANVAS.HEIGHT ) {
					this.outside = true;
				}

				this.coy += this.dy;
				this.coyArc += this.dy;
			}
		}

		return new Healthy( imageDataObjects.ctx, cox, coy );
	},

	get_explosion( cox, coy ) {
		class Explosion {
			constructor( ctx, cox, coy ) {
				this.image = new Image();
				this.image.src = `/images/boom.png`;
				this.ctx = ctx;
				this.cox = cox;
				this.coy = coy;
				this.w = 95;
				this.h = 90;
				this.sw = 90;
				this.sh = 95;
				this.dw = 90;
				this.dh = 95;
			}

			draw_explosion( sx, sy ) {
				this.ctx.beginPath();
				this.ctx.drawImage( this.image, sx, sy, this.sw, this.sh, this.cox, this.coy, this.dw, this.dh );
				this.ctx.closePath();
			}

			draw_animation() {
				let interval = 10;
				let sx = 0;
				let sy = 0;
				let lineY = 0;
				let repead = 1;

				const explosionIntId = setInterval( () => {
					window.requestAnimationFrame( () => {
							this.draw_explosion( sx, sy );
						}
					);

					if ( repead === 0 ) {
						if ( sx !== 400 ) {
							sx += 100;

						} else {
							lineY++;
							sx = 0;
						}

						if ( lineY !== 0 ) {
							sy = lineY * 100;
						}
						if ( lineY === 4 ) {
							clearInterval( explosionIntId );
						}
						repead = 1;
					} else {
						repead--;
					}


				}, interval );
			}
		}

		return new Explosion( imageDataObjects.ctx, cox, coy );
	},

	get_healing( cox, coy ) {
		class Healing {
			constructor( ctx, ship ) {
				this.image = new Image();
				this.image.src = `/images/healing.png`;
				this.ctx = ctx;
				this.w = 95;
				this.h = 90;
				this.sw = 110;
				this.sh = 110;
				this.dw = 130;
				this.dh = 130;
				this.ship = ship;
			}

			draw_healing( sx, sy ) {
				this.ctx.beginPath();
				this.ctx.drawImage( this.image, sx, sy, this.sw, this.sh, this.ship.cox - 23, this.ship.coy + 5, this.dw, this.dh );
				this.ctx.closePath();
			}

			draw_animation() {
				let interval = 10;
				let sx = 0;
				let sy = 0;
				let lineY = 0;
				let repead = 1;

				const explosionIntId = setInterval( () => {
					window.requestAnimationFrame( () => {
							this.draw_healing( sx, sy );
						}
					);

					if ( repead === 0 ) {
						if ( sx !== 400 ) {
							sx += 100;

						} else {
							lineY++;
							sx = 0;
						}

						if ( lineY !== 0 ) {
							sy = lineY * 100;
						}
						if ( lineY === 5 ) {
							clearInterval( explosionIntId );
						}
						repead = 1;
					} else {
						repead--;
					}

				}, interval );
			}
		}

		return new Healing( imageDataObjects.ctx, cox, coy );
	},

	get_score_animation( cox, coy ) {
		class ScoreAnimation {
			constructor( ctx, cox, coy ) {
				this.image = new Image();
				this.image.src = `/images/coin_anim.png`;
				this.ctx = ctx;
				this.cox = cox;
				this.coy = coy;
				this.w = 95;
				this.h = 90;
				this.sw = 120;
				this.sh = 120;
				this.dw = 120;
				this.dh = 120;
			}

			draw_score_animation( sx, sy ) {
				this.ctx.beginPath();
				this.ctx.drawImage( this.image, sx, sy, this.sw, this.sh, this.cox - 45, this.coy - 45, this.dw, this.dh );
				this.ctx.closePath();
			}

			draw_animation() {
				let interval = 10;
				let sx = 0;
				let sy = 0;
				let lineY = 0;
				let repead = 1;

				const explosionIntId = setInterval( () => {
					window.requestAnimationFrame( () => {
							this.draw_score_animation( sx, sy );
						}
					);

					if ( repead === 0 ) {
						if ( sx !== 700 ) {
							sx += 140;

						} else {
							lineY++;
							sx = 0;
						}

						if ( lineY !== 0 ) {
							sy += 134;
						}
						if ( lineY === 7 ) {
							clearInterval( explosionIntId );
						}
						repead = 1;
					} else {
						repead--;
					}

				}, interval );
			}
		}

		return new ScoreAnimation( imageDataObjects.ctx, cox, coy );
	},

	get_item_coin( image_href, cox, coy ) {
		class Item_coin {
			constructor( ctx, image_href, cox, coy ) {
				this.isICO = image_href.includes( '.ico' );
				this.image = new Image();
				this.image_ready = false;
				this.image.onload = function () {
					this.image_ready = true;
					this.fix_size();
				}.bind( this );

				this.image.src = image_href;

				this.sh = this.image.height;
				this.sw = this.image.width;
				this.dh = this.image.height;
				this.dw = this.image.width;

				this.cox = this.isICO ? 17 + cox : 10 + cox;
				this.coy = this.isICO ? 17 + coy : 10 + coy;
				this.coxArc = 40 + cox;
				this.coyArc = 40 + coy;
				this.ctx = ctx;
				this.dx = 0;
				this.dy = DIFFICULT_PARAM.DIFFICULT / 4;
				this.r = 25;
				this.isDead = false;
				this.outside = false;
				this.damageTime = 0;
			}

			fix_size() {
				if ( this.image.width > 65 && this.image.width < 140 ) {
					this.sh = 130;
					this.sw = 130;
					this.dh = 45;
					this.dw = 45;
				} else if ( this.image.width >= 140 ) {
					this.sh = 145;
					this.sw = 145;
					this.dh = 45;
					this.dw = 45;
				} else {
					this.sh = 64;
					this.sw = 64;
					this.dh = 64;
					this.dw = 64;
				}

				if ( this.image.height === 32 || this.image.height === 0 ) {
					this.sh = 32;
					this.sw = 32;
					this.dh = 48;
					this.dw = 48;
				}

				if ( this.image.height < 30 && this.image.height > 1 ) {
					this.sh = 30;
					this.sw = 30;
					this.dh = 70;
					this.dw = 70;
				}
			}

			draw_coin() {
				if ( this.coy > -20 && this.coy < 800 && !this.isDead && this.image_ready ) {
					this.ctx.beginPath();

					// рисование круглой фигуры для проверки границ
					// this.ctx.arc( this.coxArc, this.coyArc, this.r, 0, Math.PI * 2, true );
					// this.ctx.fillStyle = '#e30a3d';
					// this.ctx.fill();

					this.ctx.drawImage( this.image, 0, 0, this.sh, this.sw, this.cox, this.coy, this.dh, this.dw );
					this.ctx.closePath();
					this.outside = false;
				}

				if ( this.coy > CANVAS.HEIGHT ) {
					this.outside = true;
				}

				this.coy += this.dy;
				this.coyArc += this.dy;
			}
		}

		return new Item_coin( imageDataObjects.ctx, image_href, cox, coy );
	},
}

export default imageDataObjects;
