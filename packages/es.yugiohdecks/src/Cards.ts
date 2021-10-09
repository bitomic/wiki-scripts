import { Fandom } from 'mw.js'
import fs from 'fs-extra'
import { parse } from 'mwparser'
import path from 'path'
import type { Template } from 'mwparser'
//import util from 'util'

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

const getIdentifier = ( name: string ): string => name.toUpperCase()
	.normalize( 'NFD' )
	.replace( /[\u0300-\u036f]/g, '' )
	.replace( /\((legal|carta|card)\)/i, '' )
	.replace( /[^A-ZÑ0-9]/g, '' )

const parseCard = ( infobox: Template ): string[] | null => {
	const message = infobox.getParameter( 'mensaje' )?.value
	if ( message?.toLowerCase().includes( 'anime' ) ) return null
	const cardType = infobox.getParameter( 'carta' )?.value.toLowerCase()
	if ( !cardType ) return null
	if ( [
		'monstruo ra', 'monstruo slifer', 'monstruo obelisco', 'monstruo de sincronía oscura', 'ficha', 'carta de virus'
	].includes( cardType ) ) return null

	if ( cardType === 'carta mágica' ) {
		const attributes = [
			'inglés', 'icono', 'código'
		]
		const [
			english, icon, code
		] = attributes.map( attr => infobox.getParameter( attr )?.value )
		if ( !english || !icon || !code ) return null
		return [
			english,
			'carta mágica',
			'mágica',
			icon.toLowerCase(),
			code
		]
	} else if ( cardType === 'carta de trampa' ) {
		const attributes = [
			'inglés', 'icono', 'código'
		]
		const [
			english, icon, code
		] = attributes.map( attr => infobox.getParameter( attr )?.value )
		if ( !english || !icon || !code ) return null
		return [
			english,
			'carta de trampa',
			'trampa',
			icon.toLowerCase(),
			code
		]
	} else {
		const attributes = [
			'inglés', 'atributo', 'tipo', 'nivel', 'ataque', 'defensa', 'código'
		]
		const [
			english, attribute, type, level, attack, defense, code
		] = attributes.map( attr => infobox.getParameter( attr )?.value )
		if ( !english || !attribute || !type || !attack || !code ) return null
		if ( cardType === 'monstruo de enlace' ) {
			return [
				english,
				cardType,
				attribute,
				type,
				attack,
				code
			]
		} else {
			if ( !defense || !level ) return null
			return [
				english,
				cardType,
				attribute,
				type,
				level,
				attack,
				defense,
				code
			]
		}
	}
}

void ( async () => {
	const fandom = new Fandom()
	const wiki = fandom.getWiki( 'es.yugioh' )
	//const cards = ( await wiki.getTransclusions( 'Plantilla:Infobox Carta' ) ).sort()
	const cards = [ 'Cría Protectora del Esgrimista de la Espada de la Destrucción' ]

	const data: Record<string, string[]> = {}

	for await ( const page of wiki.iterPages( cards ) ) {
		const content = page.revisions[ 0 ]?.slots.main.content
		if ( !content ) continue
		const parsed = parse( content )
		const [ infobox ] = parsed.findTemplate( 'Infobox Carta' ).nodes
		if ( !infobox ) continue
		const cardData = parseCard( infobox )
		if ( cardData ) {
			const es = getIdentifier( page.title )
			const en = cardData[ 0 ] ? getIdentifier( cardData[ 0 ] ) : null
			const fullData = [
				page.title, ...cardData
			]
			data[ es ] = fullData
			if ( en ) data[ en ] = fullData
		}
	}

	const filepath = path.resolve( __dirname, '../cards.json' )
	fs.ensureFileSync( filepath )
	fs.writeJSONSync( filepath, data, {
		spaces: '\t'
	} )
} )()
