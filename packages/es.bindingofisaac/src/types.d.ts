interface ItemsXML {
	items: {
		active: Array<{
			achievement?: number
			addcostumeonpickup?: boolean
			bombs?: number
			cache?: string
			chargetype?: string
			coins?: number
			cooldown?: number
			description: string
			devilprice?: number
			gfx: string
			hidden?: boolean
			id: number
			keys?: number
			initcharge?: number
			maxcharges: number
			name: string
			passivecache?: boolean
			persistent?: number
			shopprice?: number
			special?: boolean
			tags?: string
		}>
		familiar: Array<{
			achievement?: number
			cache?: string
			description: string
			devilprice?: number
			gfx: string
			hidden?: boolean
			id: number
			name: string
			persistent?: boolean
			tags?: string
		}>
		passive: Array<{
			achievement?: number
			addcostumeonpickup?: boolean
			blackhearts?: number
			bombs?: number
			cache?: string
			coins?: number
			cooldown?: number
			description: string
			devilprice?: number
			gfx: string
			hearts?: number
			id: number
			keys?: number
			maxcharges?: number
			maxhearts?: number
			name: string
			persistent?: boolean
			soulhearts?: number
			special?: boolean
			tags?: string
		}>
		trinket: Array<{
			achievement?: number
			addcostumeonpickup?: boolean
			cache?: string
			description: string
			gfx: string
			id: number
			name: string
			persistent?: boolean
			tags?: string
		}>
		null: Array<{
			cache?: string
			cooldown?: number
			id: number
			name: string
			persistent?: boolean
		}>
	}
}

interface ItemPoolsXML {
	ItemPools: {
		Pool: Array<{
			Name: string
			Item: Array<{
				DecreaseBy: number
				Id: number
				RemoveOn: number
				Weight: number
			}> | {
				DecreaseBy: number
				Id: number
				RemoveOn: number
				Weight: number
			}
		}>
	}
}
