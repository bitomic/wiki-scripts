import { Op, QueryTypes } from 'sequelize'
import { InterwikiRemover } from './Remover'
import { Interwikis } from '../models'
import { sequelize } from '../lib'

interface IAmbiguous {
	fromIds: string
	fromLang: string
	rowIds: string
	toId: string
	toLang: string
	toTitle: string
}

export class InterwikiBreaker extends InterwikiRemover {
	protected override SUMMARY_HEADER = 'Removing ambiguous interwikis'

	public override async execute( { doEdit = true }: { doEdit?: boolean } ): Promise<void> {
		const ambiguous = await this.getAmbiguous()

		for ( const lang in ambiguous ) {
			const wiki = this.family[ lang ]
			const ids = ambiguous[ lang ]
				?.map( i => i.fromIds
					.split( /\|/g )
					.map( i => i.split( /-/g ).pop() ) )
				.flat()
				.filter( i => i !== undefined ) as string[] | undefined
			const langAmbiguous = ambiguous[ lang ]
			if ( !ids || !wiki || !langAmbiguous ) continue
			await this.bot.setWiki( wiki )

			for await ( const page of this.iterPagesById( wiki, ids ) ) {
				const content = page.revisions[ 0 ]?.slots.main.content
				if ( !content ) continue
				const pageambiguous = langAmbiguous.filter( i => {
					const ids = i.fromIds
						.split( /\|/g )
						.map( i => i.split( /-/g ).pop() )
						.filter( i => i !== undefined ) as string[]
					return ids.includes( `${ page.pageid }` )
				} )
				const ambiguousInterwikis = pageambiguous.map( i => InterwikiBreaker.regexify( i.toLang, i.toTitle ) )

				await this.removeInterwikis( {
					content,
					doEdit,
					lang,
					regexes: ambiguousInterwikis,
					title: page.title
				} )
			}
		}

		if ( doEdit ) {
			const removeIds = Object.values( ambiguous )
				.map( i => i.map( j => j.rowIds.split( /\|/g ) ) )
				.flat( 2 )
				.map( id => ( { id } ) )
			await Interwikis.destroy( {
				where: {
					[ Op.or ]: removeIds
				}
			} )
		}
	}

	private async getAmbiguous(): Promise<Record<string, IAmbiguous[]>> {
		const sql = 'SELECT GROUP_CONCAT( id, \'|\' ) AS rowIds, GROUP_CONCAT( fromId, \'|\' ) AS fromIds, fromLang, toId, toLang, toTitle FROM Interwikis GROUP BY fromLang, toId HAVING COUNT(1) > 1;'
		const query = await sequelize.query<IAmbiguous>( sql, {
			type: QueryTypes.SELECT
		} )

		return query.filter( i => this.allowedLanguages.has( i.fromLang ) )
			.reduce( ( collection, item ) => {
				const lang = item.fromLang
				if ( lang in this.family ) {
					if ( !collection[ lang ] ) collection[ lang ] = []
					collection[ lang ]?.push( item )
				}
				return collection
			}, {} as Record<string, IAmbiguous[]> )
	}
}
