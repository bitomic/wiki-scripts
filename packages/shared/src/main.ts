import dotenv from 'dotenv'
import path from 'path'
import workspaceRoot from 'find-yarn-workspace-root'

const root = workspaceRoot()
if ( root ) {
	dotenv.config( {
		path: path.resolve( root, '.env' )
	} )
}
