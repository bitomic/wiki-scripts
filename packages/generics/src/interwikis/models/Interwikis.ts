import { DataTypes } from 'sequelize'
import type { ModelDefined } from 'sequelize'
import { sequelize } from '../lib'

export interface IInterwikisAttributes {
	fromId: number
	toId?: number
	toLang: string
	toTitle: string
}

type IInterwikisCreationAttributes = IInterwikisAttributes

export const Interwikis: ModelDefined<IInterwikisAttributes, IInterwikisCreationAttributes> = sequelize.define( 'Interwikis', {
	fromId: {
		references: {
			key: 'id',
			model: 'Pages'
		},
		type: DataTypes.INTEGER
	},
	toId: {
		allowNull: true,
		references: {
			key: 'id',
			model: 'Pages'
		},
		type: DataTypes.INTEGER
	},
	toLang: {
		type: DataTypes.STRING
	},
	toTitle: {
		type: DataTypes.STRING
	}
} )
