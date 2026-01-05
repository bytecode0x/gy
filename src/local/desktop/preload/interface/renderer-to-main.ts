import { ipcRenderer } from 'electron'
import { SuperCoreLayerMessage } from 'lib/event/interface/message'
import { EventHandlerJS, EventHandlerNode, EventInterface } from 'lib/event/object'
import { AliasUnion, ComponentUnion, MainToRendererMeta } from 'lib/event/type'
import { v4 } from 'uuid'

let rendererMainInterface: EventInterface<'RENDERER', 'MAIN'>

export function initRendererToMainEventInterface(
  eh:
    | EventHandlerJS<
        ComponentUnion,
        'RENDERER',
        AliasUnion,
        AliasUnion,
        { RENDERER: {}; MAIN: MainToRendererMeta; BACKGROUND: {}; SERVER: {}; CONTENT_SCRIPT: {}; MAIN_WORLD: {} }
      >
    | EventHandlerNode<
        ComponentUnion,
        'RENDERER',
        AliasUnion,
        AliasUnion,
        { RENDERER: {}; MAIN: MainToRendererMeta; BACKGROUND: {}; SERVER: {}; CONTENT_SCRIPT: {}; MAIN_WORLD: {} }
      >
) {
  rendererMainInterface = new EventInterface<'RENDERER', 'MAIN', MainToRendererMeta>({
    from: 'RENDERER',
    to: 'MAIN',
    name: 'renderer-to-main',
    id: v4(),
    async egress(message) {
      ipcRenderer.send('__EVENT__', message)
    },
    egressSync(message) {
      return ipcRenderer.sendSync('__EVENT__', message)
    },
    init() {
      ipcRenderer.on('__EVENT__', (e, message: SuperCoreLayerMessage) => {
        Object.assign(message.meta, { native: { ipcRendererEvent: e } } as MainToRendererMeta)
        eh.signal(message)
      })
    }
  })

  return rendererMainInterface
}

export function getRendererToMainEventInterface() {
  if (!rendererMainInterface) throw new Error('renderer-to-main event interface is not initialized')
  return rendererMainInterface
}
