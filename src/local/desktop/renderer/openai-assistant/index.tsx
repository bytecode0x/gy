import 'lib/css/global.css'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import AssistantApp from './App'
import './assistant.css'

const root = createRoot(document.querySelector('#root')!)

root.render(
  <HashRouter>
    <AssistantApp />
  </HashRouter>
)
