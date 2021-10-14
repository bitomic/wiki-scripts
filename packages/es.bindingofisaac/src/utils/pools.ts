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

export const pools = getPools().ItemPools.Pool
