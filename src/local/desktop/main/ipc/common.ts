import { app, BrowserWindow, dialog, shell, webContents } from 'electron'
import { appStore } from 'local/desktop/main/app-store'
import {
  __Electron__LoadUrl,
  AlwaysOnTopWindow,
  CloseWindow,
  ConsoleLog,
  Echo,
  Eval,
  FocusWindow,
  Fulfill,
  GetBook,
  GetCache,
  GetCacheItem,
  GetCalendar,
  GetState,
  GetStore,
  GetWebContentsId,
  GetWorkDir,
  Invoke,
  MessageBox,
  OpenDialog,
  OpenExternal,
  OpenFile,
  Pipe,
  SetBook,
  SetCacheItem,
  SetState,
  SetStore,
  SetVisible,
  SetWorkDir,
  ThrowError,
  WriteFile
} from 'sementic_events'

import fs from 'fs'
import { NoReply } from 'lib/event/error'
import { SuperEvent, SuperEventMatrix } from 'lib/event/type/event'
import { runScript } from 'lib/gy/core/function'
import { AliasUnion, AppStore, ComponentUnion } from 'type/app'
import { addCacheItem, getCache, getCacheItem } from '../cache'
import { getEvHandler } from '../infra/event/event-handler'
import { logger } from '../infra/logger'
import { getCalendar } from '../scheduler'

