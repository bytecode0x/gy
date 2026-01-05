import { NoReply } from 'lib/event/error'
import { SuperEvent, SuperEventMatrix } from 'lib/event/interface'
import { EventHandlerJS } from 'lib/event/object'
import {
    AssertCertificate,
    CheckNativeConnection,
    ConsoleLog,
    ContentScriptLoaded,
    CreateContextMenuItem,
    CreateTab,
    Echo,
    ExtMounted,
    GetGyState,
    GetState,
    GetTab,
    GetTabId,
    InitializeProcess,
    Invoke,
    MountApp,
    Notify,
    Pagination,
    Ping,
    Pipe,
    PopupLaunched,
    QueryTabs,
    RemoveContextMenuItem,
    RemoveTab,
    RenewRequestDetail,
    Subcontract,
    UnmountApp
} from 'lib/event/sementic'
import { DataRecord } from 'lib/gy/core/type/primitive'
import {
    __Action__Click,
    __Action__EvalBindingTab,
    __Action__LoadUrl,
    __Action__Scrape,
    __Action__Select,
    ActionPreset
} from 'local/desktop/main/gy/type/action.preset'
import { AliasUnion, AppStore, ComponentUnion, ContentScriptToBackgroundMeta, PopupToBackgroundMeta } from 'type'
import { getExtensionTab, setExtensionTab, unmountApp } from '../../app'
import { getSocketClient, initSocketClient } from '../../infra/socket-client'
import { initBackgroundToMainEventInterface } from '../interfaces'
import { initBackgroundToContentScriptEventInterface } from '../interfaces/background-to-contentscript'
import { initBackgroundToPopupEventInterface } from '../interfaces/background-to-popup'

let evHandler: EventHandlerJS<
  ComponentUnion,
  'BACKGROUND',
  AliasUnion,
  'BACKGROUND',
  {
    CONTENT_SCRIPT: ContentScriptToBackgroundMeta
    POPUP: PopupToBackgroundMeta
  }
>

export function initEventHandler() {
  evHandler = new EventHandlerJS<
    ComponentUnion,
    'BACKGROUND',
    AliasUnion,
    'BACKGROUND',
    {
      CONTENT_SCRIPT: ContentScriptToBackgroundMeta
      POPUP: PopupToBackgroundMeta
    }
  >({
    alias: 'BACKGROUND',
    component: 'BACKGROUND',
    /**
     * id should be unique in app
     */
    id: '1',
    nextHopTable: {
      MAIN_WORLD: 'CONTENT_SCRIPT',
      BACKGROUND: 'BACKGROUND',
      CONTENT_SCRIPT: 'CONTENT_SCRIPT',
      MAIN: 'MAIN',
      POPUP: 'POPUP',
      RENDERER: 'MAIN',
      SERVER: 'MAIN'
    },
    interfaceTable: {}
  })

  evHandler.addInterface('CONTENT_SCRIPT', initBackgroundToContentScriptEventInterface(evHandler))
  evHandler.addInterface('POPUP', initBackgroundToPopupEventInterface(evHandler))

  chrome.runtime.onMessage.addListener(function (message, sender, reply) {
    Object.assign(message.meta, { native: { sender, reply } })

    evHandler.signal(message)

    // we don't reply with reply functions
    // return true
  })

  chrome.webRequest.onBeforeSendHeaders.addListener(
    function (detail) {
      const url = new URL(detail.url)

      const { origin } = url

      /**
       * can't distinguish each parts
       */

      // const parts = host.split('.')
      // const tld = parts.length > 3 ? parts.slice(-2).join('.') : parts.at(-1)
      // const domain = parts.at(-2)
      // const subdomain = parts.at(-3)
      // const domainPattern = `${`${protocol}//${subdomain ? `*.` : ''}`}${domain}.${tld}`

      evHandler.sendEvent<RenewRequestDetail>({
        name: 'RENEW_REQUEST_DETAIL',
        payload: { detail, origin },
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })
    },
    { urls: ['<all_urls>'], types: ['main_frame'] },
    ['requestHeaders', 'extraHeaders']
  )

  // chrome.webNavigation.onBeforeNavigate.addListener(function (navigation) {
  //   if (navigation.frameType !== 'outermost_frame') return
  //   console.log('navigation detail : ', navigation)
  // })

  registerListeners()

  // background has no window
  // if (process.env.NODE_ENV === 'developement') window.eh = evHandler

  return evHandler
}

export function getEvHandler() {
  if (!evHandler) throw new Error('event handler is not initialized')
  return evHandler
}

