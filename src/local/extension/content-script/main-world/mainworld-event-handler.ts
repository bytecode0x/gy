import { EventHandlerJS } from 'lib/event/object'
import { AliasUnion, ComponentUnion, ContentScriptToMainWorldMeta } from 'lib/event/type'
import { initMainWorldToContentScriptEventInterface } from './mainworld-to-contentscript'

let eh: EventHandlerJS<
  ComponentUnion,
  'MAIN_WORLD',
  AliasUnion,
  AliasUnion,
  {
    CONTENT_SCRIPT: ContentScriptToMainWorldMeta
  }
>

export function initMainWorldEvHandler({ secret }: { secret: string }) {
  eh = new EventHandlerJS<
    ComponentUnion,
    'MAIN_WORLD',
    AliasUnion,
    AliasUnion,
    {
      CONTENT_SCRIPT: ContentScriptToMainWorldMeta
    }
  >({
    component: 'MAIN_WORLD',
    id: 0,
    nextHopTable: {
      MAIN_WORLD: 'CONTENT_SCRIPT',
      BACKGROUND: 'CONTENT_SCRIPT',
      CONTENT_SCRIPT: 'CONTENT_SCRIPT',
      MAIN: 'CONTENT_SCRIPT',
      POPUP: 'CONTENT_SCRIPT',
      RENDERER: 'CONTENT_SCRIPT',
      SERVER: 'CONTENT_SCRIPT'
    },
    interfaceTable: {}
  })

  eh.addInterface('CONTENT_SCRIPT', initMainWorldToContentScriptEventInterface({ eh, secret }))

  return eh
}

function registerListeners() {}

export function getEvHandler() {
  return eh
}

// case : root is head of the item tree
