import { Consumer } from '@wiki-scripts/core'
import type { ConsumerResult } from '@wiki-scripts/core'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'

export class MovesConsumer extends Consumer {
	protected readonly wiki: FandomWiki

	public constructor() {
		super( {
			name: 'moves'
		} )
		this.wiki = this.fandom.getWiki( 'es.pokemongo' )
	}

	public async run(): Promise<ConsumerResult> {
		const bot = await this.getFandomBot()
		await bot.setWiki( this.wiki )

		const moves = await this.getAllMoves()
		const data: Record<string, Partial<{ tipo: string, poder: string, dps: string, cargas: string }>> = {}

		for await ( const page of this.wiki.iterPages( moves ) ) {
			if ( page.missing ) continue
			const { content } = page.revisions[ 0 ].slots.main
			const parsed = parse( content )
			const [ infobox ] = parsed.findTemplate( 'InfoboxMovimiento' ).nodes
			if ( !infobox ) continue

			const type = infobox.getParameter( 'tipo' )?.value
			const power = infobox.getParameter( 'poder-gimnasio' )?.value
			const dps = infobox.getParameter( 'dps-gimnasio' )?.value
			const charges = infobox.getParameter( 'cargas' )?.value

			const item: typeof data[ string ] = {}
			if ( type ) item.tipo = type
			if ( power ) item.poder = power
			if ( dps ) item.dps = dps
			if ( charges ) item.cargas = charges

			data[ page.title ] = item
		}

		await bot.edit( {
			bot: true,
			summary: 'Actualizando datos de movimientos',
			text: format( data ),
			title: 'Module:Movimientos/datos'
		} )

		return {
			success: true
		}
	}

	protected async getAllMoves(): Promise<string[]> {
		return ( await this.wiki.queryProp( {
			prop: 'transcludedin',
			tilimit: 'max',
			titles: 'Plantilla:InfoboxMovimiento'
		} ) )[ 0 ]?.transcludedin.map( i => i.title ) ?? []
	}
}
