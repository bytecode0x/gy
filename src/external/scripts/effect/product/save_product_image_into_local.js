const { product, images } = context

if (!images || !product) throw new Error('NO_CONTEXT')

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const workdir = neo.stringify(edward.topDownSearch({ tree, key: 'workdir' }))

const dir = path.join(workdir, product.id)

fs.mkdirSync(dir, { recursive: true })

const p = /^data:image\/\w+;base64,(?<dataUrl>.+)$/

await log({ msg: { images } })

await Promise.all(
  images.map(({ url, name }, i) =>
    sharp(Buffer.from(p.exec(url).groups.dataUrl, 'base64')).toFile(path.join(dir, `${name}.png`))
  )
)
