function createNumberingPanel({ title, phrases }) {
  return new Promise(function (resolve) {
    const raw =
      /* HTML */
      `
        <style>
          #container {
            width: 750px;
            padding: 32px 16px;
            display: flex;
            flex-direction: column;
            background-color: green;
          }

          #top {
            display: flex;
            flex-direction: column;
            font-size: 40px;
            color: white;
            padding: 8px 0;
          }

          #middle {
            display: flex;
            flex-direction: column;
            padding: 8px 0;
          }

          .phrase-container {
            display: flex;
            align-items: center;
            box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.6);
            background-color: white;
            padding: 24px;
            border-radius: 8px;
          }

          .phrase-container + .phrase-container {
            margin-top: 20px;
          }

          .index {
            font-weight: lighter;
            margin-right: 10px;
            font-size: 20px;
          }

          .phrase {
            font-size: 24px;
          }
        </style>
        <div id="container">
          <div id="top">${title.map((t, i) => `<span class="title">${t}</span>`).join('\n')}</div>
          <div id="middle">
            ${phrases
              .map(
                (p, i) => `<div class="phrase-container">
                <span class="index">${(i + 1).toString().padStart(2, '0')}</span>
                <div class="phrase">${p}</div>
                </div>`
              )
              .join('\n')}
          </div>
        </div>
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

function createSubjectAndDescriptionPanel({ title, subjects, descriptions }) {
  return new Promise(function (resolve) {
    const raw =
      /* HTML */
      `
        <style>
          #container {
            width: 750px;
            padding: 32px 16px;
            display: flex;
            flex-direction: column;
            background-color: white;
          }

          #top {
            display: flex;
            flex-direction: column;
            font-size: 60px;
            color: black;
            padding: 8px 0;
          }

          #middle {
            display: flex;
            flex-direction: column;
            padding: 8px 0;
          }

          .phrase-container {
            display: flex;
            flex-direction: column;

            background-color: white;
            padding: 24px;

            border-top: 2px solid black;
          }

          .phrase-container + .phrase-container {
            margin-top: 20px;
          }

          .subject {
            font-size: 20px;
            color: green;
            border-bottom: 1px solid black;

            padding: 2px 0;
            margin-bottom: 6px;
          }

          .description {
            font-size: 24px;
          }
        </style>
        <div id="container">
          <div id="top">${title.map((t, i) => `<span class="title">${t}</span>`).join('\n')}</div>
          <div id="middle">
            ${subjects
              .map(
                (s, i) =>
                  `<div class="phrase-container">
                    <span class="subject">${s}</span>
                    <div class="description">${descriptions[i]}</div>
                  </div>`
              )
              .join('\n')}
          </div>
        </div>
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

