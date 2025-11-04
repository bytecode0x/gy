/// <reference path="../../../product.d.ts" />

const translate = importPlugin('translate')

const product = {}

for (const [_, branch] of edward.trim(tree, '')) {
  for (const [_, sequence] of edward.generateSequence(branch)) {
    const { name, brand, descriptions, brand_en, name_en, descriptions_en, specifications, specifications_en } =
      await consume({
        $action: {
          template: 'DEFINE',
          id: '',
          name: 'images_for_shopee',
          schema: '',
          state: 'WATING',
          /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Define['schema'] } */
          value: {
            confirm: '$<json|parse|true>',
            title: 'assert the values',
            record: {
              // id: sequence['id'],
              name: neo.stringify(sequence['name']),
              brand: neo.stringify(sequence['brand']),
              specifications: '',
              name_en: await translate({ text: neo.stringify(sequence['name']), source: 'ko', target: 'en' }),
              brand_en: sequence['brand_en']
                ? neo.stringify(sequence['brand_en'])
                : await translate({ text: neo.stringify(sequence['name']), source: 'ko', target: 'en' }),
              specifications_en: '',
              // rating: sequence['rating'],
              // scraped_at: sequence['scraped_at'],
              // main_images: sequence['main_images'],
              // descriptive_images: sequence['descriptive_images'],
              // review_images: sequence['review_images'],
              descriptions: neo.stringify(sequence['descriptions']),
              descriptions_en: await translate({
                text: neo.stringify(sequence['descriptions']),
                source: 'ko',
                target: 'en'
              })
              // price: sequence['price'],
              // price_unit: sequence['price_unit'],
              // platform: sequence['platform'],
              // url: sequence['url'],
              // category: sequence['category'],
              // attributes: sequence['attributes'],
              // reviews: sequence['reviews']
            }
          }
        }
      })

    Object.assign(
      product,
      /** @type { Product } */
      {
        id: neo.stringify(sequence['id']),
        name,
        brand,
        specifications,
        name_en,
        brand_en,
        specifications_en,
        rating: parseFloat(neo.stringify(sequence['rating'])),
        scraped_at: neo.stringify(sequence['scraped_at']),
        main_images: sequence['main_images'].flat(),
        descriptive_images: sequence['descriptive_images'].flat(),
        // review_images: sequence['review_images'].flat(),
        descriptions,
        descriptions_en,
        price: parseFloat(neo.stringify(sequence['price'])),
        price_unit: neo.stringify(sequence['price_unit']),
        platform: neo.stringify(sequence['platform']),
        url: neo.stringify(sequence['url']),
        category: neo.stringify(sequence['category']),
        attributes: neo.fromMatrix(sequence['attributes']),
        reviews: neo.fromMatrix(sequence['reviews'])
      }
    )

    await log({ msg: { product } })
    await log({ msg: { product }, tabId: parseInt(neo.stringify(sequence['ext']), 10) })
  }
}

Object.assign(context, { product })
