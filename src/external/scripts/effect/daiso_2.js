/// <reference path="../../effect-runtime.d.ts" />

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const thumbnails = edward.topDownSearch({ key: 'thumbnails', tree })
const product_name = edward.topDownSearch({ key: 'name', tree })

const id = neo.stringify(edward.topDownSearch({ key: 'id', tree }))
const workdir = 'C:/Users/taepy/Desktop/daiso'
const dir = path.join(workdir, id)

fs.mkdirSync(dir, { recursive: true })

/** @type { Array<{ writer: string; rating: string; date: string; attributes: Record<string, string>; textContent: string; }> } */
const reviews = neo.fromMatrix(edward.topDownSearch({ key: 'reviews', tree }))

/** @type { Array<[string, Array<string>]> } */
const attributes_entries = Object.entries(neo.fromMatrix(edward.topDownSearch({ key: 'attributes', tree })))

const tabId = neo.stringify(edward.topDownSearch({ key: 'EXTENSION_TAB', tree }))

await log('extension tab id: ', tabId)

// generate  review panel
const { tidOrTree: image_tree } = await initiateProcedure({
  pid: '1ea278de-aa65-4fa1-9cd8-126645b404b9',
  returnType: 'tree',
  idr: {
    panel_type: [['review']],
    attach: [[`$<json|parse|${tabId}>`]],
    panel_params: neo.toMatrix({
      reviews,
      maxRating: 5,
      rating: neo.stringify(edward.topDownSearch({ key: 'rating', tree }))
    })
  },
  config: {
    invokeEffectImmediately: false,
    preserveTree: false,
    silenced: true
  }
})

const base64_string = neo.stringify(edward.topDownSearch({ key: 'base64_string', tree: image_tree }))

const file = `${id}_review.jpg`

await sharp(Buffer.from(base64_string.slice('data:image/png;base64,'.length), 'base64'))
  .jpeg()
  .toFile(path.join(dir, file))

// create descriptive panels
const description = edward.topDownSearch({ key: 'description', tree })

// choose panel type, generate text based on the description for panel parameters, input panel parameters, confirm template

/** @type { Array<{ type: 'numbering', parameters: { title: string; phrases: Array<string> } } | { type: 'procedural', parameters: { title: string; steps: Array<string> } } | { type: 'subject', parameters: { title: string; subjects: Array<string>; descriptions: Array<string> } }> } */
const panels = neo.fromMatrix(edward.topDownSearch({ key: 'panels', tree }))

for (const [i, p] of panels.entries()) {
  const { tidOrTree: image_tree } = await initiateProcedure({
    pid: '1ea278de-aa65-4fa1-9cd8-126645b404b9',
    returnType: 'tree',
    idr: {
      panel_type: [[p.type]],
      attach: [[`$<json|parse|${tabId}>`]],
      panel_params: neo.toMatrix(p.parameters)
    },
    config: {
      invokeEffectImmediately: false,
      preserveTree: false,
      silenced: true
    }
  })

  const base64_string = neo.stringify(edward.topDownSearch({ key: 'base64_string', tree: image_tree }))

  const file = `${id}_panels${i}.jpg`

  await sharp(Buffer.from(base64_string.slice('data:image/png;base64,'.length), 'base64'))
    .jpeg()
    .toFile(path.join(dir, file))
}
