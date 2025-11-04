// composite review images
/** @type { Product } */
const { product } = context

if (!product) throw new Error('NO_PRODUCT')

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const workdir = neo.stringify(edward.topDownSearch({ tree, key: 'workdir' }))

const dir = path.join(workdir, product.id)

// const { select_review_images } = await consume({
//   action: {
//     template: 'SELECT',
//     id: '',
//     name: 'select_review_images',
//     schema: '',
//     state: 'WATING',
//     /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Select['value'] } */
//     value: {
//       options: product.review_images.map((url) => [url]),
//       attach: 0,
//       labels: product.review_images.map((url) => [`<img src="${url}" alt="${url}">`])
//     }
//   }
// })

const reviewImages = product.reviews.filter((r) => r.images.at(0)).map((r) => r.images.at(0))

const GRID_ROW_SIZE = 3
const GRID_COLUMN_SIZE = 3
const PIVOT_SIZE = Math.max(GRID_ROW_SIZE, GRID_COLUMN_SIZE)

const CELL_WIDTH = 200
const CELL_HEIGHT = 200

const dataUrl = `data:image/png;base64, ${await sharp({
  create: {
    width: CELL_WIDTH * GRID_COLUMN_SIZE,
    height: CELL_HEIGHT * GRID_ROW_SIZE,
    channels: 3,
    background: { alpha: 0, r: 1, g: 1, b: 1 }
  }
})
  .composite(
    (
      await Promise.all(
        await Promise.all(
          reviewImages.slice(0, GRID_ROW_SIZE * GRID_COLUMN_SIZE).map((url) => fetch(url).then((r) => r.arrayBuffer()))
        )
      ).map((i) => sharp(i).resize({ height: CELL_HEIGHT, width: CELL_WIDTH }).flop().toBuffer())
    ).map(function (i, index) {
      return {
        input: i,
        top: Math.floor(index / PIVOT_SIZE) * CELL_HEIGHT,
        left: Math.floor(index % PIVOT_SIZE) * CELL_WIDTH
      }
    })
  )
  .png()
  .toBuffer()
  .then((b) => b.toString('base64'))}`
// .toFile(path.join(dir, '__review__composite.jpg'))

const images = context.images || []

images.push({ name: '__composited__review', url: dataUrl })

if (!('images' in context)) Object.assign(context, { images })
