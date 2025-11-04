import { EventHandlerJS, EventHandlerNode, EventInterface } from 'lib/event/object'
import { SuperCoreLayerMessage } from 'lib/event/type'
import { AliasUnion, BackgroundToPopupMeta, ComponentUnion } from 'type'

import { v4 } from 'uuid'

let popupBackground: EventInterface<'POPUP', 'BACKGROUND'>

export function initPopupToBackgroundEventInterface(
  eh:
    | EventHandlerJS<ComponentUnion, 'POPUP', AliasUnion, 'POPUP', { BACKGROUND: BackgroundToPopupMeta }>
    | EventHandlerNode<ComponentUnion, 'POPUP', AliasUnion, 'POPUP', { BACKGROUND: BackgroundToPopupMeta }>
) {
  popupBackground = new EventInterface<'POPUP', 'BACKGROUND'>({
    from: 'POPUP',
    to: 'BACKGROUND',
    name: 'popup-to-background',
    id: v4(),
    async egress(message) {
      return chrome.runtime.sendMessage({ ...message, native: {} } as SuperCoreLayerMessage)
    },
    init() {
      chrome.runtime.onMessage.addListener(function (message, sender, reply) {
        // const message = JSON.parse(raw) as SuperCoreLayerMessage
        Object.assign(message.meta, { native: { sender, reply } })
        eh.signal(message)
        // return true
      })
    }
  })

  return popupBackground
}

export function getPopupToBackgroundEventInterface() {
  if (!popupBackground) throw new Error(`contentscript-to-background event interface is not initialized`)
  return popupBackground
}
