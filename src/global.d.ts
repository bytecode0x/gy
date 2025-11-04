declare global {
  interface Window {
    eh: EventHandlerNode<ComponentUnion, 'RENDERER', AliasUnion, 'USER', { MAIN: MainToRendererMeta }>
    t: string
  }
}
