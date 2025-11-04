import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { StyleSheetManager } from 'styled-components'
import App from './App'
import { getDocument, initShadowRoot } from './function/document'
import { initStore } from './store'

Object.assign(window, { eh: { sendEvent: console.log, onEvent: console.log, removeAllEventListenerOn: console.log } })

initShadowRoot()

initStore({
  config: {
    alwaysOntop: false,
    extensionBrowser: '',
    language: 'kr',
    maximumWorkers: 3,
    minimumPageLoadThreshold: 200,
    preserveTree: true,
    strict: true,
    version: '2.0.0',
    workDir: ''
  },
  exConfig: {
    offset: { left: '0px', right: '0px' },
    theme: 'dark'
  },
  gy: {
    $gdr: {},
    $procedures: [],
    $scripts: [],
    $trees: [],
    gdr: {},
    gs: {}
  }
})

const document = getDocument()

const frame = document.querySelector('#frame')!

const root = createRoot(frame)

/**
 * todo
 * mutation observer that observes the removal on the shadow root to restore
 */

root.render(
  // @ts-ignore
  <StyleSheetManager target={document.querySelector('head')!}>
    <HashRouter>
      <App />
    </HashRouter>
  </StyleSheetManager>
)
