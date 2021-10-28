import 'shared'
import { findItem, pools } from './utils'
import { Fandom } from 'mw.js'
import { parse } from 'mwparser'

void ( async () => {
	const sleep = ( ms: number ): Promise<never> => new Promise( r => { setTimeout( r, ms ) } )
	const { FANDOM_PASSWORD, FANDOM_USERNAME } = process.env
	if ( !FANDOM_PASSWORD || !FANDOM_USERNAME ) {
		console.error( 'You haven\'t set a fandom username and/or password in your environment variables.' )
		return
	}

	const fandom = new Fandom()
	const wiki = fandom.getWiki( 'es.bindingofisaac' )
	const titles = [
		...( await wiki.query( {
			cmlimit: 'max',
			cmtitle: 'Category:Objetos activables',
			list: 'categorymembers'
		} ) ).map( i => i.title ),
		...( await wiki.query( {
			cmlimit: 'max',
			cmtitle: 'Category:Objetos pasivos',
			list: 'categorymembers'
		} ) ).map( i => i.title )
	]
	const items = titles.reduce( ( collection, title ) => {
		const item = findItem( title )
		if ( item ) collection[ `${ item.id }` ] = title
		return collection
	}, {} as Record<string, string> )

	const poolsByItem: Record<string, string> = {}
	for ( const [
		id, title
	] of Object.entries( items ) ) {
		const itempools = Object.entries( pools )
			.filter( ( [
				_, poolitems
			] ) => poolitems.includes( Number( id ) ) )
			.map( i => i[ 0 ] )
		poolsByItem[ title ] = itempools.join( ', ' )
	}

	const bot = await fandom.login( {
		password: FANDOM_PASSWORD,
		username: FANDOM_USERNAME,
		wiki
	} )

	const contents = await wiki.getPages( Object.keys( poolsByItem ) )
	for ( const [
		title, content
	] of Object.entries( contents ) ) {
		console.log( [ title ] )
		const pools = poolsByItem[ title ]
		if ( !pools ) continue
		const parsed = parse( content )
		const [ infobox ] = parsed.findTemplate( 'Infobox Objeto' ).nodes
		if ( !infobox ) continue
		infobox.setParameter( 'fuentes', pools )
		infobox.prettify()
		await bot.edit( {
			bot: true,
			minor: true,
			summary: 'Añadiendo fuentes de obtención',
			text: `${ parsed }`,
			title: title
		} )
			.catch( () => {
				process.exit( 1 )
			} )
		await sleep( 500 )
	}
} )()
