import fs from 'fs-extra'
import type { IItem } from '../models'
import { Items } from '../models'
import path from 'path'
import xml from 'fast-xml-parser'

interface ItemsXML {
	items: {
		active: Array<{
			achievement?: number
			addcostumeonpickup?: boolean
			bombs?: number
			cache?: string
			chargetype?: string
			coins?: number
			cooldown?: number
			description: string
			devilprice?: number
			gfx: string
			hidden?: boolean
			id: number
			keys?: number
			initcharge?: number
			maxcharges: number
			name: string
			passivecache?: boolean
			persistent?: number
			shopprice?: number
			special?: boolean
			tags?: string
		}>
		familiar: Array<{
			achievement?: number
			cache?: string
			description: string
			devilprice?: number
			gfx: string
			hidden?: boolean
			id: number
			name: string
			persistent?: boolean
			tags?: string
		}>
		passive: Array<{
			achievement?: number
			addcostumeonpickup?: boolean
			blackhearts?: number
			bombs?: number
			cache?: string
			coins?: number
			cooldown?: number
			description: string
			devilprice?: number
			gfx: string
			hearts?: number
			id: number
			keys?: number
			maxcharges?: number
			maxhearts?: number
			name: string
			persistent?: boolean
			soulhearts?: number
			special?: boolean
			tags?: string
		}>
		trinket: Array<{
			achievement?: number
			addcostumeonpickup?: boolean
			cache?: string
			description: string
			gfx: string
			id: number
			name: string
			persistent?: boolean
			tags?: string
		}>
		null: Array<{
			cache?: string
			cooldown?: number
			id: number
			name: string
			persistent?: boolean
		}>
	}
}

void ( async () => {
	await Items.sync( { force: true } )

	const filepath = path.resolve( __dirname, '../../resources/items.xml' )
	const xmlText = fs.readFileSync( filepath ).toString()
	const data = xml.parse( xmlText, {
		attributeNamePrefix: '',
		ignoreAttributes: false,
		parseAttributeValue: true
	} ) as ItemsXML

	const rows: IItem[] = []
	const itemTypes: Array<keyof typeof data[ 'items' ]> = [
		'active', 'familiar', 'passive', 'trinket'
	]
	for ( const itemType of itemTypes ) {
		if ( itemType === 'null' ) continue
		const items = data.items[ itemType ]
		for ( const item of items ) {
			if ( !( 'description' in item ) ) continue
			const row: IItem = {
				descriptionTag: item.description,
				id: `${ itemType.substr( 0, 1 ) }-${ item.id }`,
				nameTag: item.name,
				type: itemType
			}
			if ( item.achievement ) row.achievement = item.achievement
			rows.push( row )
		}
	}

	await Items.bulkCreate( rows )
} )()
