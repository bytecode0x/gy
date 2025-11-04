import { ipcRenderer } from 'electron'
import { EventHandlerNode } from 'lib/event/object'
import { AliasUnion, ComponentUnion, MainToRendererMeta } from 'type'
import { initRendererToMainEventInterface } from './interface'

declare global {
  interface Window {
    eh: EventHandlerNode<ComponentUnion, 'RENDERER', AliasUnion, AliasUnion, { MAIN: MainToRendererMeta }>
  }
}

const webContentsId = ipcRenderer.sendSync('__ID__') as number

const eh = new EventHandlerNode<
  ComponentUnion,
  'RENDERER',
  AliasUnion,
  'DIALOG',
  { RENDERER: {}; MAIN: MainToRendererMeta; BACKGROUND: {}; SERVER: {}; CONTENT_SCRIPT: {}; MAIN_WORLD: {} }
>({
  id: webContentsId,
  component: 'RENDERER',
  alias: 'DIALOG',
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
