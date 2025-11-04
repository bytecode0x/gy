/// <reference path="../../../product.d.ts" />

/** @type { Product } */
const { product, thumbnailTemplateDataUrl, imageForThumbnailDataUrl, imageWithoutBgDataUrl } = context

if (!product) throw new Error('NO_PRODUCT')
if (!thumbnailTemplateDataUrl) throw new Error('NO_TEMPLATE_DATA_URL')
if (!imageForThumbnailDataUrl) throw new Error('NO_THUMBNAIL_DATA_URL')

// await log({ msg: { thumbnailTemplateDataUrl, imageForThumbnailDataUrl, imageWithoutBgDataUrl, thumbnailDataUrl } })

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const imageUrls = product.main_images
  .concat(product.descriptive_images)
  .concat([thumbnailTemplateDataUrl, imageForThumbnailDataUrl, imageWithoutBgDataUrl])
  .map((url) => [url])

const imageIds = Array.from({ length: product.main_images.length + product.descriptive_images.length }, (_, i) => [
  `${product.id}_${i}`
]).concat(['thumbnail_template', 'image_for_thumbnail', 'image_without_bg', 'thumbnail'])

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
      imageIds,
      title: 'shopee image'
    }
  }
})

const images = context.images || []

images.push(...images_for_shopee$urls.flat().map((url, i) => ({ name: images_for_shopee$ids.flat()[i], url })))

if (!('images' in context)) Object.assign(context, { images })

// for (const [_, branch] of edward.trim(tree, '')) {
//   for (const [_, sequence] of edward.generateSequence(branch)) {
//     const main_images = sequence['main_images']
//     const descriptive_images = sequence['descriptive_images']

//     const imageUrls = main_images.concat(descriptive_images).flat()

//     const { images_for_shopee$urls, images_for_shopee$ids } = await consume({
//       action: {
//         template: 'EDIT_IMAGE',
//         id: '',
//         name: 'images_for_shopee',
//         schema: '',
//         state: 'WATING',
//         /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EditImage['value'] } */
//         value: {
//           imageUrls,
//           // imageIds,
//           title: 'shopee image'
//         }
//       }
//     })

//     const workdir = neo.stringify(sequence['workdir'])

//     const p = /^data:image\/\w+;base64,(?<dataUrl>.+)$/

//     await Promise.all(
//       images_for_shopee$urls
//         .flat()
//         .map((v, i) =>
//           sharp(Buffer.from(p.exec(v).groups.dataUrl, 'base64')).toFile(
//             path.join(workdir, `${images_for_shopee$ids.flat()[i]}.png`)
//           )
//         )
//     )
//   }
// }
