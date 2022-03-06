import { env } from '@wiki-scripts/shared'
import { Fandom } from 'mw.js'
import type { FandomBot } from 'mw.js'
import path from 'path'

export interface ConsumerOptions {
	name: string
}

export interface ConsumerResult {
	message?: string
	success: boolean
}

export abstract class Consumer {
	protected readonly fandom: Fandom
	public readonly name: string

	public constructor( options: ConsumerOptions ) {
		this.fandom = new Fandom( {
			cookies: path.resolve( __dirname, '../../../cookies.json' )
		} )
		this.name = options.name
	}

	public abstract run( message: unknown ): ConsumerResult | Promise<ConsumerResult>

	protected getFandomBot(): Promise<FandomBot> {
		return this.fandom.login( {
			password: env.FANDOM_PASSWORD,
			username: env.FANDOM_USERNAME
		} )
	}
}
