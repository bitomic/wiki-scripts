import path from 'path'
import { Sequelize } from 'sequelize'
import workspaceRoot from 'find-yarn-workspace-root'

const filepath = path.resolve( workspaceRoot() ?? '..', 'database.sqlite' )

export const sequelize = new Sequelize( {
	dialect: 'sqlite',
	storage: filepath
} )
