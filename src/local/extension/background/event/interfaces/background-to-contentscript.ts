import { SuperCoreLayerMessage } from 'lib/event/interface'
import { EventHandlerJS, EventHandlerNode, EventInterface } from 'lib/event/object'
import { AliasUnion, ComponentUnion, ContentScriptToBackgroundMeta } from 'type'
import { v4 } from 'uuid'

let backgroundContentScript: EventInterface<'BACKGROUND', 'CONTENT_SCRIPT', ContentScriptToBackgroundMeta>

export function initBackgroundToContentScriptEventInterface(
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
  backgroundContentScript = new EventInterface<'BACKGROUND', 'CONTENT_SCRIPT', ContentScriptToBackgroundMeta>({
    from: 'BACKGROUND',
    to: 'CONTENT_SCRIPT',
    name: 'background-to-contentscript',
    id: v4(),
    async egress(message) {
      /**
       * mutating original object is bad idea
       * especially when you register several event listeners on a event
       * It will affect on the others
       */

      if (message.meta.receiver.component !== 'CONTENT_SCRIPT')
        throw Error(
          `you can't send a message directly to ${message.meta.receiver.component}\nuse pipe or invoke instead`
        )

      // console.log(`sending message to contentscript, book : `, evHandler.book)

      const id = (
        'id' in message.meta.receiver ? message.meta.receiver.id : eh._getId(message.meta.receiver.alias as AliasUnion)
      ) as number

      return chrome.tabs.sendMessage(id, {
        ...message,
        meta: { ...message.meta, receiver: { component: 'CONTENT_SCRIPT', id } }
      } as SuperCoreLayerMessage)
    },

    init() {}
  })

  return backgroundContentScript
}

export function getBackgroundToContentScriptEventInterface() {
  if (!backgroundContentScript) throw new Error(`background-to-contentscript event interface is not initialized`)
  return backgroundContentScript
}
