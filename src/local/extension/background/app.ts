import { ExtUnMounted, UnmountApp } from 'lib/event/sementic'
import { getEvHandler } from './event/entity/background-event-handler'

let extTab: chrome.tabs.Tab | null = null

export function unmountApp() {
  if (!extTab || !extTab.id) return

  const evHandler = getEvHandler()
  return evHandler
    .sendEvent<UnmountApp, 'CONTENT_SCRIPT'>({
      meta: { receiver: { id: extTab.id, component: 'CONTENT_SCRIPT' } },
      name: 'UNMOUNT_APP'
    })
    .then(async function (store) {
      // console.log('unmounting... \nstate : ', state)
      if (!store || !extTab || !extTab.id) return

      // await evHandler.sendEvent<SetStore<AppStore>>({
      //   name: 'SET_STORE',
      //   payload: {  },
      //   meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      // })
      await evHandler.sendEvent<ExtUnMounted>({
        name: 'EXT_UNMOUNTED',
        payload: store,
        meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
      })
    })
    .catch(function (e) {
      /**
       * in case that tab is closed without cleanup
       * you should initialize the state as though It doesn't reply
       */
      console.error(e)
    })
    .finally(function () {
      setExtensionTab(null)
    })
}

export function getExtensionTab() {
  return extTab
}

export function setExtensionTab(tab: chrome.tabs.Tab | null) {
  const evHandler = getEvHandler()

  if (tab && tab.id) {
    console.log('setting extension tab in book')
    evHandler.book.EXTENSION_TAB = { component: 'CONTENT_SCRIPT', id: tab.id }
  } else {
    console.log('deleting extension tab in book')
    delete evHandler.book.EXTENSION_TAB
  }

  extTab = tab
}
