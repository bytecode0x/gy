import { SuperCoreLayerMessage } from 'lib/event/interface'
import { EventHandlerJS, EventInterface } from 'lib/event/object'
import { AliasUnion, BackgroundToContentScriptMeta, ComponentUnion } from 'lib/event/type'
import { v4 } from 'uuid'

let contentScriptBackground: EventInterface<'CONTENT_SCRIPT', 'BACKGROUND', BackgroundToContentScriptMeta>

export function initContentScriptToBackgroundEventInterface({
  eh
}: {
  eh: EventHandlerJS<
    ComponentUnion,
    'CONTENT_SCRIPT',
    AliasUnion,
    AliasUnion,
    { BACKGROUND: BackgroundToContentScriptMeta }
  >
}) {
  contentScriptBackground = new EventInterface<'CONTENT_SCRIPT', 'BACKGROUND'>({
    from: 'CONTENT_SCRIPT',
    to: 'BACKGROUND',
    name: 'contentscript-to-background',
    id: v4(),
    async egress(message) {
      return chrome.runtime.sendMessage({ ...message, native: {} } as SuperCoreLayerMessage)
    },

    init() {
      chrome.runtime.onMessage.addListener(function (message, sender, reply) {
        Object.assign(message.meta, { native: { sender, reply } })
        eh.signal(message)
        // return true
      })
    }
  })

  return contentScriptBackground
}

export function getContentScriptToBackgroundEventInterface() {
  if (!contentScriptBackground) throw new Error(`contentscript-to-background event interface is not initialized`)
  return contentScriptBackground
}
