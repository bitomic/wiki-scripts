import type { ModelDefined, Optional } from 'sequelize'
import { DataTypes } from 'sequelize'
import { sequelize } from '../lib'

export interface IPagesAttributes {
	id: number
	lang: string
	title: string
}

type IPagesCreationAttributes = Optional<IPagesAttributes, 'id'>

export const Pages: ModelDefined<IPagesAttributes, IPagesCreationAttributes> = sequelize.define( 'Pages', {
	id: {
		primaryKey: true,
		type: DataTypes.STRING
	},
	lang: {
		type: DataTypes.STRING
	},
	title: {
		type: DataTypes.STRING
	}
} )

