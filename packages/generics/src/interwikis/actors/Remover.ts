import type { IInterwikisAttributes } from '../models'
import { InterwikiActor } from './Actor'
import { Interwikis } from '../models'
import type { Model } from 'sequelize'

export class InterwikiRemover extends InterwikiActor {
	public async execute( { doEdit = true }: { doEdit?: boolean } ): Promise<void> {
		const nullies = await this.getNullies()

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
				const nullyInterwikis = pageNullies.map( i => {
					const lang = i.getDataValue( 'toLang' )
					const target = encodeURIComponent( i.getDataValue( 'toTitle' ).replace( / /g, '_' ) )
					return InterwikiRemover.regexify( lang, target )
				} )

				await this.removeInterwikis( {
					content,
					doEdit,
					lang,
					regexes: nullyInterwikis,
					title: page.title
				} )
			}
		}

		await Interwikis.destroy( {
			where: {
				toId: null
			}
		} )
	}

	private async getNullies(): Promise<Record<string, Array<Model<IInterwikisAttributes, IInterwikisAttributes>>>> {
		const query = await Interwikis.findAll( {
			where: {
				toId: null
			}
		} )

		return query.filter( i => this.allowedLanguages.has( i.getDataValue( 'fromLang' ) ) )
			.reduce( ( collection, item ) => {
				const lang = item.getDataValue( 'fromLang' )
				if ( lang in this.family ) {
					if ( !collection[ lang ] ) collection[ lang ] = []
					collection[ lang ]?.push( item )
				}
				return collection
			}, {} as Record<string, Array<Model<IInterwikisAttributes, IInterwikisAttributes>>> )
	}

	// eslint-disable-next-line require-await
	protected async removeInterwikis( { content, doEdit, lang, regexes, title }: { content: string, doEdit: boolean, lang: string, regexes: RegExp[], title: string } ): Promise<boolean> {
		const removed: string[] = []
		const newContent = InterwikiRemover.removeInterwikisFromText( content, regexes, removed )

		if ( removed.length === 0 ) return false

		const summary = `Removing interwikis: ${ removed.join( ', ' ) }`
		return this.edit( {
			doEdit,
			log: `Updating [[${ lang }:${ title }]]: ${ summary }`,
			summary,
			text: newContent,
			title: title
		} )
	}

	protected static removeInterwikisFromText( content: string, regexes: RegExp[], removed: string[] ): string {
		const executor = ( original: string, lang: string, target: string  ): string => {
			const text = InterwikiRemover.normalizeInterwiki( lang, target )
			const someMatch = regexes.find( r => text.match( r ) )
			if ( someMatch ) {
				regexes = regexes.filter( i => i !== someMatch )
				removed.push( original )
				return ''
			}
			return original
		}
		return content.replace( InterwikiRemover.INTERWIKI_REGEX, executor )
	}
}
