import { escapeRegex, sleep } from '../utils'
import type { FandomBot, Wiki } from 'mw.js'
import type { WikiWithLang } from '../utils'

export abstract class InterwikiActor {
	protected allowedLanguages: Set<string>
	protected bot: FandomBot
	protected family: Record<string, WikiWithLang>

	protected static INTERWIKI_REGEX = /\[\[([a-z-]+):(.+)(\|.*?)?\]\]/gi

	public constructor( { allowedLanguages, bot, family }: { allowedLanguages: string[], bot: FandomBot, family: Record<string, WikiWithLang> } ) {
		this.allowedLanguages = new Set( allowedLanguages )
		this.bot = bot
		this.family = family
	}

	public abstract execute( params: { doEdit?: boolean } ): Promise<void>

	protected async edit( { doEdit, log, summary, text, title, type = 'text', usePageid = false }: { doEdit: boolean, log: string, summary: string, text: string, title: string, type?: 'text' | 'appendtext', usePageid?: boolean } ): Promise<boolean> {
		console.log( log )
		if ( doEdit ) {
			// @ts-expect-error - faulty typings
			const result = await this.bot.edit( {
				bot: true,
				nocreate: true,
				summary,
				[ usePageid ? 'pageid' : 'title' ]: title,
				[ type ]: text
			} )
				.then( () => true )
				.catch( e => {
					console.error( `An error occurred while processing ${ title }` )
					console.error( e )
					return false
				} )
			await sleep( 2000 )
			return result
		}
		return false
	}

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

	protected static getDataFromId( id: string ): [ string, string ] {
		const arr = id.split( /-/g )
		const pageid = arr.pop() ?? ''
		const lang = arr.join( '-' )
		return [
			lang, pageid
		]
	}

	protected static normalizeInterwiki( lang: string, target: string ): string {
		return `${ lang }:${ encodeURIComponent( target.replace( / /g, '_' ) ) }`
	}

	protected static regexify( lang: string, title: string ): RegExp {
		const target = encodeURIComponent( title.replace( / /g, '_' ) )
		return new RegExp( ` *${ lang } *: *${ escapeRegex( target ) }`, 'gi' )
	}
}