function createProcedurePanel({ title, steps }) {
  return new Promise(function (resolve) {
    const raw =
      /* HTML */
      `
        <style>
          #container {
            width: 750px;
            padding: 32px 16px;
            display: flex;
            flex-direction: column;
            background-color: white;
          }

          #top {
            display: flex;
            flex-direction: column;
            font-size: 50px;
            color: black;
            padding: 8px 0;

            border-bottom: 2px solid black;
          }

          #middle {
            display: flex;
            flex-direction: column;
            padding: 8px 0;
          }

          .phrase-container {
            display: flex;
            align-items: center;

            background-color: white;
            padding: 12px;
            border-bottom: 1px dotted black;
          }

          .phrase-container + .phrase-container {
            margin-top: 12px;
          }

          .index {
            font-weight: lighter;
            margin-right: 10px;
            font-size: 20px;
          }

          .phrase {
            font-size: 24px;
          }
        </style>
        <div id="container">
          <div id="top">${title.map((t, i) => `<span class="title">${t}</span>`).join('\n')}</div>
          <div id="middle">
            ${steps
              .map(
                (p, i) =>
                  `<div class="phrase-container">
                        <span class="index">${(i + 1).toString().padStart(2, '0')})</span>
                        <div class="phrase">${p}</div>
                    </div>`
              )
              .join('\n')}
          </div>
        </div>
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

function createReviewPanel({ maxRating = 5, rating, reviews }) {
  return new Promise(function (resolve) {
    const raw =
      /* HTML */
      `
        <style>
          #container {
            width: 750px;
            padding: 32px 16px;
            display: flex;
            flex-direction: column;
            background-color: white;
          }

          #top {
            display: flex;
            flex-direction: column;
            font-size: 50px;
            color: black;
            padding: 8px 0;

            border-bottom: 2px solid black;
          }

          #middle {
            display: flex;
            flex-direction: column;
            padding: 8px 0;
          }

          .review-container {
            display: flex;
            flex-direction: column;

            background-color: white;
            padding: 12px;
            border-bottom: 1px dotted black;
          }

          .review-container > *:not(:first-child) {
            margin-top: 6px;
          }

          .review-container + .review-container {
            margin-top: 12px;
          }

          .review-head {
            display: flex;
            align-items: center;
            font-size: 14px;
          }

          .review-head:first-child {
            font-style: bold;
          }

          .review-head > span {
            margin-right: 6px;
          }

          .review-head > span:not(:first-child) {
            color: #646f7c;
          }

          .review-attribute-container {
            display: flex;
            justify-content: space-between;
            background-color: #f3f3f3;
            font-size: 11px;
            padding: 10px;
          }

          .review-attribute > span:first-child {
            color: #646f7c;
            font-style: bold;

            margin-right: 8px;
          }

          .review-content {
            font-size: 16px;
          }
        </style>
        <div id="container">
          <div id="top">Reviews ${rating} / ${maxRating}</div>
          <div id="middle">
            ${reviews
              .map(
                (r, i) =>
                  `<div class="review-container">
                            <div class="review-head">
                                <span>${r.writer}</span>

                                <svg width="16px" height="16px" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z" fill="#1C274C"/>
                                </svg>
                                <span>${r.rating}</span>
                                <span>${r.date}</span>
                            </div>

                            <div class="review-attribute-container">
                                ${Object.entries(r.attributes)
                                  .map(
                                    ([k, v]) => `<div class="review-attribute"><span>${k}</span><span>${v}</span></div>`
                                  )
                                  .join('\n')}
                            </div>

                            <div class="review-content">${r.textContent}</div>
                        </div>`
              )
              .join('\n')}
          </div>
        </div>
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

const type = neo.stringify(await prxy['panel_type'])

if (!['numbering', 'subject', 'procedural', 'review'].includes(type.toLowerCase()))
  throw new Error('INVALID_PANEL_TYPE')

const parameters = neo.fromMatrix(await prxy['panel_params'])

let base64_string

switch (type.toLowerCase()) {
  case 'numbering': {
    base64_string = [[await createNumberingPanel(parameters)]]
    break
  }

  case 'subject': {
    base64_string = [[await createSubjectAndDescriptionPanel(parameters)]]
    break
  }

  case 'procedural': {
    base64_string = [[await createProcedurePanel(parameters)]]
    break
  }

  case 'review': {
    base64_string = [[await createReviewPanel(parameters)]]
    break
  }

  default: {
    throw new Error('INVALID_PANEL_TYPE')
  }
}

const proceduralParams = {
  title: ['리들샷은', '피부를 위한 평범하지 않은', '<b><u>스폐셜 케어 제품</u></b>'],
  phrases: [
    '스킨 케어 제품의 유효성분 흡수 케어로 <b>제대로 관리가 필요한 피부</b>',
    '피부샵 관리의 필요성을 느끼나 <b>집에서 간편히 케어</b>하고 싶은 피부',
    '피부 개선의 필요성은 느끼나 <b>비용과 단계의 부담</b>으로 케어를 못하고 있는 피부',
    '다양한 스킨케어 제품 사용에도 <b>변화가 없는 피부</b>',
    '<b>매끈하고 건강하게</b> 돌아가고 싶은 피부'
  ]
}

return { base64_string }

// { title: ['This', 'Is', 'Title'], phrases: Array.from({ length: 5 }, (_, i) => `this is ${i + 1}th phrase`)}

// { title: ['This', 'Is', 'Title'], steps: Array.from({ length: 5 }, (_, i) => `this is ${i + 1}th phrase`)}
