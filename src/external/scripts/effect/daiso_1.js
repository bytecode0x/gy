/// <reference path="../../effect-runtime.d.ts" />

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const thumbnails = edward.topDownSearch({ key: 'thumbnails', tree })
const product_name = edward.topDownSearch({ key: 'name', tree })

const id = neo.stringify(edward.topDownSearch({ key: 'id', tree }))
const workdir = 'C:/Users/taepy/Desktop/daiso'
const dir = path.join(workdir, id)

fs.mkdirSync(dir, { recursive: true })

const { select_images } = await consume({
  action: {
    template: 'SELECT',
    id: '',
    name: 'select_images',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Select['value'] } */
    value: {
      options: thumbnails,
      attach: 0,
      labels: thumbnails.map((r) => r.map((v) => `<img src="${v}" alt="${v}">`))
    }
  }
})

const { images_to_flop$indices } = await consume({
  action: {
    template: 'SELECT',
    id: '',
    name: 'images_to_flop',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Select['value'] } */
    value: {
      options: select_images,
      attach: 0,
      labels: select_images.map((r) => r.map((v) => `<img src="${v}" alt="${v}">`))
    }
  }
})

await Promise.all(
  select_images.flat().map((url, i) =>
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buffer) =>
        (images_to_flop$indices.includes(i) ? sharp(buffer).flop() : sharp(buffer)).toFile(
          path.join(dir, '__main__' + path.basename(url))
        )
      )
  )
)

// composite review images
const review_images = edward.topDownSearch({ key: 'review_images', tree })

const { select_review_images } = await consume({
  action: {
    template: 'SELECT',
    id: '',
    name: 'select_review_images',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__Select['value'] } */
    value: {
      options: review_images,
      attach: 0,
      labels: review_images.map((r) => r.map((v) => `<img src="${v}" alt="${v}">`))
    }
  }
})

const GRID_ROW_SIZE = 2
const GRID_COLUMN_SIZE = 5
const PIVOT_SIZE = Math.max(GRID_ROW_SIZE, GRID_COLUMN_SIZE)

const CELL_WIDTH = 200
const CELL_HEIGHT = 200

await sharp({
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
        (
          await Promise.all(
            select_review_images
              .slice(0, GRID_ROW_SIZE * GRID_COLUMN_SIZE)
              .map((url) => fetch(url).then((r) => r.arrayBuffer()))
          )
        ).map((i) => sharp(i).resize({ height: CELL_HEIGHT, width: CELL_WIDTH }).flop().toBuffer())
      )
    ).map(function (i, index) {
      return {
        input: i,
        top: Math.floor(index / PIVOT_SIZE) * CELL_HEIGHT,
        left: Math.floor(index % PIVOT_SIZE) * CELL_WIDTH
      }
    })
  )
  .jpeg()
  .toFile(path.join(dir, '__review__composite.jpg'))

/** @type { Array<{ writer: string; rating: string; date: string; attributes: Record<string, string>; textContent: string; }> } */
const reviews = neo.fromMatrix(edward.topDownSearch({ key: 'reviews', tree }))

const translate = importPlugin('translate')

/** @type { Array<[string, Array<string>]> } */
const attributes_entries = Object.entries(neo.fromMatrix(edward.topDownSearch({ key: 'attributes', tree })))

const { tranlsated_attributes_entries } = await consume({
  /** @type { import('lib/gy/core/type/action').Action<import('local/desktop/main/gy/type/action.preset').__Action__Define> } */
  $action: {
    template: 'DEFINE',
    id: '',
    name: 'tranlsated_attributes_entries',
    schema: '',
    state: 'WATING',
    value: {
      title: 'Confirm translation on attributes',
      record: {
        tranlsated_attributes_entries: `$<json|parse|${JSON.stringify(
          await Promise.all(
            attributes_entries.map(([key, values]) =>
              Promise.all([
                translate({ text: key, source: 'ko', target: 'en' }),
                Promise.all(values.map((v) => translate({ text: v, source: 'ko', target: 'en' })))
              ])
            )
          )
        )}>`
      },
      confirm: true
    }
  }
})

