import { escapeRegex, sleep } from '../utils'
import type { FandomBot, Wiki } from 'mw.js'
import type { IInterwikisAttributes } from '../models'
import { Interwikis } from '../models'
import type { Model } from 'sequelize'
import type { WikiWithLang } from '../utils'

export class InterwikiRemover {
	private allowedLanguages: Set<string>
	private bot: FandomBot
	private family: Record<string, WikiWithLang>

	public constructor( { allowedLanguages, bot, family }: { allowedLanguages: string[], bot: FandomBot, family: Record<string, WikiWithLang> } ) {
		this.allowedLanguages = new Set( allowedLanguages )
		this.bot = bot
		this.family = family
	}

	public async execute( { doEdit = true }: { doEdit?: boolean } ): Promise<void> {
		const nullies = ( await InterwikiRemover.getNullies() )
			.filter( i => this.allowedLanguages.has( i.getDataValue( 'fromLang' ) ) )
			.reduce( ( collection, item ) => {
				const lang = item.getDataValue( 'fromLang' )
				if ( lang in this.family ) {
					if ( !collection[ lang ] ) collection[ lang ] = []
					collection[ lang ]?.push( item )
				}
				return collection
			}, {} as Record<string, Array<Model<IInterwikisAttributes, IInterwikisAttributes>>> )

		for ( const lang in nullies ) {
			const wiki = this.family[ lang ]
			const ids = nullies[ lang ]?.map( i => i.getDataValue( 'fromId' ).split( /-/g )
				.pop() ).filter( i => i !== undefined ) as string[] | undefined
			const langNullies = nullies[ lang ]
			if ( !ids || !wiki || !langNullies ) continue
			await this.bot.setWiki( wiki )

			for await ( const page of this.iterPagesById( wiki, ids ) ) {
				const content = page.revisions[ 0 ]?.slots.main.content
				if ( !content ) continue
				const pageNullies = langNullies.filter( i => {
					const fromId = i.getDataValue( 'fromId' )
					const id = fromId.split( /-/g ).pop()
					return id && id === `${ page.pageid }`
				} )
				let nullyInterwikis = pageNullies.map( i => {
					const lang = i.getDataValue( 'toLang' )
					const target = encodeURIComponent( i.getDataValue( 'toTitle' ).replace( / /g, '_' ) )
					return new RegExp( ` *${ lang } *: *${ escapeRegex( target ) }`, 'gi' )
				} )
				const regex = /\[\[([a-z-]+):(.+)(\|.*?)?\]\]/gi

				const removed: string[] = []
				const newContent = content.replace( regex, ( original: string, lang: string, target: string  ) => {
					const text = `${ lang }:${ encodeURIComponent( target.replace( / /g, '_' ) ) }`
					const someMatch = nullyInterwikis.find( r => text.match( r ) )
					if ( someMatch ) {
						nullyInterwikis = nullyInterwikis.filter( i => i !== someMatch )
						removed.push( original )
						return ''
					}
					return original
				} )

				if ( removed.length === 0 ) continue

				const summary = `Removing interwikis: ${ removed.join( ', ' ) }`
				console.log( `Updating [[${ page.title }]]: ${ summary }` )
				if ( doEdit ) {
					await this.bot.edit( {
						bot: true,
						summary,
						text: newContent,
						title: page.title
					} )
						.catch( e => {
							console.error( `An error occurred while processing ${ page.title }` )
							console.error( e )
						} )
					await sleep( 2000 )
				}
			}
		}
	}

	private static getNullies(): Promise<Array<Model<IInterwikisAttributes, IInterwikisAttributes>>> {
		return Interwikis.findAll( {
			where: {
				toId: null
			}
		} )
	}

	private async *iterPagesById( wiki: Wiki, ids: Array<string | number> ): ReturnType<Wiki[ 'iterPages' ]> {
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
