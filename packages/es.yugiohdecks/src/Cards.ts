import 'shared'
import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'
import type { Template } from 'mwparser'

const sleep = ( ms: number ): Promise<never> => new Promise( r => { setTimeout( r, ms ) } )

const getIdentifier = ( name: string ): string => name.toUpperCase()
	.replace( /Ñ/g, 'n' )
	.replace( /&/g, 'Y' )
	.normalize( 'NFD' )
	.replace( /[\u0300-\u036f]/g, '' )
	.replace( /\((legal|carta|card)\)/i, '' )
	.replace( /n/g, 'Ñ' )
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
		if ( !english || !code ) return null
		return [
			english,
			'carta mágica',
			'mágica',
			icon?.toLowerCase() || 'normal',
			code
		]
	} else if ( cardType === 'carta de trampa' ) {
		const attributes = [
			'inglés', 'icono', 'código'
		]
		const [
			english, icon, code
		] = attributes.map( attr => infobox.getParameter( attr )?.value )
		if ( !english || !code ) return null
		return [
			english,
			'carta de trampa',
			'trampa',
			icon?.toLowerCase() ?? 'normal',
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
				attribute.toLowerCase(),
				type.toLowerCase(),
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

const getCardsData = async ( wiki: FandomWiki ): Promise<Record<string, string[]>> => {
	const cards = ( await wiki.getTransclusions( 'Plantilla:Infobox Carta' ) ).sort()

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

	return data
}

void ( async () => {
	const { FANDOM_PASSWORD, FANDOM_USERNAME } = process.env
	if ( !FANDOM_PASSWORD || !FANDOM_USERNAME ) {
		console.error( 'You haven\'t set a fandom username and/or password in your environment variables.' )
		return
	}

	const fandom = new Fandom()
	const cards = await getCardsData( fandom.getWiki( 'es.yugioh' ) )

	const sorted: Record<string, Record<string, string[]>> = {}
	for ( const identifier in cards ) {
		const firstLetter = identifier.substr( 0, 1 ).toUpperCase()
		const group = /[A-Z]/.exec( firstLetter ) ? firstLetter : '7'
		if ( !( group in sorted ) ) sorted[ group ] = {}
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		sorted[ group ]![ identifier ] = cards[ identifier ]!
	}

	const wiki = fandom.getWiki( 'es.yugiohdecks' )
	const bot = await fandom.login( {
		password: FANDOM_PASSWORD,
		username: FANDOM_USERNAME,
		wiki
	} )

	const keys = Object.keys( sorted ).sort()
	for ( const key of keys ) {
		const lua = format( sorted[ key ] ?? {} )
		await bot.edit( {
			text: lua,
			title: `Module:RdDatos${ key }`
		} )
			.then( console.log )
			.catch( console.error )
		await sleep( 1000 )
	}
} )()