function registerListeners() {
  evHandler.onEvent<Pipe<SuperEvent<ComponentUnion, 'BACKGROUND'>>>('PIPE', function ({ payload }) {
    return evHandler.sendEvent<SuperEventMatrix<ComponentUnion, 'BACKGROUND'>>(payload)
  })

  evHandler.onEvent<Invoke<SuperEvent<ComponentUnion, 'BACKGROUND'>>>('INVOKE', function ({ payload }) {
    return evHandler
      .sendEvent(payload)
      .catch(function () {
        return false
      })
      .then(function () {
        return true
      })
  })

  evHandler.onEvent<ConsoleLog>('CONSOLE_LOG', function ({ name, payload, meta }) {
    return console.log(payload)
  })

  evHandler.onEvent<GetTabId>(
    'GET_TAB_ID',
    function ({
      meta: {
        native: { sender, reply }
      }
    }) {
      if (!sender.tab?.id) throw new Error('NO_TAB_ID')
      reply(sender.tab.id)
      throw new NoReply()
    }
  )

  evHandler.onEvent<ContentScriptLoaded, 'CONTENT_SCRIPT'>(
    'CONTENT_SCRIPT_LOADED',
    function ({
      meta: {
        native: { reply, sender }
      }
    }) {
      console.log(`content script loaded : `, sender.tab?.title, sender.tab?.id)
      const tabId = sender?.tab?.id
      const url = sender?.url

      if (!tabId || !url) return

      return evHandler.sendEvent<ContentScriptLoaded>({
        name: 'CONTENT_SCRIPT_LOADED',
        payload: { tabId, url },
        meta: { receiver: { alias: 'MAIN', component: 'MAIN' } }
      })
    }
  )

  evHandler.onEvent<Pagination>('PAGINATION', async function ({ payload: { tabId } }) {
    // const { tabId } = e.payload as Extract<Pagination['payload'], { tabId: number }>
    const res = await evHandler.sendEvent<Pagination, 'CONTENT_SCRIPT'>({
      name: 'PAGINATION',
      meta: { receiver: { id: tabId, component: 'CONTENT_SCRIPT' } }
    })

    if (res === undefined)
      return new Promise<boolean>(function (resolve, reject) {
        const rm = evHandler.onEvent<ContentScriptLoaded, 'CONTENT_SCRIPT'>(
          'CONTENT_SCRIPT_LOADED',
          function checkTabId({
            meta: {
              native: { sender }
            }
          }) {
            if (!sender?.tab?.id) return resolve(false)
            if (tabId === sender.tab.id) {
              rm()
              return resolve(true)
            }
          }
        )
      })

    return res
  })

  evHandler.onEvent<Subcontract<ActionPreset>, 'MAIN'>('SUBCONTRACT', async function ({ payload }) {
    console.log('subcontract : ', payload)

    // await new Promise<void>((resolve) => setTimeout(resolve, 3000))

    switch (payload.action.template) {
      case 'SCRAPE': {
        const { tabId, action, command, context } = payload as Extract<
          Subcontract<__Action__Scrape>,
          { receiver: 'BACKGROUND' }
        >['payload']

        const returnValue = await evHandler.sendEvent<Subcontract<__Action__Scrape>>({
          name: 'SUBCONTRACT',
          payload: {
            action,
            command,
            context
          },
          meta: { receiver: { id: tabId, component: 'CONTENT_SCRIPT' } }
        })

        /**
         * will navigate
         */
        if (returnValue === undefined)
          return new Promise<boolean>(function (resolve, reject) {
            if (!tabId) return reject(new Error('SUBCONTRACT:CONTENT_SCRIPT_LOADED:NO_TAB_ID'))
            /**
             * several listeners on the same event will occurr random
             * because sender gets resolved with only one response from
             * so will just invoke callback and don't reply
             */
            const removeEventListener = evHandler.onEvent<ContentScriptLoaded, 'CONTENT_SCRIPT'>(
              'CONTENT_SCRIPT_LOADED',
              function ({
                meta: {
                  native: { sender }
                }
              }) {
                if (sender?.tab?.id === tabId) {
                  removeEventListener()
                  resolve(true)
                }
                throw new NoReply('subcontract_scrape_content_script_loaded')
              }
            )
          })

        return returnValue
      }

      case 'LOAD_URL':
        const { tabId, action, command, context } = payload as Extract<
          Subcontract<__Action__LoadUrl>,
          { receiver: 'BACKGROUND' }
        >['payload']

        return new Promise<DataRecord>(async function (resolve, reject) {
          const remove = evHandler.onEvent<ContentScriptLoaded, 'CONTENT_SCRIPT'>(
            'CONTENT_SCRIPT_LOADED',
            function ({
              meta: {
                native: { sender }
              }
            }) {
              console.log('load url content script load cb : ', sender?.tab?.id)
              if (!sender?.tab?.id) throw new NoReply('subcontract_scrape_content_script_loaded')
              if (sender.tab.id === tabId) {
                remove()
                resolve({})
              }
              throw new NoReply('subcontract_scrape_content_script_loaded')
            }
          )
          // if(action.value.focused) chrome.windows.update({  })
          if (action.value.find) {
            const tab = await chrome.tabs.query({ url: action.value.find }).then((r) => r.at(0))
            if (tab) chrome.tabs.update(tabId, { active: action.value.active }).then(() => resolve({}))
          } else chrome.tabs.update(tabId, { active: action.value.active, url: action.value.url })
        })

      case 'EVAL_BINDING_TAB': {
        const { tabId, action, command, context } = payload as Extract<
          Subcontract<__Action__EvalBindingTab>,
          { receiver: 'BACKGROUND' }
        >['payload']

        return evHandler.sendEvent<Subcontract<__Action__EvalBindingTab>>({
          name: 'SUBCONTRACT',
          payload: {
            action,
            command,
            context
          },
          meta: { receiver: { id: tabId, component: 'CONTENT_SCRIPT' } }
        })
      }

      case 'CLICK': {
        const { tabId, action, command, context } = payload as Extract<
          Subcontract<__Action__Click>,
          { receiver: 'BACKGROUND' }
        >['payload']

        await chrome.tabs.highlight({ tabs: (await chrome.tabs.get(tabId)).index })

        return evHandler.sendEvent<Subcontract<__Action__Click>>({
          name: 'SUBCONTRACT',
          payload: {
            action,
            command,
            context
          },
          meta: { receiver: { id: tabId, component: 'CONTENT_SCRIPT' } }
        })
      }

      case 'SELECT': {
        const { tabId, action, command, context } = payload as Extract<
          Subcontract<__Action__Select>,
          { receiver: 'BACKGROUND' }
        >['payload']

        return evHandler.sendEvent<Subcontract<__Action__Select>>({
          name: 'SUBCONTRACT',
          payload: {
            action,
            command,
            context
          },
          meta: { receiver: { id: tabId, component: 'CONTENT_SCRIPT' } }
        })
      }
      /**
       * injecting scripts into a new tab which has 'chrome' as url scheme is not possible
       * this action should be consumed through user client for now
       */
      // case 'PROMPT':
      //   return new Promise<Prompt['returnType']>(function (resolve, reject) {
      //     if (!e.payload.tabId) return reject(new Error('SUBCONTRACT:PROMPT:NO_TAB_ID'))
      //     chrome.scripting.executeScript(
      //       {
      //         target: { tabId: e.payload.tabId },
      //         // func scope : webpage
      //         func: () => window.prompt('값을 입력하세요') || ''
      //       },
      //       function (result) {
      //         resolve([[result[0].result]])
      //       }
      //     )
      //   })

      default:
        throw new Error('SUBCONTRACT:INVALID_ACTION')
    }
  })

  // eslint-disable-next-line prettier/prettier, no-empty-function
  evHandler.onEvent<Ping>('PING', async function () {})

  // evHandler.onEvent<ConnectNative>('CONNECT_NATIVE', async function (e) {
  //   evHandler._initializeSocket()
  //   if (evHandler._socket === null || evHandler._socket.readyState === WebSocket.CLOSED) return false

  //   return true
  // })

  evHandler.onEvent<CheckNativeConnection>('CHECK_NATIVE_CONNECTION', async function () {
    const socket = getSocketClient()
    console.log(
      `check native connection/ close? : ${!socket || socket.readyState === WebSocket.CLOSED}, socket is null? : ${
        socket === null
      }, open state? : ${socket.readyState === WebSocket.OPEN}`
    )
    if (socket === null || socket.readyState === WebSocket.CLOSED) return false

    return socket.readyState === WebSocket.OPEN
  })

  evHandler.onEvent<UnmountApp>('UNMOUNT_APP', unmountApp)

  evHandler.onEvent<PopupLaunched>('POPUP_LAUNCHED', async function (e) {
    let socket = getSocketClient()
    if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING)
      await initSocketClient().then(function () {
        socket = getSocketClient()
        evHandler.addInterface('MAIN', initBackgroundToMainEventInterface(evHandler))
      })
    /**
     * validate socket connection here
     */

    /**
     * active tab is the tab which is not freezed
     * do not confuse with highlighted tab
     * do not open devtools on popup, it will cause a unexpected result in tab querying
     */

    const activeTab = (await chrome.tabs.query({ currentWindow: true, active: true, highlighted: true }))[0]

    console.log(`active tab : `, activeTab)
    console.log('extensoin tab : ', getExtensionTab())
    console.log('socket state : ', socket.readyState)

    if (!activeTab?.id) return

    await evHandler
      .sendEvent<Echo>({
        name: 'ECHO',
        payload: 'preflight',
        meta: { receiver: { component: 'CONTENT_SCRIPT', id: activeTab.id } }
      })
      .catch(function reinjectContentScript() {
        console.log(`injecting cs to ${activeTab.id}`)

        return Promise.all(
          chrome.runtime.getManifest().content_scripts!.map(function (cs) {
            if (!cs.js || !('world' in cs)) return Promise.resolve()
            return chrome.scripting.executeScript({
              files: cs.js,
              target: { tabId: activeTab.id!, allFrames: cs.all_frames },
              injectImmediately: cs.run_at === 'document_start',
              world: cs.world // uncomment if you use it in manifest.json in Chrome 111+
            })
          })
        )
      })

    /**
     * unmount previous one
     */
    await unmountApp()

    /**
     * mount app if the extension tab is changed
     */
    return evHandler
      .sendEvent<AssertCertificate>({
        name: 'ASSERT_CERTIFICATE',
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })
      .then(async function (validated) {
        if (!validated)
          return evHandler.sendEvent<Notify>({
            name: 'NOTIFY',
            payload: { title: '에러', body: '인증서가 유효하지 않습니다' },
            meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
          })

        const { exConfig } = await evHandler.sendEvent<GetState<AppStore, 'exConfig'>>({
          name: 'GET_STATE',
          payload: ['exConfig'],
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })

        const gy = await evHandler.sendEvent<GetGyState>({
          name: 'GET_GY_STATE',
          meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
        })

        await evHandler.sendEvent<MountApp>({
          name: 'MOUNT_APP',
          meta: { receiver: { id: activeTab.id!, component: 'CONTENT_SCRIPT' } },
          payload: {
            gy,
            config: exConfig,
            cache: { procedures: [], scripts: [] }
          }
        })

        setExtensionTab(activeTab)

        return evHandler.sendEvent<ExtMounted>({
          name: 'EXT_MOUNTED',
          payload: activeTab,
          meta: { receiver: { alias: 'MAIN', component: 'MAIN' } }
        })
      })
  })

  evHandler.onEvent<Echo>('ECHO', async function (e) {
    console.log(`background echo : ${e.payload}, meta : ${JSON.stringify(e.meta)}`)
    return e.payload
  })

  evHandler.onEvent<CreateContextMenuItem>('CREATE_CONTEXT_MENU_ITEM', function ({ payload: { options, pid } }) {
    return new Promise<void>(function (resolve, reject) {
      // chrome.contextMenus.remove(payload.id!)

      /**
       * Extensions using event pages or Service Workers cannot pass an onclick parameter to chrome.contextMenus.create.
       * Instead, use the chrome.contextMenus.onClicked event.
       */

      chrome.contextMenus.create(
        {
          ...options
        },
        function () {
          // chrome.runtime.lastError is defined only in the scope of api's callback
          // if api returns promise then lastError is not defined
          if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)

          console.log(`context button ${options.id} created`)

          chrome.contextMenus.onClicked.addListener(function (info, tab) {
            if (info.menuItemId !== options.id) return

            console.log(`context button ${options.id} clicked, ${tab?.title}`)

            return evHandler.sendEvent<InitializeProcess>({
              name: 'INITIALIZE_PROCESS',
              payload: { pid, resources: { 'extension-tab': tab ? [tab] : [] } },
              meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
            })
          })

          return resolve()
        }
      )
    })
  })

  evHandler.onEvent<RemoveContextMenuItem>('REMOVE_CONTEXT_MENU_ITEM', function ({ name, payload, meta }) {
    console.log('removing context menu item')

    return new Promise<void>(function (resolve, reject) {
      chrome.contextMenus.remove(payload, function () {
        // if (chrome.runtime.lastError) return reject(chrome.runtime.lastError)
        console.log(`context button ${payload} removed`)
        return resolve()
      })
    })
  })

  evHandler.onEvent<GetTab>('GET_TAB', async function ({ payload: { tabId } }) {
    return chrome.tabs.get(tabId)
  })

  evHandler.onEvent<QueryTabs>('QUERY_TABS', async function (e) {
    return chrome.tabs.query(e.payload)
  })

  evHandler.onEvent<CreateTab>('CREATE_TAB', async function (e) {
    const tab = await chrome.tabs.create(e.payload)

    console.log(`tab : ${tab.id}`)
    return tab
  })

  evHandler.onEvent<RemoveTab>('REMOVE_TAB', async function ({ name, payload, meta }) {
    const tab = await chrome.tabs.get(payload)
    if (!tab) return
    return chrome.tabs.remove(payload)
  })
}
