import { sequelize } from '../lib'

export const fillInterwikisIds = async (): Promise<void> => {
	await sequelize.query( 'UPDATE Interwikis SET toId = p.id FROM ( SELECT id, lang, title FROM Pages ) AS p WHERE Interwikis.toLang = p.lang AND Interwikis.toTitle = p.title' )
}
