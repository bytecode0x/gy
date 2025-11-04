import { EventHandlerNode } from 'lib/event/object'
import { AliasUnion, ComponentUnion, RendererToMainMeta } from 'type'

let eh: EventHandlerNode<ComponentUnion, 'MAIN', AliasUnion, 'MAIN', { RENDERER: RendererToMainMeta }>

export function initEvHandler() {
  eh = new EventHandlerNode<ComponentUnion, 'MAIN', AliasUnion, 'MAIN', { RENDERER: RendererToMainMeta }>({
    id: '0',
    component: 'MAIN',
    alias: 'MAIN',
    nextHopTable: {
      RENDERER: 'RENDERER',
      MAIN: 'MAIN',
      BACKGROUND: 'BACKGROUND',
      CONTENT_SCRIPT: 'BACKGROUND',
      SERVER: 'SERVER',
      MAIN_WORLD: 'BACKGROUND',
      POPUP: 'BACKGROUND'
    },
    interfaceTable: {}
  })
}

export function getEvHandler() {
  return eh
}
