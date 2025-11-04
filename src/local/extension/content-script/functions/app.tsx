import App from 'local/extension/content-script/App'
import { initStore } from 'local/extension/content-script/store'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { StyleSheetManager } from 'styled-components'
import { ExtensionStore } from 'type/app'

export function launchNativeApp() {
  const anchor = document.createElement('a')
  anchor.href = `gatsby://${btoa('nothing')}`
  anchor.click()
  anchor.remove()
}

let container: HTMLDivElement
let shadowRoot: ShadowRoot
/**
 * need to bind body element to query
 * because It's in closed shadow root
 */
let html: HTMLHtmlElement | null
let body: HTMLBodyElement | null

export function createContainer() {
  if (containerExists()) return
  console.log('creating container')
  container = document.createElement('div')

  container.setAttribute('id', 'gatsby-root')
  // Object.assign(container.style, { all: 'unset', position: 'fixed', left: '0px', top: '0px', zIndex: '2147483647' })
  container.style.all = 'unset'
  container.style.position = 'fixed'
  container.style.left = '0px'
  container.style.top = '0px'
  container.style.zIndex = '2147483647'
  document.body.insertAdjacentElement('beforeend', container)
  shadowRoot = container.attachShadow({ mode: process.env.NODE_ENV === 'production' ? 'closed' : 'open' })
}

export function containerExists() {
  return !!container
}

export function getAppContainer() {
  // if (!container) throw new Error('APP_CONTAINER_NOT_INITIALIZED')
  return container
}

export async function mountApp(initialState: ExtensionStore) {
  console.log('mounting app')
  initStore(initialState)

  if (!container || !shadowRoot) createContainer()

  /**
   * outer is for locating style element created by styled-components
   */
  html = document.createElement('html')
  // gatsbyHtml.style.fontSize = '16px'
  const head = document.createElement('head')
  body = document.createElement('body')
  const outerFrame = document.createElement('div')
  body.append(outerFrame)
  html.append(head, body)
  shadowRoot.append(html)
  const root = createRoot(outerFrame)

  root.render(
    <>
      {/* @ts-ignore */}
      <StyleSheetManager target={head}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </StyleSheetManager>
    </>
  )
  // return true
}

export function unmountApp() {
  if (!shadowRoot) throw new Error('SHADOW_NOT_ATTACHED')
  if (!html) return
  shadowRoot.removeChild(html)
  body = null
  html = null
}

export function getDocument() {
  return html
}

export function safeGetDocument() {
  if (!html) throw new Error('NO_DOCUMENT')
  return html
}

export function appMounted() {
  return !!html
}

export function safeGetBody() {
  if (!body) throw new Error('APP_NOT_MOUNTED')
  return body
}

export function getBody() {
  return body
}

export function getShadowRoot() {
  return shadowRoot
}

export function hideApp() {
  html?.classList.add('none')
}

export function showApp() {
  html?.classList.remove('none')
}
