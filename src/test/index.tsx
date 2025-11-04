import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'

let container = document.querySelector('#container')

if (!container) {
  container = document.createElement('div')
  container.id = 'container'
}

const root = createRoot(container)

root.render(
  <HashRouter>
    <App />
  </HashRouter>
)
