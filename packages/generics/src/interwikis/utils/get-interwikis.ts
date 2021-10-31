import type { IInterwikisAttributes, IPagesAttributes } from '../models'
import { Interwikis, Pages } from '../models'
import type { WikiWithLang } from './get-family'

interface IMediaWikiResponseLanglinks {
	continue?: {
		gapcontinue?: string
		llcontinue?: string
	}
	query: {
		pages: Array<{
			langlinks?: Array<{
				lang: string
				title: string
			}>
			pageid: number
			title: string
		}>
	}
}

interface IMediaWikiRequestLanglinks {
	action: 'query'
	gapcontinue?: string | undefined
	//gapfilterlanglinks: 'withlanglinks'
	gaplimit: 'max'
	generator: 'allpages'
	llcontinue?: string | undefined
	lllimit: 'max'
	prop: 'langlinks'
}

export const getInterwikis = async ( wiki: WikiWithLang ): Promise<void> => {
	const params: IMediaWikiRequestLanglinks = {
		action: 'query',
		//gapfilterlanglinks: 'withlanglinks',
		gaplimit: 'max',
		generator: 'allpages',
		lllimit: 'max',
		prop: 'langlinks'
	}

	const pagesrows: Record<string, IPagesAttributes> = {}
	const interwikisrows: IInterwikisAttributes[] = []

	// eslint-disable-next-line no-constant-condition, @typescript-eslint/no-unnecessary-condition
	while ( true ) {
		const req = await wiki.get<IMediaWikiResponseLanglinks, IMediaWikiRequestLanglinks>( params )
		const res = req.query.pages
		for ( const page of res ) {
			const id = `${ wiki.lang }-${ page.pageid }`
			if ( !pagesrows[ page.pageid ] ) {
				pagesrows[ page.pageid ] = {
					id,
					lang: wiki.lang,
					title: page.title
				}
			}
			if ( !page.langlinks ) continue
			for ( const langlink of page.langlinks ) {
				interwikisrows.push( {
					fromId: id,
					fromLang: wiki.lang,
					toLang: langlink.lang,
					toTitle: langlink.title
				} )
			}
		}

		if ( !req.continue ) break
		if ( req.continue.gapcontinue ) params.gapcontinue = req.continue.gapcontinue
		if ( req.continue.llcontinue ) params.llcontinue = req.continue.llcontinue
	}

	await Pages.bulkCreate( Object.values( pagesrows ) )
	await Interwikis.bulkCreate( interwikisrows )
}
