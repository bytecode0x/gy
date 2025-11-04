import { ipcRenderer } from 'electron'
import { EventHandlerNode } from 'lib/event/object'
import OpenAI from 'openai'
import { AliasUnion, ComponentUnion, MainToRendererMeta } from 'type'
import { initRendererToMainEventInterface } from './interface/renderer-to-main'

declare global {
  interface Window {
    eh: EventHandlerNode<ComponentUnion, 'RENDERER', AliasUnion, AliasUnion, { MAIN: MainToRendererMeta }>
    initOpenAI: (apiKey: string) => OpenAI
  }
}

const webContentsId = ipcRenderer.sendSync('__ID__') as number

const evHandler = new EventHandlerNode<
  ComponentUnion,
  'RENDERER',
  AliasUnion,
  AliasUnion,
  { MAIN: MainToRendererMeta }
>({
  id: webContentsId,
  component: 'RENDERER',

  nextHopTable: {
    MAIN_WORLD: 'MAIN',
    BACKGROUND: 'MAIN',
    CONTENT_SCRIPT: 'MAIN',
    MAIN: 'MAIN',
    POPUP: 'MAIN',
    RENDERER: 'MAIN',
    SERVER: 'MAIN'
  },
  interfaceTable: {}
})

const rendererMainInterface = initRendererToMainEventInterface(evHandler)

evHandler.addInterface('MAIN', rendererMainInterface)

window.eh = evHandler

window.initOpenAI = (apiKey: string) => new OpenAI({ apiKey, dangerouslyAllowBrowser: true })