export async function registerCommonIpcEventListenrs() {
  const eh = getEvHandler()

  eh.onEvent<__Electron__LoadUrl>('LOAD_URL', function ({ name, payload: { rendererId, url }, meta }) {
    const w = BrowserWindow.getAllWindows().find((w) => w.webContents.id === rendererId)

    if (!w) throw new Error(`NO_RENDERER_MATCHED:${rendererId}`)

    return w.webContents.loadURL(url)
  })

  eh.onEvent<GetCache>('GET_CACHE', function ({ name, payload, meta }) {
    return getCache()
  })

  eh.onEvent<GetCacheItem>('GET_CACHE_ITEM', function ({ name, payload: { key }, meta }) {
    return getCacheItem({ key })
  })

  eh.onEvent<SetCacheItem>('SET_CACHE_ITEM', function ({ name, payload: { key, value }, meta }) {
    return addCacheItem({ key, value })
  })

  eh.onEvent<Eval>('EVAL', function ({ name, payload: { code, params }, meta }) {
    return runScript({ code, params })
  })

  eh.onEvent<GetCalendar>('GET_CALENDAR', function () {
    return Object.fromEntries(
      Object.entries(getCalendar())
        .filter(([_, job]) => job)
        .map(([key, { job, date }]) => [key, { name: job.name, date }])
    )
  })

  eh.onEvent<Fulfill>('FULFILL', function ({ name, payload: { channel, value }, meta }) {
    logger.info('fulfilling', { source: 'main', channel })
    return eh.fulfill(channel, value)
  })

  eh.onEvent<ThrowError>('THROW_ERROR', function ({ name, payload, meta }) {
    app.quit()
  })

  eh.onEvent<Pipe<SuperEvent<ComponentUnion, 'MAIN'>>>('PIPE', function ({ payload }) {
    return eh.sendEvent<SuperEventMatrix<ComponentUnion, 'MAIN'>>(payload)
  })

  eh.onEvent<Invoke<SuperEvent<ComponentUnion, 'MAIN'>>>('INVOKE', function ({ payload }) {
    return (
      eh
        // @ts-ignore
        .sendEvent(payload)
        .catch(function () {
          return false
        })
        .then(function () {
          return true
        })
    )
  })

  /**
   * because set/get state or store is divided
   * you need to a hatch to access workdir
   */
  eh.onEvent<SetWorkDir>('SET_WORKDIR', function ({ name, payload, meta }) {
    logger.info('setting workdir', { source: 'eh', workDir: payload })
    appStore.set('config.workDir', payload)
    appStore.set('gdr.WORK_DIR', [[payload]])
  })

  eh.onEvent<GetWorkDir>('GET_WORKDIR', function ({ name, payload, meta }) {
    return appStore.get('config.workDir')
  })

  eh.onEvent<SetState>('SET_STATE', function ({ name, payload, meta }) {
    payload.forEach(function ({ key, value }) {
      appStore.set(key, value)
    })
  })

  eh.onEvent<GetState>('GET_STATE', function ({ name, payload, meta }) {
    return Object.fromEntries(payload.map((key) => [key, appStore.get(key)]))
  })

  /**
   * those event which have something to do with app/user might need to be migrate to user-window
   */

  eh.onEvent<SetStore<AppStore>>('SET_STORE', function ({ name, payload, meta }) {
    switch (meta.sender.component) {
      case 'RENDERER': {
        return appStore.set(payload as AppStore)
      }
      case 'CONTENT_SCRIPT': {
        throw new NoReply()
      }
      default:
    }
  })

  eh.onEvent<GetStore>('GET_STORE', function ({ name, payload, meta }) {
    return appStore.store
  })

  eh.onEvent<WriteFile>('WRITE_FILE', async function ({ payload: { data, file, options } }) {
    return fs.writeFileSync(file, data, { flag: options?.flag, encoding: 'utf8' })
  })

  eh.onEvent<SetBook>('SET_BOOK', function ({ payload }) {
    eh.book = { ...eh.book, ...payload }
    Object.keys(eh.book).forEach((alias) =>
      eh.sendEvent<SetBook>({
        name: 'SET_BOOK',
        payload: eh.book,
        meta: { receiver: eh.book[alias as AliasUnion]! }
      })
    )
  })

  eh.onEvent<GetBook>('GET_BOOK', function () {
    return eh.book
  })

  eh.onEvent<Echo>('ECHO', async function ({ payload }) {
    logger.info('got a echo event', { source: 'main', payload })
    return payload
  })

  eh.onEvent<ConsoleLog>('CONSOLE_LOG', async function ({ payload, meta }) {
    logger.info('log', { source: 'main', sender: meta.sender, msg: payload })
  })

  eh.onEvent<SetVisible, 'RENDERER'>('SET_VISIBLE', async function ({ name, payload, meta }) {
    if (meta.sender.component !== 'RENDERER') throw new Error(`${meta.sender.component} can't resolve ${name}`)

    const wc = webContents.fromId(meta.native.ipcMainEvent.sender.id)
    if (!wc) throw new Error("can't find web contents")

    if (payload) {
      logger.info('set window visible', { source: 'main', id: meta.native.ipcMainEvent.sender.id })
      BrowserWindow.fromWebContents(wc)?.show()
    }
    if (!payload) {
      logger.info('set window invisible', { source: 'main', id: meta.native.ipcMainEvent.sender.id })
      BrowserWindow.fromWebContents(wc)?.hide()
    }
  })

  eh.onEvent<CloseWindow>('CLOSE_WINDOW', async function ({ name, meta }) {
    logger.info('close window', { source: 'main', meta })

    if (meta.sender.component !== 'RENDERER') throw new Error(`${meta.sender.component} can't resolve ${name}`)

    const wc = webContents.fromId(meta.native.ipcMainEvent.sender.id as number)
    if (!wc) throw new Error("can't find web contents")

    logger.info('close window', { source: 'main', id: meta.native.ipcMainEvent.sender.id })
    const window = BrowserWindow.fromWebContents(wc)
    if (window && window.closable) window.close()
  })

  eh.onEvent<FocusWindow, 'RENDERER'>('FOCUS_WINDOW', async function ({ name, meta }) {
    if (meta.sender.component !== 'RENDERER') throw new Error(`${meta.sender.component} can't resolve ${name}`)

    const wc = webContents.fromId(meta.native.ipcMainEvent.sender.id as number)
    if (!wc) throw new Error("can't find web contents")

    logger.info('focus window', { source: 'main', id: meta.native.ipcMainEvent.sender.id })
    const window = BrowserWindow.fromWebContents(wc)
    window?.focus()
  })

  eh.onEvent<AlwaysOnTopWindow, 'RENDERER'>('ALWAYS_ON_TOP_WINDOW', async function ({ name, meta, payload }) {
    if (meta.sender.component !== 'RENDERER') throw new Error(`${meta.sender.component} can't resolve ${name}`)

    const wc = webContents.fromId(meta.native.ipcMainEvent.sender.id as number)
    if (!wc) throw new Error("can't find web contents")

    logger.info('focus window', { source: 'main', id: meta.native.ipcMainEvent.sender.id })
    const window = BrowserWindow.fromWebContents(wc)
    window?.setAlwaysOnTop(payload)
  })

  eh.onEvent<OpenExternal>('OPEN_EXTERNAL', async (message) => {
    const { path } = message.payload
    return shell.openExternal(path, { activate: true }).catch()

    // if (message.meta.sender.component !== 'RENDERER')
    // if (!('native' in message))
    //   throw new Error(`${message.meta.sender.component} can't resolve ${message.name} without external flag`)

    // const wc = webContents.fromId(message.native.ipcMainEvent.sender.id as number)
    // if (!wc) throw new Error("can't find web contents")
    // const window = BrowserWindow.fromWebContents(wc)

    // return window?.loadURL(url)
  })

  // // no guarantee that app is ready if you put this on making config
  // eh.onEvent<GetConfig>('GET_CONFIG', async (message) => userConfig.store)

  // eh.onEvent<SetConfig>('SET_CONFIG', async ({ name, meta, payload }) => userConfig.set({ ...payload }))

  // eh.onEvent<GetIpcTable>('GET_IPC_TABLE', async (e) => ipcTable.store)

  // onEvent<SetIpcTable>('SET_IPC_TABLE', (_, _ipcTable) => {
  //   const filtered = Object.fromEntries(
  //     Object.entries(_ipcTable).map(([p, ids]) =>
  //       p in ipcTable && (ipcTable.get(p) as Array<number>).length > 0
  //         ? [p, Array.from(new Set([...(ipcTable.get(p) as Array<number>), ...ids]))]
  //         : [p, ids]
  //     )
  //   )
  //   ipcTable.store = { ...ipcTable.store, ...filtered }
  // })

  // eh.onEvent<SetIpcTable>('SET_IPC_TABLE', async (_, _ipcTable) => {
  //   ipcTable.set(_ipcTable)
  // })

  // onEvent<GetUserData>('GET_USER_DATA', async (e) => userData.store)

  // onEvent<SetUserData>('SET_USER_DATA', async (_, _input) => userData.set(_input))

  eh.onEvent<MessageBox>('MESSAGE_BOX', async ({ name, meta, payload: { title, type, message } }) => {
    dialog.showMessageBox({ type, title, message })
  })

  eh.onEvent<GetWebContentsId>('GET_WEBCONTENTS_ID', async ({ meta }) => meta.native.ipcMainEvent.sender.id)

  eh.onEvent<OpenDialog>('OPEN_DIALOG', function ({ name, payload, meta }) {
    return dialog.showOpenDialog(payload)
  })

  // eh.onEvent<DialogWorkDir>('DIALOG_WORKDIR', selectWorkDir)

  eh.onEvent<OpenFile>('OPEN_FILE', function ({ payload }) {
    return shell.openPath(payload)
  })
}
