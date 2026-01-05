import { SuperCoreLayerMessage } from 'lib/event/interface'
import { EventHandlerJS, EventHandlerNode, EventInterface } from 'lib/event/object'
import { AliasUnion, ComponentUnion, ContentScriptToBackgroundMeta } from 'lib/event/type'
import { v4 } from 'uuid'

import { getSocketClient, initSocketClient } from '../../infra/socket-client'

let backgroundMain: EventInterface<'BACKGROUND', 'MAIN'>

export function initBackgroundToMainEventInterface(
  eh:
    | EventHandlerJS<
        ComponentUnion,
        'BACKGROUND',
        AliasUnion,
        'BACKGROUND',
        { CONTENT_SCRIPT: ContentScriptToBackgroundMeta }
      >
    | EventHandlerNode<
        ComponentUnion,
        'BACKGROUND',
        AliasUnion,
        'BACKGROUND',
        { CONTENT_SCRIPT: ContentScriptToBackgroundMeta }
      >
) {
  backgroundMain = new EventInterface<'BACKGROUND', 'MAIN'>({
    from: 'BACKGROUND',
    to: 'MAIN',
    name: 'background-to-main',
    id: v4(),
    async egress(message) {
      const socketClient = getSocketClient()
      if (socketClient && socketClient.readyState === socketClient.OPEN)
        return socketClient.send(JSON.stringify({ ...message, native: {} } as SuperCoreLayerMessage))

      return (
        initSocketClient()
          // .catch(function () {
          //   evHandler.removeInterface('MAIN')
          // })
          .then(function () {
            eh.addInterface('MAIN', initBackgroundToMainEventInterface(eh))
            getSocketClient().send(JSON.stringify({ ...message, native: {} } as SuperCoreLayerMessage))
          })
      )
    },

    init() {
      const socketClient = getSocketClient()

      socketClient.addEventListener('close', handleClose)
      socketClient.addEventListener('error', handleError)
      // @ts-ignore
      socketClient.addEventListener('message', handleMessage)

      function handleClose() {
        cleanup()
      }

      function handleError() {
        cleanup()
      }

      function cleanup() {
        socketClient.removeEventListener('close', handleClose)
        socketClient.removeEventListener('error', handleError)
        // @ts-ignore
        socketClient.removeEventListener('message', handleMessage)
      }

      function handleMessage({ data }: { data: any }) {
        try {
          const message = JSON.parse(data.toString())

          /**
           * Ping is implemented in application layer
           */

          /**
           * validate JSON structure maybe
           */

          eh.signal(message)
        } catch (e: any) {
          console.error(e, { source: 'background-to-main' })
        }
      }
    }
  })

  return backgroundMain
}

export function getBackgroundToMainEventInterface() {
  if (!backgroundMain) throw new Error(`background-to-main event interface is not initialized`)
  return backgroundMain
}
