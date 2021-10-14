import 'shared'
import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'

const getPages = async ( wiki: FandomWiki ): Promise<string[]> => {
	const pages: string[] = []
	const templates = [
		'Plantilla:Infobox Arma',
		'Plantilla:Infobox Comida',
		'Plantilla:Infobox Objeto',
		'Plantilla:Infobox Personaje jugable'
	]

	for ( const template of templates ) {
		const transclusions = await wiki.getTransclusions( template )
		pages.push( ...transclusions )
	}

	return pages
}

const getRarities = async ( { titles, wiki }: { titles: string[], wiki: FandomWiki } ): Promise<Record<string, number>> => {
	const rarities: Record<string, number> = {}

	for await ( const page of wiki.iterPages( titles ) ) {
		const content = page.revisions[ 0 ]?.slots.main.content
		if ( !content ) continue
		const parsed = parse( content )
		const infoboxName = parsed.templates.map( t => t.name ).find( t => t.startsWith( 'Infobox' ) )
		if ( !infoboxName ) continue
		const [ infobox ] = parsed.findTemplate( infoboxName ).nodes
		if ( !infobox ) continue
		const rarity = Number( infobox.getParameter( 'rareza' )?.value )
		if ( isNaN( rarity ) ) continue
		rarities[ page.title ] = rarity
	}

	return rarities
}

void ( async () => {
	const { FANDOM_PASSWORD, FANDOM_USERNAME } = process.env
	if ( !FANDOM_PASSWORD || !FANDOM_USERNAME ) {
		console.error( 'You haven\'t set a fandom username and/or password in your environment variables.' )
		return
	}

	const fandom = new Fandom()
	const wiki = fandom.getWiki( 'es.genshin-impact' )
	const titles = await getPages( wiki )
	const rarities = await getRarities( { titles, wiki } )
	const lua = format( rarities )

	const bot = await fandom.login( {
		password: FANDOM_PASSWORD,
		username: FANDOM_USERNAME,
		wiki
	} )

	await bot.edit( {
		bot: true,
		text: lua,
		title: 'Module:Rarezas'
	} )
		.then( console.log )
		.catch( e => {
			console.error( e )
			return undefined
		} )
} )()
