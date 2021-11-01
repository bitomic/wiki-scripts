import 'shared'
import { fillInterwikisIds, getFamily, getInterwikis } from './utils'
import { InterwikiActor, InterwikiDeduper, InterwikiRemover, InterwikiSyncer } from './actors'
import { Interwikis, Pages } from './models'
import { Fandom } from 'mw.js'
import fs from 'fs-extra'
import path from 'path'
import prompts from 'prompts'

void ( async () => {
	const { FANDOM_PASSWORD, FANDOM_USERNAME } = process.env
	if ( !FANDOM_PASSWORD || !FANDOM_USERNAME ) {
		console.error( 'You haven\'t set a fandom username and/or password in your environment variables.' )
		return
	}

	const interwiki = ( await prompts( [
		{
			message: 'Enter an interwiki',
			name: 'interwiki',
			type: 'text',
			validate: ( i: string ) => i.match( /^[a-z0-9-.]+$/ )
		}
	] ) ).interwiki as string
	const family = await getFamily( interwiki );

	const allowedLanguages = ( await prompts( [
		{
			format: ( val: string ) => val.split( /,/g ).map( i => i.trim() ),
			message: 'What languages in the family is the bot allowed to edit? (separate by commas)',
			name: 'languages',
			type: 'text',
			validate: ( val: string ) => {
				const langs = val.split( /,/g ).map( i => i.trim() )
				return !langs.some( lang => !family[ lang ] )
			}
		}
	] ) ).languages as string[]

	const dbpath = path.resolve( __dirname, '../../database/interwikis.sqlite' )
	const dbexists = fs.existsSync( dbpath )
	const refresh = dbexists
		? ( await prompts( [
			{
				message: 'Do you want to refresh the databases?',
				name: 'refresh',
				type: 'confirm'
			}
		] ) ).refresh as boolean
		: true
	if ( refresh ) {
		await Interwikis.sync( { force: true } )
		await Pages.sync( { force: true } )

		for ( const wiki of Object.values( family ) ) {
			console.time( wiki.lang )
			await getInterwikis( wiki )
			console.timeEnd( wiki.lang )
		}
		await fillInterwikisIds()
	}

	const fandom = new Fandom()
	const bot = await fandom.login( {
		password: FANDOM_PASSWORD,
		username: FANDOM_USERNAME,
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		wiki: Object.values( family )[ 0 ]!
	} )

	const simulation = ( await prompts( [
		{
			message: 'Do you want to use simulation mode?',
			name: 'simulation',
			type: 'confirm'
		}
	] ) ).simulation as boolean

	const actors = [ InterwikiRemover, InterwikiDeduper, InterwikiSyncer ]
	const actorOptions: ConstructorParameters<typeof InterwikiActor>[ 0 ] = {
		allowedLanguages,
		bot,
		family
	}
	const executorOptions: Parameters<InterwikiActor[ 'execute' ]>[ 0 ] = {
		doEdit: !simulation
	}

	for ( const actorCtor of actors ) {
		const actor = new actorCtor( actorOptions )
		await actor.execute( executorOptions )
	}
} )()
