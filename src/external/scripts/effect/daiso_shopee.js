/// <reference path="../../product.d.ts" />

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

// const { tidOrTree: labelTree } = await initiateProcedure({
//   pid: 'ebbb5d9c-cbb1-4422-8fdc-9b0b7f0f7a86',
//   returnType: 'tree',
//   config: { invokeEffectImmediately: false }
// })

// const labelUrl = neo.stringify(edward.topDownSearch({ key: 'label_base64', tree: labelTree }), {
//   joinWithEscaped: true
// })

// await log('label url: ', labelUrl)

for (const [_, branch] of edward.trim(tree, '')) {
  for (const [_, sequence] of edward.generateSequence(branch)) {
    /** @type { Product } */
    const product = {
      name: neo.stringify(sequence['name']),
      rating: parseFloat(neo.stringify(sequence['rating'])),
      scraped_at: neo.stringify(sequence['scraped_at']),
      main_images: sequence['main_images'].flat(),
      descriptive_images: sequence['descriptive_images'].flat(),
      review_images: sequence['review_images'].flat(),
      descriptions: neo.stringify(sequence['descriptions']),
      price: parseFloat(neo.stringify(sequence['price'])),
      price_unit: neo.stringify(sequence['price_unit']),
      platform: neo.stringify(sequence['platform']),
      url: neo.stringify(sequence['url']),
      category: neo.stringify(sequence['category']),
      attributes: neo.fromMatrix(sequence['attributes']),
      reviews: neo.fromMatrix(sequence['reviews'])
    }

    const main_images = sequence['main_images']
    const descriptive_images = sequence['descriptive_images']

    const imageUrls = main_images.concat(descriptive_images).flat().concat([labelUrl])

    const { images_for_shopee$urls, images_for_shopee$ids } = await consume({
      action: {
        template: 'EDIT_IMAGE',
        id: '',
        name: 'images_for_shopee',
        schema: '',
        state: 'WATING',
        /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EditImage['value'] } */
        value: {
          imageUrls,
          // imageIds,
          title: 'shopee image'
        }
      }
    })

    const workDir = neo.stringify(sequence['WORK_DIR'])

    await Promise.all(
      images_for_shopee$urls
        .flat()
        .map((dataUrl, i) =>
          sharp(Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64')).toFile(
            path.join(workDir, `${images_for_shopee$ids.flat()[i]}.png`)
          )
        )
    )
  }
}
