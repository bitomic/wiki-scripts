import 'shared'
import { Fandom } from 'mw.js'
import { parse } from 'mwparser'

void ( async () => {
	const sleep = ( ms: number ): Promise<never> => new Promise( r => { setTimeout( r, ms ) } )
	const { FANDOM_PASSWORD, FANDOM_USERNAME } = process.env
	if ( !FANDOM_PASSWORD || !FANDOM_USERNAME ) {
		console.error( 'You haven\'t set a fandom username and/or password in your environment variables.' )
		return
	}

	const fandom = new Fandom()
	const wiki = fandom.getWiki( 'es.genshin-impact' )
	const infoboxes = ( await wiki.query( {
		cmlimit: 'max',
		cmtitle: 'Category:Infoboxes',
		list: 'categorymembers'
	} ) ).map( i => i.title )

	const bot = await fandom.login( {
		password: FANDOM_PASSWORD,
		username: FANDOM_USERNAME,
		wiki
	} )

	for ( const infobox of infoboxes ) {
		let transclusions: string[]
		try {
			transclusions = await wiki.getTransclusions( infobox )
		} catch {
			console.log( `Skipping ${ infobox }` )
			continue
		}
		const [
			_, infoboxName
		] = infobox.split( ':' )
		if ( !infoboxName ) continue
		for await ( const page of wiki.iterPages( transclusions ) ) {
			console.log( [
				infoboxName, page.title
			] )
			const content = page.revisions[ 0 ]?.slots.main.content
			if ( !content ) continue
			const parsed = parse( content )
			const [ template ] = parsed.findTemplate( infoboxName ).nodes
			if ( !template ) continue
			const oldTemplate = `${ template }`
			template.prettify()
			if ( `${ template }` === oldTemplate ) continue
			await bot.edit( {
				bot: true,
				minor: true,
				summary: 'prettify infoboxes',
				text: `${ parsed }`,
				title: page.title
			} )
			await sleep( 2000 )
		}
	}
} )()
