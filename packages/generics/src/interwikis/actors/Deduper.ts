import { Op, QueryTypes } from 'sequelize'
import { InterwikiRemover } from './Remover'
import { Interwikis } from '../models'
import { sequelize } from '../lib'

interface IDupe {
	count: number
	fromId: string
	fromLang: string
	fromTitles: string
	toId: string
	toLang: string
	toTitle: string
}

export class InterwikiDeduper extends InterwikiRemover {
	protected override SUMMARY_HEADER = 'Removing duplicated interwikis'

	public override async execute( { doEdit = true }: { doEdit?: boolean } ): Promise<void> {
		const dupes = await this.getDupes()

		for ( const lang in dupes ) {
			const wiki = this.family[ lang ]
			const titles = dupes[ lang ]?.map( i => i.fromTitles.split( /\|/g ) ).flat()
			const langDupes = dupes[ lang ]
			if ( !titles || !wiki || !langDupes ) continue
			await this.bot.setWiki( wiki )

			for await ( const page of wiki.iterPages( titles ) ) {
				const content = page.revisions[ 0 ]?.slots.main.content
				if ( !content ) continue
				const pageDupes = langDupes.filter( i => {
					const title = i.fromTitles.split( /\|/g )
					return title.includes( page.title )
				} )
				const dupeInterwikis = pageDupes.map( i => InterwikiDeduper.regexify( i.toLang, i.toTitle ) )
				await this.removeInterwikis( {
					content,
					doEdit,
					lang,
					regexes: dupeInterwikis,
					title: page.title
				} )
			}
		}

		if ( doEdit ) {
			const removeIds = Object.values( dupes ).map( i => i.map( j => ( { fromId: j.fromId, toId: j.toId } ) ) )
				.flat()
			await Interwikis.destroy( {
				where: {
					[ Op.or ]: removeIds
				}
			} )
		}
	}

	private async getDupes(): Promise<Record<string, IDupe[]>> {
		const sql = 'SELECT COUNT(1) AS count, i.fromId, i.fromLang, GROUP_CONCAT( p.title, \'|\' ) AS fromTitles, i.toId, i.toLang, i.toTitle FROM Interwikis AS i INNER JOIN Pages AS p ON p.id = i.fromId WHERE i.toId != \'\' GROUP BY toId, fromLang, toLang HAVING COUNT(1) > 1;'
		const query = await sequelize.query<IDupe>( sql, {
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
			}, {} as Record<string, IDupe[]> )
	}
}
