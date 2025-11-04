import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import DialogApp from './App'

const root = createRoot(document.querySelector('#root')!)

root.render(
  <HashRouter>
    <DialogApp />
  </HashRouter>
)
