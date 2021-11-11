void ( async () => {
	const scripts = [
		'Translations', 'Items'
	]
	for ( const script of scripts ) {
		await import( `./${ script }.js` )
	}
} )()