await log('translated attributes entries: ', tranlsated_attributes_entries)

const translated_review = await Promise.all(
  reviews.map(async (r) => ({
    ...r,
    textContent: await translate({ text: r.textContent, source: 'ko', target: 'en' }),
    attributes: Object.fromEntries(
      Object.entries(r.attributes).map(function ([key, value]) {
        const key_index = attributes_entries.map(([key]) => key).findIndex((k) => k === key)

        const value_index = attributes_entries[key_index][1].findIndex((v) => v === value)

        return [tranlsated_attributes_entries[key_index][0], tranlsated_attributes_entries[key_index][1][value_index]]
      })
    )
  }))
)

await log('translated review: ', translated_review)

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
      reviews: translated_review,
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

await log('panel image tree: ', image_tree)

const base64_string = neo.stringify(edward.topDownSearch({ key: 'base64_string', tree: image_tree }))

const file = `${id}_review.jpg`

await sharp(Buffer.from(base64_string.slice('data:image/png;base64,'.length), 'base64'))
  .jpeg()
  .toFile(path.join(dir, file))

// create descriptive panels
const description = neo.stringify(edward.topDownSearch({ key: 'description', tree }))

// choose panel type, generate text based on the description for panel parameters, input panel parameters, confirm template

/** @type { Array<{ type: 'numbering', parameters: { title: string; phrases: Array<string> } } | { type: 'procedural', parameters: { title: string; steps: Array<string> } } | { type: 'subject', parameters: { title: string; subjects: Array<string>; descriptions: Array<string> } }> } */
const panels = neo.fromMatrix(edward.topDownSearch({ key: 'panels', tree }))

const translated_panels = await Promise.all(
  panels.map(async function (panel) {
    switch (panel.type) {
      case 'numbering': {
        return {
          ...panel,
          parameters: {
            ...panel.parameters,
            phrases: (await translate({ text: panel.parameters.phrases.join('\n'), source: 'ko', target: 'en' })).split(
              '\n'
            )
          }
        }
      }

      case 'procedural': {
        return {
          ...panel,
          parameters: {
            ...panel.parameters,
            steps: (await translate({ text: panel.parameters.steps.join('\n'), source: 'ko', target: 'en' })).split(
              '\n'
            )
          }
        }
      }

      case 'subject': {
        return {
          ...panel,
          parameters: {
            ...panel.parameters,
            subjects: (
              await translate({ text: panel.parameters.subjects.join('\n'), source: 'ko', target: 'en' })
            ).split('\n'),
            descriptions: (
              await translate({ text: panel.parameters.descriptions.join('\n'), source: 'ko', target: 'en' })
            ).split('\n')
          }
        }
      }

      default: {
        throw new Error('INVALID_PANEL_TYPE')
      }
    }
  })
)

await log('translated panels: ', translated_panels)

const { translated_panels_confirm } = await consume({
  /** @type { import('lib/gy/core/type/action').Action<import('local/desktop/main/gy/type/action.preset').__Action__Define> } */
  $action: {
    template: 'DEFINE',
    id: '',
    name: 'translated_panels_confirm',
    schema: '',
    state: 'WATING',
    value: {
      title: 'Confirm translation on panel data',
      record: {
        translated_panels: `$<json|parse|${JSON.stringify(translated_panels)}>`
      },
      confirm: true
    }
  }
})

for (const [i, p] of translated_panels_confirm.entries()) {
  const { tidOrTree: image_tree } = await initiateProcedure({
    pid: '1ea278de-aa65-4fa1-9cd8-126645b404b9',
    returnType: 'tree',
    idr: {
      panel_type: [[p.type]],
      attach: [[`$<json|parse|${tabId}>`]],
      panel_params: neo.toMatrix(p.parameters),
      confirm: [['$<json|parse|false>']]
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
