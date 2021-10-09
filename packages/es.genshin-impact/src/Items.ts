import 'shared'
import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'

enum PageType {
	Personaje = 'Personaje',
	Arma = 'Arma',
	Artefacto = 'Artefacto',
	Enemigo = 'Enemigo',
	Comida = 'Comida',
	Vestuario = 'Vestuario'
}

const getPagesByType = async ( { infobox, type, wiki }: { infobox: string, type: PageType, wiki: FandomWiki } ): Promise<Record<string, PageType>> => {
	const pages = await wiki.getTransclusions( `Plantilla:Infobox ${ infobox }` )
	return pages.reduce( ( collection, title ) => {
		collection[ title ] = type
		return collection
	}, {} as Record<string, PageType> )
}

void ( async () => {
	const { FANDOM_PASSWORD, FANDOM_USERNAME } = process.env
	if ( !FANDOM_PASSWORD || !FANDOM_USERNAME ) {
		console.error( 'You haven\'t set a fandom username and/or password in your environment variables.' )
		return
	}

	const fandom = new Fandom()
	const wiki = fandom.getWiki( 'es.genshin-impact' )
	const pagetypes: Array<[ string, PageType ]> = [
		[
			'Arma', PageType.Arma
		],
		[
			'Artefacto', PageType.Artefacto
		],
		[
			'Comida', PageType.Comida
		],
		[
			'Enemigo', PageType.Enemigo
		],
		[
			'Personaje jugable', PageType.Personaje
		],
		[
			'Vestuario', PageType.Vestuario
		]
	]

	const pages: Record<string, PageType> = {}
	for ( const pagetype of pagetypes ) {
		const [
			infobox, type
		] = pagetype
		const result = await getPagesByType( {
			infobox,
			type,
			wiki
		} )
		Object.assign( pages, result )
	}

	const lua = format( pages )

	const bot = await fandom.login( {
		password: FANDOM_PASSWORD,
		username: FANDOM_USERNAME,
		wiki
	} )

	await bot.edit( {
		bot: true,
		text: lua,
		title: 'Module:Prefijo/datos'
	} )
		.then( console.log )
		.catch( e => {
			console.error( e )
			return undefined
		} )
} )()
