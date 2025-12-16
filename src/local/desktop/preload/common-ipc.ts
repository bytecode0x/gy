import { EventHandlerNode } from 'lib/event/object'
import { SuperEvent, SuperEventMatrix } from 'lib/event/type'
import { ConsoleLog, Echo, Eval, GetCacheItem, Pipe } from 'sementic_events'
import { AliasUnion, ComponentUnion, MainToRendererMeta } from 'type'

export function registerCommonPreloadIpcEventListeners(
  eh: EventHandlerNode<
    ComponentUnion,
    'RENDERER',
    AliasUnion,
    AliasUnion,
    {
      RENDERER: {}
      MAIN: MainToRendererMeta
      BACKGROUND: {}
      SERVER: {}
      CONTENT_SCRIPT: {}
      MAIN_WORLD: {}
    }
  >
) {
  eh.onEvent<Pipe<SuperEvent<ComponentUnion, 'RENDERER'>>>('PIPE', function ({ name, payload, meta }) {
    return eh.sendEvent<SuperEventMatrix<ComponentUnion, 'RENDERER'>>(payload)
  })

  eh.onEvent<Echo>('ECHO', async function (e) {
    return e.payload
  })

  eh.onEvent<ConsoleLog>('CONSOLE_LOG', function ({ payload }) {
    console.log(payload)
  })

  eh.onEvent<Eval>('EVAL', async function ({ name, payload }) {
    const { code, params, meta } = payload

    // $log('eval: ', payload)

    // eslint-disable-next-line no-empty-function
    const AsyncFunction = async function () {}.constructor

    const prxy = params?.prxy || {}

    // @ts-ignore
    const f = new AsyncFunction(...Object.keys(global), ...Object.keys(params || {}), 'prxy', code)

    // if (process.env.NODE_ENV !== 'production') Object.assign(window, { mainHandler: evHandler })

    const returnValue = await f(
      ...Object.values(global),
      ...Object.values(params || {}),
      new Proxy(prxy, {
        get(target, p, receiver) {
          if (p in target) return Promise.resolve(target[p as string])

          if (meta?.cacheKey)
            return eh.sendEvent<GetCacheItem>({
              name: 'GET_CACHE_ITEM',
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } },
              payload: { keySequence: [meta.cacheKey, p as string] }
            })

          return Promise.resolve()
        }
      })
    )

    return returnValue
  })
}
