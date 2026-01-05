import { SuperCoreLayerMessage } from 'lib/event/interface/message'
import { EventHandlerNode, EventInterface } from 'lib/event/object'
import { AliasUnion, ComponentUnion } from 'lib/event/type'
import { v4 } from 'uuid'
import { getExtensionSocket } from '../../socket-server'

let mainBackgroundInterface: EventInterface<'MAIN', 'BACKGROUND'>

export function initMainToBackgroundEventInterface(
  eh: EventHandlerNode<ComponentUnion, 'MAIN', AliasUnion, AliasUnion, {}>
) {
  // const socketServer = getSocketServer()

  mainBackgroundInterface = new EventInterface<'MAIN', 'BACKGROUND'>({
    name: 'main-to-background',
    id: v4(),
    from: 'MAIN',
    to: 'BACKGROUND',
    async egress(message) {
      const extension = getExtensionSocket()
      if (!extension || extension.readyState !== extension.OPEN)
        /**
         * reconnection is up to client
         */
        throw new Error('extension socket is not established or opened')
      extension.send(JSON.stringify({ ...message, native: {} } as SuperCoreLayerMessage))
    },
    init() {
      //
    }
  })

  // evHandler.addInterface('BACKGROUND', mainBackgroundInterface)
  return mainBackgroundInterface
}

export function getMainToBackgroundEventInterface() {
  if (!mainBackgroundInterface) throw new Error('main-to-background event interface is not initialized')
  return mainBackgroundInterface
}
