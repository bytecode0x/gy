import { SuperCoreLayerMessage } from 'lib/event/interface'
import { EventHandlerJS, EventHandlerNode, EventInterface } from 'lib/event/object'
import { AliasUnion, ComponentUnion, ContentScriptToBackgroundMeta, PopupToBackgroundMeta } from 'type'
import { v4 } from 'uuid'

let backgroundPopup: EventInterface<'BACKGROUND', 'POPUP', PopupToBackgroundMeta>

export function initBackgroundToPopupEventInterface(
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
  backgroundPopup = new EventInterface<'BACKGROUND', 'POPUP', PopupToBackgroundMeta>({
    from: 'BACKGROUND',
    to: 'POPUP',
    name: 'background-to-contentscript',
    id: v4(),
    async egress(message) {
      /**
       * mutating original object is bad idea
       * especially when you register several event listeners on a event
       * It will affect on the others
       */
      // delete message.native.reply
      // delete message.native.sender

      return chrome.runtime.sendMessage({ ...message, native: {} } as SuperCoreLayerMessage)
    },

    init() {}
  })

  return backgroundPopup
}

export function getBackgroundToPopupEventInterface() {
  if (!backgroundPopup) throw new Error(`background-to-contentscript event interface is not initialized`)
  return backgroundPopup
}
