import { EventMatrix, SuperCoreLayerMessage } from 'lib/event/interface'
import { EventHandlerJS, EventInterface } from 'lib/event/object'
import { MainWorldToContentScriptMeta } from 'type'
import { AliasUnion, ComponentUnion } from 'type/app'
import { v4 } from 'uuid'

/**
 * this interface is send only
 */
let contentScriptMainWorld: EventInterface<'CONTENT_SCRIPT', 'MAIN_WORLD'>

export function initContentScriptToMainWorldEventInterface({
  eh,
  secret
}: {
  eh: EventHandlerJS<
    ComponentUnion,
    'CONTENT_SCRIPT',
    AliasUnion,
    AliasUnion,
    { MAIN_WORLD: MainWorldToContentScriptMeta }
  >
  secret: string
}) {
  contentScriptMainWorld = new EventInterface<'CONTENT_SCRIPT', 'MAIN_WORLD'>({
    from: 'CONTENT_SCRIPT',
    to: 'MAIN_WORLD',
    name: 'contentscript-to-mainworld',
    id: v4(),
    async egress(message) {
      window.postMessage(
        { ...message, meta: { ...message.meta, secret } } as SuperCoreLayerMessage,
        window.location.origin
      )
    },

    init() {
      window.addEventListener('message', function handleEvent(e) {
        const reply = e.data as Parameters<
          Parameters<
            typeof eh.onEvent<EventMatrix<string, ComponentUnion, ComponentUnion, any, any>, 'MAIN_WORLD'>
          >['1']
        >['0']

        if (
          !reply.meta ||
          !reply.meta.secret ||
          reply.meta.secret !== secret ||
          reply.meta.sender.component !== 'MAIN_WORLD' ||
          e.origin !== window.location.origin ||
          e.source !== window
        )
          return

        // @ts-ignore
        eh.signal(reply)
      })
    }
  })

  return contentScriptMainWorld
}

export function getContentScriptToMainWorldEventInterface() {
  if (!contentScriptMainWorld) throw new Error(`contentscript-to-mainworld event interface is not initialized`)
  return contentScriptMainWorld
}
