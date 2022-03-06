import type { Consumer } from './Consumer'
import fs from 'fs'
import path from 'path'

export class Store {
	protected readonly collection = new Map<string, Consumer>()
	protected readonly path: string

	public constructor( dirname: string ) {
		this.path = path.resolve( dirname, 'consumers' )
	}

	public get( key: string ): Consumer | undefined {
		return this.collection.get( key )
	}

	public async load(): Promise<void> {
		await this.loadDirectory( this.path )
	}

	private async loadDirectory( dirpath: string ): Promise<void> {
		for ( const name of fs.readdirSync( dirpath ) ) {
			const filepath = path.resolve( dirpath, name )
			const lstat = fs.lstatSync( filepath )
			if ( lstat.isFile() ) {
				if ( !name.endsWith( '.js' ) ) continue
				await this.loadFile( filepath )
			} else if ( lstat.isDirectory() ) {
				await this.loadDirectory( filepath )
			}
		}
	}

	private async loadFile( filepath: string ): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const [ consumerCtor ] = Object.values( await import( filepath ) ) as [ typeof Consumer ]
		// @ts-expect-error - trust me, it is a consumer constructor
		const consumer: AMQPConsumer = new consumerCtor() //eslint-disable-line @typescript-eslint/no-unsafe-assignment
		this.collection.set( consumer.name, consumer ) //eslint-disable-line @typescript-eslint/no-unsafe-member-access
	}
}
