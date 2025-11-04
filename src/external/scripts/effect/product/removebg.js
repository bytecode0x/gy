/// <reference path="../../../product.d.ts" />

/** @type { Product } */
const { product, imageForThumbnailDataUrl } = context

if (!product) throw new Error('NO_PRODUCT')

const workdir = neo.stringify(edward.topDownSearch({ tree, key: 'workdir' }))

const dir = path.join(workdir, product.id)

fs.mkdirSync(dir, { recursive: true })

const p = /^data:image\/\w+;base64,(?<dataUrl>.+)$/

/** @type { import('sharp') } */
const sharp = importPlugin('sharp')

const thumbnailPath = path.join(dir, `${product.id}_image_for_thumbnail.png`)

await sharp(Buffer.from(p.exec(imageForThumbnailDataUrl).groups.dataUrl, 'base64')).toFile(thumbnailPath)

/**
 *
 * main <-> content-script
 * keyboard <-> control element
 *
 * 1. load removebg
 * 2. init observer and observe on addings
 * 3. click upload button
 * 4. type input image path and press enter
 * 5. resolve data url on finishing the removing, which is caught by the observer
 */

const { load_removebg$renderer_id } = await consume({
  action: {
    template: 'LOAD_URL',
    id: 'load_removebg',
    name: 'load_removebg',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__LoadUrl['value'] } */
    value: {
      find: 'https://www.remove.bg/ko/upload',
      active: true,
      url: 'https://www.remove.bg/ko/upload'
    }
  }
})

log({ msg: { load_removebg$renderer_id } })

const screenXOffset = parseInt(neo.stringify(getGdr({ substitute: 'SCREEN_X_OFFSET' })), 10) || 0
const screenYOffset = parseInt(neo.stringify(getGdr({ substitute: 'SCREEN_Y_OFFSET' })), 10) || 0
const chromeHeight = parseInt(neo.stringify(getGdr({ substitute: 'CHROME_HEIGHT' })), 10) || 0

const coordinates_code = String.raw`
  console.log('running coordinates_code')
  const upload_image_button = document.querySelector("#image-navigation > div > div > button") || document.querySelector('#footer button') ||
    document.querySelector('button[type="button"].rounded-full')

  const targetRect = upload_image_button.getBoundingClientRect()

  const x = window.screenX + targetRect.x + targetRect.width / 2 + ${screenXOffset}
  const y = window.screenY + targetRect.y + targetRect.height / 2 + ${screenYOffset} + ${chromeHeight}

  return { x, y }
`

const { coordinates } = await consume({
  action: {
    template: 'EVAL_BINDING_TAB',
    id: '',
    name: 'coordinates',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EvalBindingTab['value'] } */
    value: {
      rendererId: parseInt(neo.stringify(load_removebg$renderer_id), 10),
      code: coordinates_code
    }
  }
})

const { x, y } = neo.fromMatrix(coordinates)

// wait for making the tab in active state
await new Promise((resolve) => setTimeout(resolve, 1000))

// File chooser dialog can only be shown with a user activation.
// => you should make the tab active first

const code = String.raw`
return new Promise(function (resolve, reject) {

  console.log('running the script')

  const c = document.querySelector('#image-navigation')

  if (!c) reject('NO_FOOTER_FOUND')

  let f_timeout

  const observer = new MutationObserver(function (mutations) {
    clearTimeout(f_timeout)
    
    f_timeout = setTimeout(function() {
      /** @type { HTMLCanvasElement } */
    const canvas = document.querySelector('div.konvajs-content canvas:nth-child(3)')

    // const ctxt = canvas.getContext('2d')
    // resolve(ctxt.getImageData(0, 0, parseFloat(canvas.getAttribute('width')), parseFloat(canvas.getAttribute('height'))))
  
    const dataUrl = canvas.toDataURL('png')

    observer.disconnect()

    resolve([[dataUrl]])
    
    }, 5000)
  })

  observer.observe(c, {
    childList: true, // add/del of child node
    attributes: true, // attribute change
    subtree: true, // all of sub nodes
    attributeFilter: ['src'] // src attribute only
  })

  // const upload_image_button = document.querySelector('#footer button') ||
  //   document.querySelector('button[type="button"].rounded-full')

  // click upload button
  // upload_image_button.click()
  })
`

const promise = consume({
  action: {
    template: 'EVAL_BINDING_TAB',
    id: '',
    name: 'injection',
    schema: '',
    state: 'WATING',
    /** @type { import('local/desktop/main/gy/type/action.preset').__Action__EvalBindingTab['value'] } */
    value: {
      rendererId: parseInt(neo.stringify(load_removebg$renderer_id), 10),
      code
    }
  }
})

await new Promise((resolve) => setTimeout(resolve, 500))

genie.mouse.flash(x, y)
genie.mouse.click('left')

// wait for the interface to pop up
await new Promise((resolve) => setTimeout(resolve, 2500))

clipboard(thumbnailPath)

await new Promise((resolve) => setTimeout(resolve, 500))

genie.keyboard.hold(genie.keyboard.KEY_CTRL)

genie.keyboard.press('v')

genie.keyboard.release(genie.keyboard.KEY_CTRL)

// const chunkUnit = 8

// for (let i = 0; i < Math.ceil(thumbnailPath.length / chunkUnit); i++) {
//   genie.keyboard.type(thumbnailPath.slice(i * chunkUnit, (i + 1) * chunkUnit), 100)

//   await new Promise((resolve) => setTimeout(resolve, 1000))
// }

// genie.keyboard.type(workdir, 100)

// await new Promise((resolve) => setTimeout(resolve, 1000))

// genie.keyboard.type(`\\${product.id}`, 100)

// await new Promise((resolve) => setTimeout(resolve, 1000))

// genie.keyboard.type(`\\${product.id}_thumbnail.png`, 100)

// logger.info('coordinates', {
//   source: 'script_removebg',
//   x,
//   y,
//   screenXOffset,
//   screenYOffset,
//   chromeHeight,
//   thumbnailPath
// })

await new Promise((resolve) => setTimeout(resolve, 1000))
// // paste image path to remove bg
// // => ctrl + v, enter
// keyboard.hold(genie.keyboard.KEY_CTRL)

// keyboard.press('v')

// keyboard.release(genie.keyboard.KEY_CTRL)

genie.keyboard.press(genie.keyboard.KEY_ENTER)

const {
  injection: [[dataUrl]]
} = await promise

await log({ msg: { dataUrl } })

const trimmedTransparentImageDataUrl = `data:image/png;base64, ${await sharp(
  Buffer.from(p.exec(dataUrl).groups.dataUrl, 'base64')
)
  .trim()
  .toBuffer()
  .then((b) => b.toString('base64'))}`

// const imageWithoutBgDataUrl = dataUrl.flat().at(0)

// await log({ msg: { imageWithoutBgDataUrl } })

Object.assign(context, { imageWithoutBgDataUrl: trimmedTransparentImageDataUrl })

const images = context.images || []

images.push({ name: 'raw_image', url: trimmedTransparentImageDataUrl })

if (!('images' in context)) Object.assign(context, { images })

// wait for finishing the removing process
// => with observer?

// get access the image through js
// download into local
