import Select from 'lib/component/Select'
import { SuperEvent, SuperEventMatrix } from 'lib/event/interface'
import { EventHandlerJS } from 'lib/event/object'
import {
  ConsoleLog,
  Echo,
  HandShake,
  HideApp,
  MountApp,
  Pipe,
  SetState,
  ShowApp,
  Subcontract,
  UnmountApp
} from 'lib/event/sementic'
import { AliasUnion, BackgroundToContentScriptMeta, ComponentUnion } from 'lib/event/type'
import { onLoading } from 'lib/util/dom/common'
import {
  __Action__Click,
  __Action__Scrape,
  __Action__Select,
  ActionPreset
} from 'local/desktop/main/gy/type/action.preset'
import { hideApp, mountApp, showApp, unmountApp } from 'local/extension/content-script/functions/app'
import { createRoot } from 'react-dom/client'
import { ExtensionStore } from 'type'
import { v4 } from 'uuid'
import { getStore } from '../../store'
import { structurize } from '../../subcontractor/scrape'
import { initContentScriptToBackgroundEventInterface } from '../interfaces/contentscript-to-background'
import { initContentScriptToMainWorldEventInterface } from '../interfaces/contentscript-to-mainworld'

declare global {
  namespace ContentScript {
    interface Window {
      eh: EventHandlerJS<
        ComponentUnion,
        'CONTENT_SCRIPT',
        AliasUnion,
        AliasUnion,
        { BACKGROUND: BackgroundToContentScriptMeta }
      >
    }
  }
}

let eh: EventHandlerJS<
  ComponentUnion,
  'CONTENT_SCRIPT',
  AliasUnion,
  AliasUnion,
  { BACKGROUND: BackgroundToContentScriptMeta }
>

export async function initContentEvHandler() {
  const tabId = (await chrome.runtime.sendMessage({
    name: 'GET_TAB_ID',
    meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
  })) as number

  eh = new EventHandlerJS<
    ComponentUnion,
    'CONTENT_SCRIPT',
    AliasUnion,
    AliasUnion,
    { BACKGROUND: BackgroundToContentScriptMeta }
  >({
    component: 'CONTENT_SCRIPT',

    id: tabId,
    nextHopTable: {
      MAIN_WORLD: 'MAIN_WORLD',
      BACKGROUND: 'BACKGROUND',
      CONTENT_SCRIPT: 'BACKGROUND',
      MAIN: 'BACKGROUND',
      POPUP: 'BACKGROUND',
      RENDERER: 'BACKGROUND',
      SERVER: 'BACKGROUND'
    },
    interfaceTable: {}
  })

  eh.addInterface('BACKGROUND', initContentScriptToBackgroundEventInterface({ eh }))

  const secret = v4()
  eh.addInterface('MAIN_WORLD', initContentScriptToMainWorldEventInterface({ eh, secret }))

  // if (process.env.NODE_ENV !== 'production') window.contenteh = eh

  registerListeners()

  await eh.sendEvent<HandShake>({
    name: 'HANDSHAKE',
    payload: { secret },
    meta: { receiver: { component: 'MAIN_WORLD', id: 0 } }
  })

  await eh.sendEvent<Echo>({
    name: 'ECHO',
    payload: 'echo message from content script',
    meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
  })

  await eh
    .sendEvent<Echo>({
      name: 'ECHO',
      payload: 'echo message from content script',
      meta: { receiver: { component: 'MAIN_WORLD', id: 0 } }
    })
    .then((response) => console.log('get response from main-world : ', response))

  // if (document.readyState === 'complete')
  //   Promise.all(
  //     Array.from(document.querySelectorAll('iframe')).map(function (iframe) {
  //       return new Promise<void>(function (resolve, reject) {
  //         if (iframe.contentDocument!.readyState === 'complete') return resolve()

  //         iframe.contentDocument!.addEventListener('readystatechange', function () {
  //           if (iframe.contentDocument!.readyState === 'complete') return resolve()
  //         })
  //       })
  //     })
  //   ).then(function () {
  //     return eh.sendEvent<ContentScriptLoaded>({
  //       name: 'CONTENT_SCRIPT_LOADED',
  //       meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
  //     })
  //   })
  // else
  //   document.addEventListener('readystatechange', function () {
  //     if (document.readyState === 'complete')
  //       Promise.all(
  //         Array.from(document.querySelectorAll('iframe'))
  //           .filter((iframe) => iframe.contentDocument)
  //           .map(function (iframe) {
  //             return new Promise<void>(function (resolve, reject) {
  //               if (iframe.contentDocument!.readyState === 'complete') return resolve()

  //               iframe.contentDocument!.addEventListener('readystatechange', function () {
  //                 if (iframe.contentDocument!.readyState === 'complete') return resolve()
  //               })
  //             })
  //           })
  //       ).then(function () {
  //         return eh.sendEvent<ContentScriptLoaded>({
  //           name: 'CONTENT_SCRIPT_LOADED',
  //           meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
  //         })
  //       })
  //     // window.setTimeout(function () {
  //     // }, 5000)
  //   })

  // eh.sendEvent<Pipe<Echo>>('PIPE', {
  //   name: 'ECHO',
  //   target: 'MAIN',
  //   payload: 'PIPE ECHO FROM CONTENT_SCRIPT',
  //   meta: {}
  // })
}

