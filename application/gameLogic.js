export function check_live_objects( objects ) {
	if ( !objects.length ) {
		return true;
	}
	let diedObjects = 0;
	objects.forEach( obj => {
		if ( obj.outside || obj.isDead ) {
			diedObjects++;
		}
	} );
	return diedObjects >= objects.length;
}

export function update_storage( key, value ) {
	chrome.storage.local.set( { [ key ]: value } );
}
