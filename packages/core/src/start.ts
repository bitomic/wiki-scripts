import { ConsumerStore } from './lib'

export const start = async ( dirname: string ): Promise<void> => {
	const name = process.argv[ 2 ] // eslint-disable-line prefer-destructuring
	if ( !name ) {
		console.error( 'You didn\'t specify the consumer name.' )
		return
	}

	const store = new ConsumerStore( dirname )
	await store.load()

	const consumer = store.get( name )
	if ( !consumer ) {
		console.error( `Couldn't find a consumer "${ name }". Available consumers: ${ store.keys().join( ', ' ) }` )
		return
	}

	console.time( name )
	const result = await consumer.run( undefined )
	console.log( result )
	console.timeEnd( name )
}
