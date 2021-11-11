import fs from 'fs-extra'
import type { ITranslation } from '../models'
import path from 'path'
import { Translations } from '../models'
import xml from 'fast-xml-parser'

interface TranslationsXML {
	stringtable: {
		languages: {
			language: Array<{
				id: number
				index: number
				name: string
			}>
		}
		category: Array<{
			name: string
			key: Array<{
				name: string
				string: string[]
			}>
		}>
	}
}

void ( async () => {
	await Translations.sync( { force: true } )

	const filepath = path.resolve( __dirname, '../../resources/stringtable.xml' )
	const xmlText = fs.readFileSync( filepath ).toString()
	const data = xml.parse( xmlText, {
		attributeNamePrefix: '',
		ignoreAttributes: false,
		parseAttributeValue: true
	} ) as TranslationsXML

	const languages = new Array<string>( data.stringtable.languages.language.length - 1 )
	data.stringtable.languages.language.reduce( ( languages, item ) => {
		if ( item.index !== 0 ) languages[ item.index - 1 ] = item.name
		return languages
	}, languages )

	const rows: Record<string, ITranslation> = {}
	for ( const category of data.stringtable.category ) {
		for ( const item of category.key ) {
			for ( let i = 0; i < item.string.length; i++ ) {
				const lang = languages[ i ]
				const value = item.string[ i ] ?? ''
				if ( !lang ) continue
				const row: ITranslation = {
					category: category.name,
					key: item.name,
					lang,
					value
				}
				rows[ `${ row.category }$${ row.key }$${ row.lang }` ] = row
			}
		}
	}

	await Translations.bulkCreate( Object.values( rows ) )
} )()
