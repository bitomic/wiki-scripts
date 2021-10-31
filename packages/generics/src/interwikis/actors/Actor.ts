import type { FandomBot, Wiki } from 'mw.js'
import type { WikiWithLang } from '../utils'

export abstract class InterwikiActor {
	protected allowedLanguages: Set<string>
	protected bot: FandomBot
	protected family: Record<string, WikiWithLang>

	public constructor( { allowedLanguages, bot, family }: { allowedLanguages: string[], bot: FandomBot, family: Record<string, WikiWithLang> } ) {
		this.allowedLanguages = new Set( allowedLanguages )
		this.bot = bot
		this.family = family
	}

	public abstract execute( params: { doEdit?: boolean } ): Promise<void>

	protected async *iterPagesById( wiki: Wiki, ids: Array<string | number> ): ReturnType<Wiki[ 'iterPages' ]> {
		while ( ids.length !== 0 ) {
			const res = await wiki.get<{
				query: {
					pages: Array<Record<string, unknown>>
				}
			}>( {
				action: 'query',
				pageids: ids.splice( 0, 50 ).join( '|' ),
				prop: 'revisions',
				rvprop: 'content',
				rvslots: 'main'
			} )

			for ( const page of res.query.pages ) {
				if ( 'missing' in page ) {
					continue
				}

				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				yield page as any // sorry not sorry
			}
		}
	}
}
