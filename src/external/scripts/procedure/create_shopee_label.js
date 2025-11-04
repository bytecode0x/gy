function createCircularLabel({ text, color, size, fontSize }) {
  return new Promise(function (resolve) {
    let background = ''

    switch (color) {
      case 'blue': {
        // basic, volume
        background = 'linear-gradient(145deg, #4a90e2, #357ABD)'
        break
      }
      case 'pink': {
        // feminine
        background = 'linear-gradient(145deg, #f78da7, #ec407a)'
        break
      }
      // discount
      case 'orange': {
        background = 'linear-gradient(145deg, #ff9a76, #ff6f61)'
        break
      }
      case 'mint': {
        // nature, low stimulus
        background = 'linear-gradient(145deg, #7de2d1, #28c3ab)'
        break
      }

      case 'black': {
        // premium
        background = 'linear-gradient(145deg, #333, #111)'
        break
      }

      default: {
        background = 'linear-gradient(145deg, #4a90e2, #357ABD)'
        break
      }
    }

    const raw =
      /* HTML */
      `
        <style>
          #container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: ${size || 100}px;
            height: ${size || 100}px;
            font-size: ${fontSize || 28}px;
            border-radius: 100%;
            background: ${background};
            color: white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.2);
            font-weight: bold;
            font-family: 'Helvetica Neue', sans-serif;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
          }
        </style>
        <div id="container">${text}</div>
      `
    const root = document.createElement('div')
    const shadowRoot = root.attachShadow({ mode: 'closed' })

    const element = document.createElement('div')
    const img = new Image()
    const canvas = document.createElement('canvas')

    document.body.append(root)
    shadowRoot.append(element, img, canvas)

    element.innerHTML = raw
    //   const { width, height } = window.getComputedStyle(element.querySelector('#container'))

    const { width, height } = element.querySelector('#container').getBoundingClientRect()

    img.onload = function () {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }

    img.src = `data:image/svg+xml, ${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}px" height="${height}px"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${decodeHtmlEntities(
        element.outerHTML
      )
        .replace(/<br>/g, '<br/>')
        .replace(/&/g, '&amp;')}</div></foreignObject></svg>`
    )}`
  })
}

function decodeHtmlEntities(str) {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = str
  return textarea.value
}

const text = neo.stringify(await prxy['text'])
const color = neo.stringify(await prxy['color'])
const size = neo.stringify(await prxy['size'])
const fontSize = neo.stringify(await prxy['font_size'])

return { label_base64: [[await createCircularLabel({ text, color, size, fontSize })]] }
