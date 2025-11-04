import { EventHandlerJS, EventInterface } from 'lib/event/object'
import { EventMatrix, SuperCoreLayerMessage } from 'lib/event/type'
import { ContentScriptToMainWorldMeta } from 'type'
import { AliasUnion, ComponentUnion } from 'type/app'
import { v4 } from 'uuid'

/**
 * this interface is send only
 */
let mainWorldContentScript: EventInterface<'MAIN_WORLD', 'CONTENT_SCRIPT'>

export function initMainWorldToContentScriptEventInterface({
  eh,
  secret
}: {
  eh: EventHandlerJS<
    ComponentUnion,
    'MAIN_WORLD',
    AliasUnion,
    AliasUnion,
    { CONTENT_SCRIPT: ContentScriptToMainWorldMeta }
  >
  secret?: string
}) {
  mainWorldContentScript = new EventInterface<'MAIN_WORLD', 'CONTENT_SCRIPT'>({
    from: 'MAIN_WORLD',
    to: 'CONTENT_SCRIPT',
    name: 'contentscript-to-mainworld',
    id: v4(),
    secret,
    async egress(message) {
      // window.addEventListener('message', function handleEvent(e) {
      //   const reply = e.data as SuperCoreLayerMessage

      //   if (
      //     !reply.meta ||
      //     reply.name !== message.meta.msgId ||
      //     reply.meta.sender.component !== 'MAIN_WORLD' ||
      //     reply.meta.receiver.component !== 'CONTENT_SCRIPT' ||
      //     e.origin !== window.location.origin ||
      //     e.source !== window
      //   )
      //     return

      //   window.removeEventListener('message', handleEvent)

      //   // console.log('reply from main world : ', reply)

      //   evHandler.signal(reply)
      // })

      window.postMessage(
        { ...message, native: {}, meta: { ...message.meta, secret } } as SuperCoreLayerMessage,
        window.location.origin
      )
    },

    init() {
      window.addEventListener('message', function handleEvent(e) {
        const reply = e.data as Parameters<
          Parameters<
            typeof eh.onEvent<EventMatrix<string, ComponentUnion, ComponentUnion, any, any>, 'CONTENT_SCRIPT'>
          >['1']
        >['0']

        if (
          !reply.meta ||
          !reply.meta.secret ||
          reply.meta.sender.component !== 'CONTENT_SCRIPT' ||
          reply.meta.secret !== secret ||
          e.origin !== window.location.origin ||
          e.source !== window
        )
          return

        // @ts-ignore
        eh.signal(reply)
      })
    }
  })

  return mainWorldContentScript
}

export function getMainWorldToContentScriptEventInterface() {
  if (!mainWorldContentScript) throw new Error(`contentscript-to-mainworld event interface is not initialized`)
  return mainWorldContentScript
}
