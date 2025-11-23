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
	 * Проверить загружается ли изображение по URL
	 * @param {string} url
	 * @param {number} timeout
	 * @return {Promise<boolean>}
	 */
	async check_image_loads(url, timeout = 3000) {
		return new Promise((resolve) => {
			const img = new Image();
			const timer = setTimeout(() => {
				img.src = '';
				resolve(false);
			}, timeout);

			img.onload = () => {
				clearTimeout(timer);
				resolve(true);
			};

			img.onerror = () => {
				clearTimeout(timer);
				resolve(false);
			};

			img.src = url;
		});
	},

	/**
	 * Проверить, является ли страница защищенной от скриптов
	 * @param {string} url
	 * @return {boolean}
	 */
	is_restricted_page(url) {
		// Служебные протоколы Chrome
		const restrictedProtocols = [
			'chrome://',
			'chrome-extension://',
			'edge://',
			'about:',
			'file://',
			'view-source:',
			'data:',
			'javascript:'
		];

		// Защищенные домены (Chrome Web Store и служебные страницы Google)
		const restrictedDomains = [
			'chromewebstore.google.com',
			'chrome.google.com/webstore',
			'accounts.google.com',
			'myaccount.google.com'
		];

		// Проверка протоколов
		const hasRestrictedProtocol = restrictedProtocols.some(protocol =>
			url.startsWith(protocol)
		);

		// Проверка доменов
		const hasRestrictedDomain = restrictedDomains.some(domain =>
			url.includes(domain)
		);

		return hasRestrictedProtocol || hasRestrictedDomain;
	},

	/**
	 * Получить ссылку на favicon с множественными уровнями защиты
	 */
	async get_favicon() {
		const DEFAULT_FAVICON = chrome.runtime.getURL('/images/google_favicon.png');

		try {
			let [ tab ] = await chrome.tabs.query( { active : true, currentWindow : true } );

			if (!tab || !tab.id || !tab.url) {
				console.log('Нет активной вкладки, используется favicon по умолчанию');
				chrome.storage.local.set( { 'favicon' : DEFAULT_FAVICON } );
				return;
			}

			// Проверка на защищенные страницы
			if (init_popup.is_restricted_page(tab.url)) {
				console.log(`Защищенная страница (${tab.url}), используется favicon по умолчанию`);
				chrome.storage.local.set( { 'favicon' : DEFAULT_FAVICON } );
				return;
			}

			// Метод 1: Парсинг DOM страницы (основной метод)
			try {
				const results = await chrome.scripting.executeScript({
					target: { tabId: tab.id },
					function: parse_favicon_improved,
				});

				if (results && results[0] && results[0].result) {
					const faviconHref = results[0].result;

					// Проверяем, что изображение загружается
					const isValid = await init_popup.check_image_loads(faviconHref);
					if (isValid) {
						console.log('Favicon получен через парсинг DOM:', faviconHref);
						chrome.storage.local.set( { 'favicon' : faviconHref } );
						return;
					}
				}
			} catch (scriptError) {
				console.log('Не удалось выполнить скрипт парсинга:', scriptError);
			}

			// Метод 2: Стандартный путь к favicon
			try {
				const pageUrl = new URL(tab.url);
				const standardFavicon = `${pageUrl.origin}/favicon.ico`;

				// Проверяем загрузку через Image
				const isValid = await init_popup.check_image_loads(standardFavicon);
				if (isValid) {
					console.log('Использован стандартный путь favicon:', standardFavicon);
					chrome.storage.local.set( { 'favicon' : standardFavicon } );
					return;
				}
			} catch (fetchError) {
				console.log('Стандартный путь favicon недоступен:', fetchError);
			}

		} catch (error) {
			console.log('Ошибка при получении favicon:', error);
		}

		// Fallback: используем иконку расширения по умолчанию
		console.log('Используется favicon по умолчанию');
		chrome.storage.local.set( { 'favicon' : DEFAULT_FAVICON } );

		/**
		 * Улучшенная функция парсинга favicon на странице
		 */
		function parse_favicon_improved() {
			// Приоритетный порядок поиска
			const selectors = [
				'link[rel="icon"]',
				'link[rel="shortcut icon"]',
				'link[rel="apple-touch-icon"]',
				'link[rel="apple-touch-icon-precomposed"]',
			];

			// Поиск по селекторам
			for (const selector of selectors) {
				const links = document.querySelectorAll(selector);
				for (const link of links) {
					if (link.href && link.href.startsWith('http')) {
						return link.href;
					}
				}
			}

			// Поиск любых link с href содержащим favicon
			const allLinks = document.querySelectorAll('link[href*="favicon"]');
			for (const link of allLinks) {
				if (link.href && link.href.startsWith('http')) {
					return link.href;
				}
			}

			// Поиск по расширениям файлов
			const imageExtensions = ['.ico', '.png', '.svg', '.jpg', '.jpeg', '.gif'];
			const allLinkElements = document.querySelectorAll('link[href]');
			for (const link of allLinkElements) {
				const href = link.href.toLowerCase();
				if (imageExtensions.some(ext => href.endsWith(ext)) &&
				    (href.includes('favicon') || href.includes('icon'))) {
					return link.href;
				}
			}

			return null;
		}
	},
}
