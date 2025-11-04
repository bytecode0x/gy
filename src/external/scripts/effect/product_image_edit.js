/// <reference path="../../effect-runtime.d.ts" />
/// <reference path="../../product.d.ts" />

/** @type { Product } */
const product = prevScriptResult

if (!product) return await log({ msg: 'no product' })

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const { product_image$urls, product_image$ids } = await consume({
  action: {
    template: 'EDIT_IMAGE',
    id: '',
    name: 'product_image',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EditImage['value'] } */
    value: {
      imageUrls: product.main_images.concat(product.descriptive_images).concat(product.review_images),
      title: 'Product Thumbnail'
    }
  }
})

const dir = path.join(
  String.raw`C:\Users\user\Desktop\product\image`,
  product.name.replace(/[\n\t\\\:\|\<\>\*\?\"\/\x00-\x1F\x7F]/g, '').slice(0, 255)
)

fs.mkdirSync(dir, { recursive: true })

/** @type { Array<Record<string, string>> } */
const dataUrls = product_image$urls.flat()

const ids = edit_image_test$ids.flat()

const p = /^data:image\/\w+;base64,(?<dataUrl>.+)$/

await Promise.all(
  dataUrls.map((v, i) => sharp(Buffer.from(p.exec(v).groups.dataUrl, 'base64')).toFile(path.join(dir, `${ids[i]}.png`)))
)
