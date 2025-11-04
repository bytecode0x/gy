const { product, thumbnailTemplateDataUrl, imageWithoutBgDataUrl } = context

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const { serialize_thumbnail_template$urls: serializedThumbnailTemplateDateUrl, serialize_thumbnail_template$ids } =
  await consume({
    action: {
      template: 'EDIT_IMAGE',
      id: '',
      name: 'serialize_thumbnail_template',
      schema: '',
      state: 'WATING',
      /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EditImage['value'] } */
      value: {
        imageUrls: [thumbnailTemplateDataUrl],
        imageIds: ['thumbnail_template'],
        title: 'serialize',
        serializeOnly: true
      }
    }
  })

const p = /^data:image\/\w+;base64,(?<dataUrl>.+)$/

// thumbnail template data url is not consisted of base64
const thumbnailTemplateBuffer = Buffer.from(p.exec(serializedThumbnailTemplateDateUrl).groups.dataUrl, 'base64')
const imageWithoutBgBuffer = Buffer.from(p.exec(imageWithoutBgDataUrl).groups.dataUrl, 'base64')

const TEMPLATE_LENGTH = 608
const DESCRIPTION_AREA_LENGTH = 155

// 608
const TEMPLATE_EMPTY_BOX_WIDTH = TEMPLATE_LENGTH
// 453
const TEMPLATE_EMPTY_BOX_HEIGHT = TEMPLATE_LENGTH - DESCRIPTION_AREA_LENGTH

const VERTICAL_INNER_PADDING = 32
const HORIZONTAL_INNER_PADDING = 48

const OBJECT_POSITION_TOP = DESCRIPTION_AREA_LENGTH + VERTICAL_INNER_PADDING / 2
const OBJECT_POSITION_LEFT = HORIZONTAL_INNER_PADDING / 2

const MAXIMUM_OBJECT_WIDTH = TEMPLATE_EMPTY_BOX_WIDTH - HORIZONTAL_INNER_PADDING
const MAXIMUM_OBJECT_HEIGHT = TEMPLATE_EMPTY_BOX_HEIGHT - VERTICAL_INNER_PADDING

const thumbnailObject = await sharp(imageWithoutBgBuffer)

const { height, width } = await thumbnailObject.metadata().then((r) => ({ width: r.width, height: r.height }))

const base64 = (
  await sharp(thumbnailTemplateBuffer)
    .resize(TEMPLATE_LENGTH, TEMPLATE_LENGTH, {
      fit: 'contain',
      background: {
        r: 0,
        g: 0,
        b: 0,
        alpha: 0
      }
    })
    .composite([
      {
        input: await thumbnailObject
          .resize(
            MAXIMUM_OBJECT_WIDTH,
            MAXIMUM_OBJECT_HEIGHT,
            // width > height ? MAXIMUM_OBJECT_WIDTH : undefined,
            // height > width ? MAXIMUM_OBJECT_HEIGHT : undefined,
            {
              fit: 'contain',
              background: {
                r: 0,
                g: 0,
                b: 0,
                alpha: 0
              }
            }
          )
          .toBuffer(),
        left: OBJECT_POSITION_LEFT,
        top: OBJECT_POSITION_TOP
      }
    ])
    .png()
    .toBuffer()
).toString('base64')

const dataUrl = `data:image/png;base64, ${base64}`

const images = context.images || []

images.push({ name: 'thumbnail', url: dataUrl })

if (!('images' in context)) Object.assign(context, { images })

// const workdir = neo.stringify(edward.topDownSearch({ tree, key: 'workdir' }))

// const dir = path.join(workdir, product.id)

// await sharp(thumbnailTemplateBuffer)
//   .resize(TEMPLATE_WIDTH, TEMPLATE_HEIGHT)
//   .composite([{ input: imageForThumbnailBuffer.resize(IMAGE_WIDTH, IMAGE_HEIGHT), left, top }])
//   .png()
//   .toFile(path.join(dir, `${product.id}_thumbnail.png`))
