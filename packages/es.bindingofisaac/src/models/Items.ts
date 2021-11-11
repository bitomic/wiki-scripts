import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from 'shared'

export interface IItem {
	achievement?: number
	descriptionTag: string
	id: string
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
		descriptionTag: DataTypes.STRING,
		id: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		nameTag: DataTypes.STRING,
		type: DataTypes.STRING
	},
	{
		tableName: 'Items'
	}
)
