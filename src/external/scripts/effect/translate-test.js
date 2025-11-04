const translate = importPlugin('translate')

const translated = await translate({ text: '저렴하게 잘 샀어요~♡', source: 'en', target: 'ko' })

await log('translated: ', translated)
