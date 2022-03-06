import { load } from 'ts-dotenv'
import path from 'path'

export const env = load(
	{
		FANDOM_PASSWORD: String,
		FANDOM_USERNAME: String
	},
	path.resolve( __dirname, '../../../.env' )
)
