import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'

export const getFamily = async ( interwiki: string ): Promise<Record<string, FandomWiki>> => {
	const fandom = new Fandom()
	const wiki = fandom.getWiki( interwiki )

	const family: Record<string, FandomWiki> = {
		es: wiki
	}
	for ( const [
		lang, url
	] of Object.entries( await wiki.getInterwikis() ) ) {
		family[ lang ] = fandom.getWiki( Fandom.url2interwiki( url ) )
	}

	return family
}
