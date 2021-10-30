import { DataTypes } from 'sequelize'
import type { ModelDefined } from 'sequelize'
import { sequelize } from '../lib'

interface IInterwikisAttributes {
	id1: number
	id2: number
}

type IInterwikisCreationAttributes = IInterwikisAttributes

export const Interwikis: ModelDefined<IInterwikisAttributes, IInterwikisCreationAttributes> = sequelize.define( 'Interwikis', {
	id1: {
		references: {
			key: 'id',
			model: 'Pages'
		},
		type: DataTypes.INTEGER
	},
	id2: {
		references: {
			key: 'id',
			model: 'Pages'
		},
		type: DataTypes.INTEGER
	}
} )
