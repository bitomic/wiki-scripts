import { Fandom } from 'mw.js'
import { parse } from 'mwparser'
import util from 'util'

/*
( async () => {
	const fandom = new Fandom()
	const wiki = fandom.getWiki( 'es.yugioh' )
	const page = ( await wiki.getPages( 'Engranaji-ancla' ) )
	const parsed = parse( page )
	console.log( util.inspect( parsed, {
		colors: true,
		depth: 6
	} ) )
} )()
*/

void ( async () => {
	const fandom = new Fandom()
	const wiki = fandom.getWiki( 'es.yugioh' )
	const cards = ( await wiki.getTransclusions( 'Plantilla:Infobox Carta' ) ).sort()

	let counter = 0
	const total = cards.length
	console.time( 'a' )
	for await ( const page of wiki.iterPages( cards ) ) {
		console.log( page.title )
		counter++
		const content = page.revisions[ 0 ]?.slots.main.content
		if ( !content ) {
			console.log( `${ counter } / ${ total }`, `No content: ${ page.title }` )
			break
		}
		const parsed = parse( content )
		const [ infobox ] = parsed.findTemplate( 'Infobox Carta' ).nodes
		if ( !infobox ) {
			console.log( `${ counter } / ${ total }`, `No infobox: ${ page.title }` )
			console.log( util.inspect( parsed, {
				colors: true,
				depth: 6
			} ) )
			break
		}
		console.log( `${ counter } / ${ total }`, infobox.getParameter( 'inglés' )?.value )
	}
	console.timeEnd( 'a' )
} )()
