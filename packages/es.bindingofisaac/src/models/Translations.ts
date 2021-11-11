import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from 'shared'

interface ITranslation {
	key: string
	lang: string
	value: string
}

interface ITranslationInterface extends Model<ITranslation, ITranslation>, ITranslation {
}

export const Translations = sequelize.define<ITranslationInterface>(
	'Translations',
	{
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
