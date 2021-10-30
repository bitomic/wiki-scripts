import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'

export type WikiWithLang = FandomWiki & { lang: string }

export const getFamily = async ( interwiki: string ): Promise<Record<string, WikiWithLang>> => {
	const fandom = new Fandom()
	const wiki = fandom.getWiki( interwiki ) as WikiWithLang
	wiki.lang = 'es'

	const family: Record<string, WikiWithLang> = {
		es: wiki
	}
	for ( const [
		lang, url
	] of Object.entries( await wiki.getInterwikis() ) ) {
		const interwiki = fandom.getWiki( Fandom.url2interwiki( url ) )
		interwiki.lang = lang
		family[ lang ] = interwiki as WikiWithLang
	}

	return family
}