function registerListeners() {
  eh.onEvent<Pipe<SuperEvent<ComponentUnion, 'CONTENT_SCRIPT'>>>('PIPE', function ({ name, payload, meta }) {
    return eh.sendEvent<SuperEventMatrix<ComponentUnion, 'CONTENT_SCRIPT'>>(payload)
  })

  eh.onEvent<ConsoleLog>('CONSOLE_LOG', function ({ name, payload, meta }) {
    return console.log('log: ', payload)
  })

  eh.onEvent<MountApp>('MOUNT_APP', async function ({ payload: store }) {
    console.log('init store : ', store)

    return mountApp(store)
  })

  eh.onEvent<SetState<ExtensionStore>>('SET_STATE', function ({ name, payload, meta }) {
    console.log('set state on contentscript: ', payload)
    getStore().getState().setState(payload)
  })

  eh.onEvent<UnmountApp>('UNMOUNT_APP', async function (e) {
    unmountApp()
    const store = { ...getStore().getState() }

    getStore().destroy()

    console.log('unmounting app; store : ', store)

    return store
  })

  eh.onEvent<HideApp>('HIDE_APP', hideApp)

  eh.onEvent<ShowApp>('SHOW_APP', showApp)

  eh.onEvent<Echo>('ECHO', async function (e) {
    console.log(`content-script echo : ${e.payload}`)
    return e.payload
  })

  /**
   * content script does what background tells to do
   * but sometimes it needs to do voluntarily without supervision
   * that's the subcontract from background
   */

  eh.onEvent<Subcontract<ActionPreset>>('SUBCONTRACT', async function ({ payload }) {
    eh.sendEvent<ConsoleLog>({
      name: 'CONSOLE_LOG',
      payload: [`subcontract being done : ${document.location.href}`, payload],
      meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
    })

    switch (payload.action.template) {
      case 'SCRAPE': {
        await onLoading(document)
        const { action, command, context } = payload as Subcontract<__Action__Scrape>['payload']
        const { origin, items, pagination, scroll } = action.value

        if (scroll) {
          await Promise.all(
            Array.from(
              new Set(
                items
                  .filter((i): i is Required<__Action__Scrape['value']['items'][number]> =>
                    i.query.some((q) => !!q.frame)
                  )

                  .flatMap((i) =>
                    Array.from(window.top!.document.querySelectorAll(i.query.map((q) => q.frame).join(', '))).map(
                      (iframe) => (iframe as HTMLIFrameElement).contentDocument?.scrollingElement
                    )
                  )
              )
            )
              .concat([window.top!.document.scrollingElement])
              .filter((ele): ele is HTMLElement => ele !== undefined)
              .map(
                (scrollingElement) =>
                  new Promise<void>(function (resolve, reject) {
                    if (scrollingElement.scrollHeight === scrollingElement.clientHeight) return resolve()

                    const interval = window.setInterval(function () {
                      scrollingElement.scrollBy(0, 200)
                      if (
                        scrollingElement.scrollHeight ===
                        scrollingElement.scrollTop + scrollingElement.clientHeight
                      ) {
                        window.clearInterval(interval)
                        return resolve()
                      }
                    }, 200)
                  })
              )
          )
        }
        switch (command) {
          case 'scrape': {
            return structurize(items)
          }
          case 'pagination_start': {
            if (!pagination || pagination.start === undefined) return false
            const indexes = Array.from(
              (pagination.frame
                ? ((window.top?.document || document).querySelector(pagination.frame) as HTMLIFrameElement)
                    .contentDocument
                : document)!.querySelectorAll(pagination.selector)
            ) as Array<HTMLAnchorElement>

            const current = indexes.find((i) => i.ownerDocument.defaultView!.location.href === i.href) || indexes[0]

            if (!current) return false

            const url = new URL(current.href)

            // if index exists in url params
            if (pagination.paramKey) {
              const currentIndex = url.searchParams.get(pagination.paramKey)

              if (!currentIndex || !/^\d+$/.test(currentIndex)) return false

              // if (pagination.end && pagination.end === currentIndex) return false

              // if anchor exists in iframe

              url.searchParams.set(pagination.paramKey!, pagination.start!)
              current.href = url.href

              if (pagination.frame) {
                const frame = window.top!.document.querySelector(pagination.frame) as HTMLIFrameElement
                return new Promise<boolean>(function (resolve) {
                  frame.addEventListener('load', function (e) {
                    resolve(true)
                  })
                  current.click()
                })
              }
              return current.click()
            }

            // if index exists in path
            if (pagination.pathIndex) {
              const currentIndex = url.pathname.split('/')[parseInt(pagination.pathIndex, 10)]
              if (!currentIndex || !/^\d+$/.test(currentIndex)) return false
              const nextIndex = `${parseInt(currentIndex, 10) + 1}`
              const pathname = url.pathname
                .split('/')
                .splice(parseInt(pagination.pathIndex, 10), 1, nextIndex)
                .join('/')
              url.pathname = pathname
              current.href = url.href
              // returning undefined for resolving later
              return current.click()
            }

            return false
          }
          case 'pagination_next': {
            if (!pagination) return false
            const indexes = Array.from(
              (pagination.frame
                ? ((window.top?.document || document).querySelector(pagination.frame) as HTMLIFrameElement)
                    .contentDocument
                : document)!.querySelectorAll(pagination.selector)
            ) as Array<HTMLAnchorElement>

            const current = indexes.find((i) => i.ownerDocument.defaultView!.location.href === i.href) || indexes[0]

            if (!current) return false

            const url = new URL(current.href)

            // if index exists in url params
            if (pagination.paramKey) {
              const currentIndex = url.searchParams.get(pagination.paramKey)
              if (!currentIndex || !/^\d+$/.test(currentIndex)) return false
              const nextIndex = `${parseInt(currentIndex, 10) + 1}`

              if (pagination.end && pagination.end === currentIndex) return false

              url.searchParams.set(pagination.paramKey, nextIndex)
              current.href = url.href

              // if anchor exists in iframe
              if (pagination.frame) {
                const frame = window.top!.document.querySelector(pagination.frame) as HTMLIFrameElement
                return new Promise<boolean>(function (resolve) {
                  frame.addEventListener('load', function (e) {
                    resolve(true)
                  })
                  current.click()
                })
              }

              return current.click()
            }

            // if index exists in path
            if (pagination.pathIndex) {
              const currentIndex = url.pathname.split('/')[parseInt(pagination.pathIndex, 10)]
              if (!currentIndex || !/^\d+$/.test(currentIndex)) return false
              const nextIndex = `${parseInt(currentIndex, 10) + 1}`
              const pathname = url.pathname
                .split('/')
                .splice(parseInt(pagination.pathIndex, 10), 1, nextIndex)
                .join('/')
              url.pathname = pathname
              current.href = url.href
              return current.click()
            }

            return false
          }
          default:
            return false
        }

        // if (pagination) {
        // }
      }

      // case 'EVAL_BINDING_TAB': {
      //   await onLoading(document)

      //   const { action, command, context } = payload as Subcontract<EvalBindingTab>['payload']
      //   const { template, value } = action

      //   return Promise.all([
      //     eh.sendEvent<Eval>({
      //       name: 'EVAL',
      //       // payload: {
      //       //   record,
      //       //   context,
      //       //   command
      //       // },
      //       payload: {
      //         code: action.value.code,
      //         params: action.value.params || []
      //       },
      //       meta: { receiver: { component: 'MAIN_WORLD', id: 0 } }
      //     }),
      //     Promise.resolve(window.location.href)
      //   ])
      // }

      case 'CLICK': {
        const { action, command, context } = payload as Subcontract<__Action__Click>['payload']
        const { template, value } = action

        switch (command) {
          case 'calc_offset': {
            const { chromeHeight, screenXOffset, screenYOffset } = context
            if (!chromeHeight) throw new Error('SUBCONTRACT_CLICK_CALC_OFFSET:CHROME_HEIGHT_UNMEASURED')
            const tape = (value as __Action__Click['value']).tapes.at(0)
            if (!tape || tape.context.name === 'screen') return { x: 0, y: 0 }

            const frame =
              tape.context.frame && (document.querySelector(tape.context.frame) as HTMLIFrameElement).contentDocument
            const target = frame ? frame.querySelector(tape.context.id) : document.querySelector(tape.context.id)

            if (!target) throw new Error('SUBCONTRACT_CLICK_CALC_OFFSET:TARGET_ELEMENT_NOT_FOUND')

            target.scrollIntoView()

            const targetRect = target.getBoundingClientRect()
            const frameRect = frame && frame.documentElement.getBoundingClientRect()

            const offsetX =
              window.screenX + targetRect.x + targetRect.width / 2 + screenXOffset + (frameRect ? frameRect.x : 0)
            const offsetY =
              window.screenY +
              targetRect.y +
              targetRect.height / 2 +
              screenYOffset +
              chromeHeight +
              (frameRect ? frameRect.y : 0)

            return { x: offsetX, y: offsetY }
          }
          default: {
            break
          }
        }
        break
      }

      case 'SELECT': {
        const { action, command, context } = payload as Subcontract<__Action__Select>['payload']
        const { template, value } = action
        const { options, labels, separator } = value

        const container = document.body
        const dialog = document.createElement('dialog')
        dialog.style.outline = 'none'
        dialog.style.border = 'none'
        dialog.style.background = 'transparent'

        container.insertAdjacentElement('afterbegin', dialog)
        dialog.showModal()
        const root = createRoot(dialog)

        // const [optionMatrix, labelMatrix] = await Promise.all([
        //   eh.sendEvent<Parse>({
        //     name: 'PARSE',
        //     payload: { raw: options, splitWithEscaped: false },
        //     meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        //   }),
        //   labels
        //     ? eh.sendEvent<Parse>({
        //         name: 'PARSE',
        //         payload: { raw: labels || '', splitWithEscaped: false },
        //         meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        //       })
        //     : Promise.resolve(undefined)
        // ])

        return new Promise<Subcontract<__Action__Select>['returnType']>(function (resolve, reject) {
          root.render(
            <Select
              header={`${action.name} 값을 선택하세요`}
              options={options.map((o) => o.join(separator || String.raw`\,`))}
              labels={labels?.map((l) => l.join(separator || String.raw`\,`))}
              onReject={function (reason) {
                dialog.remove()
                reject(reason)
              }}
              onResolve={function (chosens, indices) {
                dialog.remove()
                const dr = {
                  [action.name]: chosens.map((c) => c.split(String.raw`\,`)),
                  [`${action.name}$index`]: indices.map((i) => [i.toString()])
                }

                if (labels) Object.assign(dr, { [`${action.name}$label`]: indices.map((i) => labels[i]) })

                resolve(dr)
              }}
            />
          )
        })
      }

      default:
        break
    }
  })

  console.log('listeners registered')
}

export function getEvHandler() {
  return eh
}

// case : root is head of the item tree
