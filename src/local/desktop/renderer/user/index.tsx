import { GetStore } from 'lib/event/sementic'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { StyleSheetManager } from 'styled-components'
import { AppStore } from 'type'
import App from './App'
import { getDocument, initShadowRoot } from './function/document'
import { initStore } from './store'

// if (process.env.NODE_ENV === 'development') window.ipc = { send: console.log, on: console.log }
// if (process.env.NODE_ENV === 'production') console.log = () => {}

// const root = document.querySelector('#root')

// ReactDOM.render(
//   <HashRouter>
//     <App />
//   </HashRouter>,
//   root!
// )

initShadowRoot()

window.eh
  .sendEvent<GetStore<AppStore>>({
    name: 'GET_STORE',
    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
  })
  .then(function init(appStore) {
    initStore(appStore)

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
  })
