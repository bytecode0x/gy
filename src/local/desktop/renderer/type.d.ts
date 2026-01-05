import type { EventHandlerNode } from 'lib/event/object'
import { AliasUnion, MainToRendererMeta } from 'lib/event/type'

declare global {
  interface Window {
    eh: EventHandlerNode<ComponentUnion, 'RENDERER', AliasUnion, AliasUnion, { MAIN: MainToRendererMeta }>
  }
}
