import dotenv from 'dotenv'
import path from 'path'
import workspaceRoot from 'find-yarn-workspace-root'

const root = workspaceRoot()
if ( root ) {
	dotenv.config( {
		path: path.resolve( root, '.env' )
	} )
}

const environmentVariables = [
	'FANDOM_USERNAME',
	'FANDOM_PASSWORD'
] as const
type Env = typeof environmentVariables[ number ]

export const env = {} as Record<Env, string>
for ( const key of environmentVariables ) {
	const value = process.env[ key ]
	if ( !value ) throw new Error( `Missing environment variable: ${ key }` )
	env[ key ] = value
}
