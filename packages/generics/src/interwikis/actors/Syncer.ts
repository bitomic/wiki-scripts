import type { FandomWiki } from 'mw.js'
import { fillInterwikisIds } from '../utils'
import type { IInterwikisAttributes } from '../models'
import { InterwikiActor } from './Actor'
import { Interwikis } from '../models'
import { QueryTypes } from 'sequelize'
import { sequelize } from '../lib'

interface IItem {
	fromId: string
	fromLang: string
	fromTitle: string
	interwikis: string
}

export class InterwikiSyncer extends InterwikiActor {
	public async execute( { doEdit = true }: { doEdit?: boolean } ): Promise<void> {
		const missings = await this.getMissings()
		const rows: IInterwikisAttributes[] = []

		for ( const lang in missings ) {
			const wiki = this.family[ lang ]
			const langMissings = missings[ lang ]
			if ( !wiki || !langMissings ) continue
			await this.bot.setWiki( wiki )
			const redirects = await InterwikiSyncer.getAllRedirects( wiki )

			for ( const item of langMissings ) {
				const pageid = item.fromId.split( /-/ ).pop()
				if ( !pageid || redirects.has( pageid ) ) continue
				const interwikis = item.interwikis
					.split( /\|/g )
					.map( i => `[[${ i }]]` )

				for ( const interwiki of interwikis ) {
					rows.push( {
						fromId: `${ lang }-${ pageid }`,
						fromLang: lang,
						toLang: interwiki.substr( 2, interwiki.indexOf( ':' ) - 2 ),
						toTitle: interwiki.substr( 5, interwiki.length - 7 )
					} )
				}

				const summary = `Adding interwikis: ${ interwikis.join( ', ' ) }`
				await this.edit( {
					doEdit,
					log: `Updating [[${ item.fromLang }:${ item.fromTitle }]]: ${ summary }`,
					summary,
					text: `\n${ interwikis.join( '\n' ) }`,
					title: `${ pageid }`,
					type: 'appendtext',
					usePageid: true
				} )
			}
		}
		if ( doEdit ) {
			await Interwikis.bulkCreate( rows )
			await fillInterwikisIds()
		}
	}

	private async getMissings(): Promise<Record<string, IItem[]>> {
		const sql = 'SELECT toId AS fromId, toLang AS fromLang, toTitle AS fromTitle, GROUP_CONCAT( p.lang || \':\' || p.title, \'|\' ) AS interwikis FROM Interwikis INNER JOIN ( SELECT id FROM Interwikis EXCEPT SELECT i1.id FROM Interwikis AS i1 INNER JOIN Interwikis AS i2 ON i1.toId = i2.fromId AND i1.fromId = i2.toId ) AS ids ON Interwikis.id = ids.id INNER JOIN Pages AS p ON p.id = fromId WHERE toId != \'\' GROUP BY toId;'
		const query = await sequelize.query<IItem>( sql, {
			type: QueryTypes.SELECT
		} )
		console.log( query.filter( i => this.allowedLanguages.has( i.fromLang ) ).length )

		return query.filter( i => this.allowedLanguages.has( i.fromLang ) )
			.reduce( ( collection, item ) => {
				const lang = item.fromLang
				if ( lang in this.family ) {
					if ( !collection[ lang ] ) collection[ lang ] = []
					collection[ lang ]?.push( item )
				}
				return collection
			}, {} as Record<string, IItem[]> )
	}

	public static async getAllRedirects( wiki: FandomWiki ): Promise<Set<string>> {
		const titles = ( await wiki.query( {
			arlimit: 'max',
			arprop: 'ids',
			// @ts-expect-error - yes
			list: 'allredirects'
			// @ts-expect-error - yes
		} ) ).map( i => `${ i.fromid }` )
		return new Set( titles )
	}
}
