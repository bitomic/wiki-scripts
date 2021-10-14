import { items } from './items'

export const findItem = ( name: string ): ItemsXML[ 'items' ][ keyof ItemsXML[ 'items' ] ][ 0 ] | null => {
	const searchvalue = ( name === 'Menor que tres' ? 'lt3' : name )
		.toLowerCase()
		.replace( /\(.*?\)/g, '' )
		.replace( /[^a-zñ0-9]/g, '' )
	let type: keyof typeof items
	for ( type in items ) {
		const collection = items[ type ]
		for ( const item of collection ) {
			if ( item.name.toLowerCase().replace( /[^a-zñ0-9]/g, '' ) === searchvalue ) return item
		}
	}
	return null
}
