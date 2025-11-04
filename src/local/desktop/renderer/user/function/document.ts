let html: HTMLHtmlElement

export function initShadowRoot() {
  const shadowRoot = (document.querySelector('#root')! as HTMLDivElement).attachShadow({ mode: 'closed' })
  html = document.createElement('html')
  // gatsbyHtml.style.fontSize = '16px'
  const head = document.createElement('head')
  const body = document.createElement('body')
  const frame = document.createElement('div')
  frame.id = 'frame'
  frame.setAttribute('data-theme', 'light')
  body.append(frame)
  html.append(head, body)
  shadowRoot.append(html)
}

export function getDocument() {
  return html
}
