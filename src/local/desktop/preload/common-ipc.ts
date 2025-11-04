import { EventHandlerNode } from 'lib/event/object'
import { SuperEvent, SuperEventMatrix } from 'lib/event/type'
import { ConsoleLog, Echo, Eval, GetMatrixFromEdr, Pipe } from 'sementic_events'
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

  eh.onEvent<Eval>('EVAL', async function ({ name, payload, meta }) {
    const {
      code,
      params,
      meta: { edrKey }
    } = payload

    // $log('eval: ', payload)

    // eslint-disable-next-line no-empty-function
    const AsyncFunction = async function () {}.constructor

    const prxy = params.find((p) => p.id === 'prxy')?.value || {}

    // @ts-ignore
    const f = new AsyncFunction(...Object.keys(global), ...params.map((param) => param.id), 'prxy', code)

    // if (process.env.NODE_ENV !== 'production') Object.assign(window, { mainHandler: evHandler })

    const returnValue = await f(
      ...Object.values(global),
      ...params.map((param) => param.value),
      new Proxy(prxy, {
        get(target, p, receiver) {
          if (p in target) return Promise.resolve(target[p as string])

          return eh.sendEvent<GetMatrixFromEdr>({
            name: 'GET_MATRIX_FROM_EDR',
            payload: { edrKey, substitute: p as string },
            meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
          })
        }
      })
    )

    return returnValue
  })
}
