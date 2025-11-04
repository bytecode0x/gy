/** @type { Product } */
const { product } = context

if (!product) throw new Error('NO_PRODUCT')

// const imageUrls = product.main_images.concat(product.descriptive_images).map((url) => [url])

const { select_thumbnail$urls, select_thumbnail$ids } = await consume({
  action: {
    template: 'EDIT_IMAGE',
    id: '',
    name: 'select_thumbnail',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EditImage['value'] } */
    value: {
      imageUrls: product.main_images.slice(0, 1).map((url) => [url]),
      imageIds: [['thumbnail']],
      title: 'select thumbanil',
      serializeOnly: true
    }
  }
})

const imageForThumbnailDataUrl = select_thumbnail$urls.flat().at(0)

await log({ msg: { imageForThumbnailDataUrl } })

Object.assign(context, { imageForThumbnailDataUrl })
