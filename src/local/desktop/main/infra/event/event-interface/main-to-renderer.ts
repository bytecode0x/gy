import { ipcMain, webContents } from 'electron'
import { SuperCoreLayerMessage } from 'lib/event/interface/message'
import { EventHandlerJS, EventHandlerNode, EventInterface } from 'lib/event/object'
import { AliasUnion, ComponentUnion, RendererToMainMeta } from 'lib/event/type'
import { v4 } from 'uuid'

let mainRendererInterface: EventInterface<'MAIN', 'RENDERER', RendererToMainMeta>

export function initMainToRendererEventInterface(
  eh:
    | EventHandlerJS<ComponentUnion, 'MAIN', AliasUnion, AliasUnion, { RENDERER: RendererToMainMeta }>
    | EventHandlerNode<ComponentUnion, 'MAIN', AliasUnion, AliasUnion, { RENDERER: RendererToMainMeta }>
) {
  mainRendererInterface = new EventInterface<'MAIN', 'RENDERER', RendererToMainMeta>({
    from: 'MAIN',
    to: 'RENDERER',
    name: 'main-to-renderer',
    id: v4(),
    async egress(message: SuperCoreLayerMessage<RendererToMainMeta>) {
      // console.log('before validation : ', message)
      if (message.meta.msgId === '' && message.meta.synchronous && message.meta.native?.ipcMainEvent) {
        // console.log('replying synch : ', message)

        message.meta.native.ipcMainEvent.returnValue = message.payload
        return
      }

      /**
       * mutating original object is bad idea
       * especially when you register several event listeners on a event
       * It will affect on the others
       */
      // delete message.native.ipcMainEvent
      // delete message.native.ipcRendererEvent
      // delete message.meta.synchronous

      const id =
        'id' in message.meta.receiver ? message.meta.receiver.id : eh._getId(message.meta.receiver.alias as AliasUnion)

      if (typeof id !== 'number') throw new Error('MAIN_TO_RENDERER_INTERFACE::ID_MUST_BE_NUMBER')
      const wc = webContents.fromId(id)
      if (!wc) throw new Error('NO_RENDERER_MATCHED')
      wc.send('__EVENT__', { ...message } as SuperCoreLayerMessage)
    },

    init() {
      ipcMain.on('__EVENT__', (e, message: SuperCoreLayerMessage) => {
        if (message.meta.receiver.component === 'MAIN')
          Object.assign(message.meta, { native: { ipcMainEvent: e } } as RendererToMainMeta)

        eh.signal(message)
      })
    }
  })

  return mainRendererInterface
}

export function getMainToRendererEventInterface() {
  if (!mainRendererInterface) throw new Error('main-to-renderer event interface is not initialized')
  return mainRendererInterface
}
