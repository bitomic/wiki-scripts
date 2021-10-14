import 'shared'
import { Fandom } from 'mw.js'
import { findItem } from './utils'
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
	const titles = ( await wiki.query( {
		cmlimit: 'max',
		cmtitle: 'Category:Objetos activables',
		list: 'categorymembers'
	} ) ).map( i => i.title )
	const items = titles.reduce( ( collection, title ) => {
		const item = findItem( title )
		if ( item ) collection[ title ] = item
		return collection
	}, {} as Record<string, ReturnType<typeof findItem>> )

	const bot = await fandom.login( {
		password: FANDOM_PASSWORD,
		username: FANDOM_USERNAME,
		wiki
	} )

	const contents = await wiki.getPages( titles )
	for ( const [
		title, content
	] of Object.entries( contents ) ) {
		console.log( [ title ] )
		const item = items[ title ]
		if ( !item ) continue
		const parsed = parse( content )
		const [ infobox ] = parsed.findTemplate( 'Infobox Objeto' ).nodes
		if ( !infobox ) continue
		infobox.setParameter( 'identificador', `${ item.id }` )
		infobox.setParameter( 'nombre', item.name )
		if ( 'description' in item ) infobox.setParameter( 'descripción', `${ item.description }` )
		infobox.prettify()
		await bot.edit( {
			bot: true,
			minor: true,
			summary: 'Añadiendo parámetros a la infobox',
			text: `${ parsed }`,
			title: title
		} )
			.catch( () => {
				process.exit( 1 )
			} )
		await sleep( 750 )
	}
} )()
