import { CoreLayerMessage, SuperCoreLayerMessage, SuperEvent, SuperEventMatrix } from 'lib/event/interface'
import { ContentScriptLoaded, Echo, Eval, GetCacheItem, HandShake, Pipe } from 'lib/event/sementic'
import { ComponentUnion } from 'lib/event/type'
import { neo } from 'lib/gy/core/instance'
import { assertDOMMutation, assertRedirection, getDocuments, onLoad } from 'lib/util/dom/common'
import { initMainWorldEvHandler } from './mainworld-event-handler'

/**
 * prevent fetch to get garbage colltected from overwriting
 */

// console.log('main world script loaded')
const storage: Record<string, any> = {}

const global: Record<string, any> = {
  neo,
  setStorageItem,
  getStorageItem
}

const $fetch = window.fetch
const $log = console.log
const $eval = window.eval
const $postMessage = window.postMessage

const ready = Promise.all([onLoad(), assertRedirection()]).then(function () {
  return assertDOMMutation(
    ...getDocuments()
      .filter((doc) => doc.documentElement)
      .map((doc) => doc.documentElement)
  )
})

window.addEventListener('message', async function handshake(e) {
  // const { name, payload, meta, err  } = e.data as Forward<Actions>
  const { name, payload, meta } = e.data as CoreLayerMessage<HandShake>
  if (
    name !== 'HANDSHAKE' ||
    !meta ||
    !meta.msgId ||
    meta.receiver.component !== 'MAIN_WORLD' ||
    meta.sender.component !== 'CONTENT_SCRIPT' ||
    !('id' in meta.receiver) ||
    e.origin !== window.location.origin ||
    e.source !== window
  )
    return

  window.fetch = $fetch
  window.eval = $eval
  window.postMessage = $postMessage
  console.log = $log

  if (!payload.secret) return $log('failed to send message to the extension')

  $log(`main-world initialized`)

  const tabId = (meta.sender as Extract<CoreLayerMessage['meta']['sender'], { id: number | string }>).id

  /**
   * sender must be CONTENT_SCRIPT
   */
  const eh = initMainWorldEvHandler({ secret: payload.secret })

  eh.onEvent<Pipe<SuperEvent<ComponentUnion, 'MAIN_WORLD'>>>('PIPE', function ({ name, payload, meta }) {
    return eh.sendEvent<SuperEventMatrix<ComponentUnion, 'MAIN_WORLD'>>(payload)
  })

  eh.onEvent<Echo>('ECHO', async function (e) {
    console.log(`content-script echo : ${e.payload}`)
    return e.payload
  })

  // eh.onEvent<ConsoleLog>('CONSOLE_LOG', function ({ payload }) {
  //   console.log(payload)
  // })

  eh.onEvent<ContentScriptLoaded>('CONTENT_SCRIPT_LOADED', function ({ name, payload, meta }) {
    return ready
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

  $postMessage(
    {
      name: meta.msgId,
      payload: undefined,
      meta: { sender: { component: 'MAIN_WORLD', id: 0 }, receiver: meta.sender, msgId: '', secret: payload.secret }
    } as SuperCoreLayerMessage,
    '*'
  )

  window.removeEventListener('message', handshake)
})

function setStorageItem({ key, value }: { key: string; value: any }) {
  storage[key] = value
}

function getStorageItem({ key }: { key: string }) {
  return storage[key]
}
