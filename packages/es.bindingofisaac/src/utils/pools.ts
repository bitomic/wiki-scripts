import fs from 'fs-extra'
import path from 'path'
import xml from 'fast-xml-parser'

const getPools = (): ItemPoolsXML => {
	const resources = path.resolve( __dirname, '../../resources' )
	const filepath = path.resolve( resources, 'itempools.xml' )
	const file = fs.readFileSync( filepath ).toString()
	const data = xml.parse( file, {
		attributeNamePrefix: '',
		ignoreAttributes: false,
		parseAttributeValue: true
	} ) as ItemPoolsXML
	return data
}

export const pools = getPools().ItemPools.Pool.reduce( ( collection, item ) => {
	if ( Array.isArray( item.Item ) ) {
		collection[ item.Name ] = item.Item.map( i => i.Id )
	} else {
		collection[ item.Name ] = [ item.Item.Id ]
	}
	return collection
}, {} as Record<string, number[]> )
