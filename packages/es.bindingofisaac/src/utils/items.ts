import fs from 'fs-extra'
import path from 'path'
import xml from 'fast-xml-parser'

const getItems = (): ItemsXML => {
	const resources = path.resolve( __dirname, '../../resources' )
	const filepath = path.resolve( resources, 'items.xml' )
	const file = fs.readFileSync( filepath ).toString()
	const data = xml.parse( file, {
		attributeNamePrefix: '',
		ignoreAttributes: false,
		parseAttributeValue: true
	} ) as ItemsXML
	return {
		items: {
			active: data.items.active,
			familiar: data.items.familiar,
			null: data.items.null,
			passive: data.items.passive,
			trinket: data.items.trinket
		}
	} as ItemsXML
}

export const { items } = getItems()
