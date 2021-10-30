import { DataTypes } from 'sequelize'
import type { ModelDefined } from 'sequelize'
import { sequelize } from '../lib'

export interface IInterwikisAttributes {
	fromId: string
	toId?: string
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
		type: DataTypes.STRING
	},
	toId: {
		allowNull: true,
		references: {
			key: 'id',
			model: 'Pages'
		},
		type: DataTypes.STRING
	},
	toLang: {
		type: DataTypes.STRING
	},
	toTitle: {
		type: DataTypes.STRING
	}
} )
