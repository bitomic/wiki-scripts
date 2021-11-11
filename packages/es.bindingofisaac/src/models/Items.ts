import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from 'shared'

export interface IItem {
	achievement?: number
	descriptionTag: string
	id: number
	nameTag: string
	type: 'active' | 'passive' | 'familiar' | 'trinket'
}

export interface IItemInterface extends Model<IItem, IItem>, IItem {
}

export const Items = sequelize.define<IItemInterface>(
	'Items',
	{
		achievement: {
			allowNull: true,
			type: DataTypes.INTEGER
		},
		descriptionTag: {
			references: {
				key: 'key',
				model: 'Translations'
			},
			type: DataTypes.STRING
		},
		id: {
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		nameTag: {
			references: {
				key: 'key',
				model: 'Translations'
			},
			type: DataTypes.STRING
		},
		type: DataTypes.STRING
	},
	{
		tableName: 'Items'
	}
)
