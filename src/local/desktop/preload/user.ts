import { ipcRenderer } from 'electron'
import { EventHandlerNode } from 'lib/event/object'
import { edward, neo } from 'lib/gy/core/instance'
import { AliasUnion, ComponentUnion, MainToRendererMeta } from 'type'
import { registerCommonPreloadIpcEventListeners } from './common-ipc'
import { initRendererToMainEventInterface } from './interface'

declare global {
  namespace User {
    interface Window {
      eh: EventHandlerNode<ComponentUnion, 'RENDERER', AliasUnion, AliasUnion, { MAIN: MainToRendererMeta }>
    }
  }
}

const webContentsId = ipcRenderer.sendSync('__ID__') as number

const eh = new EventHandlerNode<
  ComponentUnion,
  'RENDERER',
  AliasUnion,
  'USER',
  { RENDERER: {}; MAIN: MainToRendererMeta; BACKGROUND: {}; SERVER: {}; CONTENT_SCRIPT: {}; MAIN_WORLD: {} }
>({
  id: webContentsId,
  component: 'RENDERER',
  alias: 'USER',
  nextHopTable: {
    MAIN: 'MAIN',
    RENDERER: 'MAIN',
    BACKGROUND: 'MAIN',
    CONTENT_SCRIPT: 'MAIN',
    SERVER: 'MAIN',
    MAIN_WORLD: 'MAIN',
    POPUP: 'MAIN'
  },
  interfaceTable: {}
})

window.eh = eh

const rendererMainInterface = initRendererToMainEventInterface(eh)

eh.addInterface('MAIN', rendererMainInterface)

if (process.env.NODE_ENV !== 'production') Object.assign(window, { neo, edward })

registerCommonPreloadIpcEventListeners(eh)
