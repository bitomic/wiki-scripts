import 'shared'
import { Fandom } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'

void ( async () => {
	const { FANDOM_PASSWORD, FANDOM_USERNAME } = process.env
	if ( !FANDOM_PASSWORD || !FANDOM_USERNAME ) {
		console.error( 'You haven\'t set a fandom username and/or password in your environment variables.' )
		return
	}

	const fandom = new Fandom()
	const wiki = fandom.getWiki( 'es.genshin-impact' )
	const artifacts = await wiki.getTransclusions( 'Plantilla:Infobox Artefacto' )
	const pieces: Record<string, Record<string, string>> = {}
	const parts = [
		'flor', 'pluma', 'arenas', 'cáliz', 'tiara'
	]

	for await ( const page of wiki.iterPages( artifacts ) ) {
		const content = page.revisions[ 0 ]?.slots.main.content
		if ( !content ) continue
		const { title } = page
		pieces[ title ] = {}
		const parsed = parse( content )
		const [ infobox ] = parsed.findTemplate( 'Infobox Artefacto' ).nodes
		if ( !infobox ) continue
		for ( const part of parts ) {
			const parameter = infobox.getParameter( part )
			if ( !parameter || parameter.value.length === 0 ) continue
			Object.assign(
				pieces[ title ],
				{ [ part ]: parameter.value }
			)
		}
	}

	const lua = format( pieces )

	const bot = await fandom.login( {
		password: FANDOM_PASSWORD,
		username: FANDOM_USERNAME,
		wiki
	} )

	await bot.edit( {
		bot: true,
		text: lua,
		title: 'Module:Artefactos'
	} )
		.then( console.log )
		.catch( e => {
			console.error( e )
			return undefined
		} )
} )()
