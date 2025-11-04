/// <reference path="../../effect-runtime.d.ts" />

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const main_images = edward.topDownSearch({ key: 'main_images', tree })
const product_name = edward.topDownSearch({ key: 'name', tree })

const id = neo.stringify(edward.topDownSearch({ key: 'id', tree }))
const workdir = 'C:/Users/user/Desktop/daiso'
const dir = path.join(workdir, id)

// make product dir
fs.mkdirSync(dir, { recursive: true })

// select images
const { select_images } = await consume({
  action: {
    template: 'SELECT',
    id: '',
    name: 'select_images',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Select['value'] } */
    value: {
      options: main_images,
      attach: 0,
      labels: main_images.map((r) => r.map((v) => `<img src="${v}" alt="${v}">`))
    }
  }
})

// download main images
await Promise.all(
  select_images.flat().map((url, i) =>
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buffer) => sharp(buffer).toFile(path.join(dir, '__main__' + path.basename(url))))
  )
)

// generate descriptions based on template

// compute sales price based on cost(product price)

// generate title

// the point is how to fill the enlist form automatically if possible
