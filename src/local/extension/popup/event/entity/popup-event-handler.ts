import { EventHandlerJS } from 'lib/event/object'
import { AliasUnion, BackgroundToPopupMeta, ComponentUnion } from 'lib/event/type'

let evHandler: EventHandlerJS<
  ComponentUnion,
  'POPUP',
  AliasUnion,
  'POPUP',
  {
    BACKGROUND: BackgroundToPopupMeta
  }
>

export function initEventHandler() {
  evHandler = new EventHandlerJS<
    ComponentUnion,
    'POPUP',
    AliasUnion,
    'POPUP',
    {
      BACKGROUND: BackgroundToPopupMeta
    }
  >({
    alias: 'POPUP',
    component: 'POPUP',
    id: 0,
    nextHopTable: {
      MAIN_WORLD: 'BACKGROUND',
      BACKGROUND: 'BACKGROUND',
      CONTENT_SCRIPT: 'BACKGROUND',
      MAIN: 'BACKGROUND',
      POPUP: 'BACKGROUND',
      RENDERER: 'BACKGROUND',
      SERVER: 'BACKGROUND'
    },
    interfaceTable: {}
  })

  return evHandler
}

export function getEvHandler() {
  if (!evHandler) throw new Error('event handler is not initialized')
  return evHandler
}
