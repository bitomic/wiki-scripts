import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from 'shared'

export interface ITranslation {
	category: string
	key: string
	lang: string
	value: string
}

export interface ITranslationInterface extends Model<ITranslation, ITranslation>, ITranslation {
}

export const Translations = sequelize.define<ITranslationInterface>(
	'Translations',
	{
		category: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		key: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		lang: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		value: DataTypes.STRING
	},
	{
		tableName: 'Translations'
	}
)
