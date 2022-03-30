import { Consumer } from '@wiki-scripts/core'
import type { ConsumerResult } from '@wiki-scripts/core'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'

export class PokemonConsumer extends Consumer {
	protected readonly wiki: FandomWiki

	public constructor() {
		super( {
			name: 'pokémon'
		} )
		this.wiki = this.fandom.getWiki( 'es.pokemongo' )
	}

	public async run(): Promise<ConsumerResult> {
		const bot = await this.getFandomBot()
		await bot.setWiki( this.wiki )

		const pokemon = await this.getAllPokemon()
		const data: Record<string, Partial<{ 'número': string, tipos: string[] }>> = {}

		for await ( const page of this.wiki.iterPages( pokemon ) ) {
			if ( page.missing ) continue
			const { content } = page.revisions[ 0 ].slots.main
			const parsed = parse( content )
			const [ infobox ] = parsed.findTemplate( 'InfoboxPokémon' ).nodes
			if ( !infobox ) continue
			const number = infobox.getParameter( 'número' )?.value.match( /\d+/ )?.[ 0 ]
			const type1 = infobox.getParameter( 'tipo-primario' )?.value
			const type2 = infobox.getParameter( 'tipo-secundario' )?.value
			const types: string[] = []
			if ( type1 ) types.push( type1 )
			if ( type2 ) types.push( type2 )

			const item: typeof data[ string ] = {}
			if ( number ) item[ 'número' ] = number
			if ( types.length > 0 ) item.tipos = types

			data[ page.title ] = item
		}

		await bot.edit( {
			bot: true,
			summary: 'Actualizando datos de Pokémon',
			text: format( data ),
			title: 'Module:Pokémon/datos'
		} )

		return {
			success: true
		}
	}

	protected async getAllPokemon(): Promise<string[]> {
		return ( await this.wiki.queryProp( {
			prop: 'transcludedin',
			tilimit: 'max',
			titles: 'Plantilla:InfoboxPokémon'
		} ) )[ 0 ]?.transcludedin.map( i => i.title ) ?? []
	}
}
