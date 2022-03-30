import { format, parse as luaParse } from 'lua-json'
import { Consumer } from '@wiki-scripts/core'
import type { ConsumerResult } from '@wiki-scripts/core'
import type { FandomWiki } from 'mw.js'
import type { HTMLElement } from 'node-html-parser'
import { parse as htmlParse } from 'node-html-parser'
import { request } from 'undici'

interface INewsItem {
	date: string
	description: string
	image: string
	title: string
	url: string
}

type ILuaNewsItem = Omit<INewsItem, 'image'> & { id: number }

export class PrefixesConsumer extends Consumer {
	public readonly UNITE_URL = 'https://unite.pokemon.com/es-mx/news/'
	public readonly MONTHS: string[] = []
	protected readonly wiki: FandomWiki

	public constructor() {
		super( {
			name: 'news'
		} )
		this.wiki = this.fandom.getWiki( 'es.pokemon-unite' )
		const intl = new Intl.DateTimeFormat( 'es', { month: 'long' } )
		for ( let i = 0; i < 12; i++ ) {
			this.MONTHS.push( intl.format( new Date( 2022, i, 15 ) ) )
		}
	}

	public async run(): Promise<ConsumerResult> {
		const bot = await this.getFandomBot()
		await bot.setWiki( this.wiki )

		const news = await this.getOfficialNews()
		const wikiNews = await this.getWikiNews()

		const [ lastWikiNews ] = wikiNews
		if ( !lastWikiNews ) {
			console.error( 'Couldn\'t retrieve the last news item in the wiki.' )
			return { success: false }
		}

		const lastPostedIndex = news.findIndex( i => i.url === lastWikiNews.url )
		if ( lastPostedIndex === 0 ) {
			console.info( 'News list is already up to date.' )
			return { success: true }
		}

		const items = news.map( ( value, index ) => ( {
			...value,
			id: lastWikiNews.id + lastPostedIndex - index
		} ) ).slice( 0, 3 )

		for ( const item of items ) {
			if ( item.id <= lastWikiNews.id ) continue

			await bot.upload( {
				filename: `Noticia ${ item.id }.jpg`,
				ignorewarnings: true,
				url: item.image
			} )
				.catch( e => {
					console.error( `Couldn't update an image for news with id ${ item.id }.` )
					console.error( e )
				} )
		}

		const newsData = items.map( ( { date, description, id, title, url } ) => ( {
			date, description, id, title, url
		} ) )

		await bot.edit( {
			bot: true,
			text: format( newsData ),
			title: 'Module:Noticias/datos'
		} )

		return {
			success: true
		}
	}

	public async getOfficialNews(): Promise<INewsItem[]> {
		const { body } = await request( this.UNITE_URL, {
			headers: {
				'User-Agent': 'unite/1.0'
			}
		} )
		const res = await body.text()
		const dom = htmlParse( res )

		const news: INewsItem[] = []
		const mainNewsItem = this.getMainNews( dom )
		if ( mainNewsItem ) news.push( mainNewsItem )

		const newsCards = dom.querySelectorAll( '.news-card' )
		for ( const newsCard of newsCards ) {
			const newsItem = this.getNewsItem( newsCard )
			if ( newsItem ) news.push( newsItem )
		}

		return news
	}

	public getMainNews( dom: HTMLElement ): INewsItem | null {
		const item = dom.querySelector( '.main-header' )
		if ( !item ) return null
		const date = item.querySelector( '.news-date-tag' )?.innerText
		const title = item.querySelector( 'h2' )?.innerText
		const img = item.querySelector( 'img' )?.attributes.src
		const description = item.querySelector( 'p:not(.news-date-tag)' )?.innerText
		const link = item.querySelector( 'a.button' )?.attributes.href
		if ( !date || !title || !img || !description || !link ) return null
		return {
			date: this.resolveDate( date ),
			description,
			image: this.resolveUrl( img ),
			title,
			url: this.resolveUrl( link )
		}
	}

	public getNewsItem( item: HTMLElement ): INewsItem | null {
		const date = item.querySelector( '.news-date-tag' )?.innerText
		const title = item.querySelector( '.news-card__title' )?.innerText
		const img = item.querySelector( 'img' )?.attributes.src
		const description = item.querySelector( '.news-card__excerpt' )?.innerText
		const link = item.querySelector( '.news-card__title' )?.attributes.href
		if ( !date || !title || !img || !description || !link ) return null
		return {
			date: this.resolveDate( date ),
			description,
			image: this.resolveUrl( img ),
			title,
			url: this.resolveUrl( link )
		}
	}

	public resolveDate( date: string ): string {
		const [
			day, monthName, year
		] = date.split( ' de ' ) as [ string, string, string ]
		const month = this.MONTHS.indexOf( monthName )
		return new Date( parseInt( year, 10 ), month, parseInt( day, 10 ), 0, 0, 0, 0 ).toISOString()
	}

	public resolveUrl( path: string ): string {
		return new URL( path, this.UNITE_URL ).href
	}

	public async getWikiNews(): Promise<ILuaNewsItem[]> {
		const news = await this.wiki.getPages( 'Module:Noticias/datos' )
		return luaParse( news ) as ILuaNewsItem[]
	}
}
