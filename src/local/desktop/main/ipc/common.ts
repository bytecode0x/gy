import { app, BrowserWindow, dialog, shell, webContents } from 'electron'
import { appStore } from 'local/desktop/main/app-store'
import {
  AlwaysOnTopWindow,
  CloseWindow,
  ConsoleLog,
  Echo,
  Eval,
  FocusWindow,
  Fulfill,
  GetBook,
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
import { getEvHandler } from '../infra/event/event-handler'
import { logger } from '../infra/logger'
import { getCalendar } from '../scheduler'

export async function registerCommonIpcEventListenrs() {
  const evHandler = getEvHandler()

  evHandler.onEvent<Eval>('EVAL', function ({ name, payload: { code, params }, meta }) {
    return runScript({ code, params })
  })

  evHandler.onEvent<GetCalendar>('GET_CALENDAR', function () {
    return Object.fromEntries(
      Object.entries(getCalendar())
        .filter(([_, job]) => job)
        .map(([key, { job, date }]) => [key, { name: job.name, date }])
    )
  })

  evHandler.onEvent<Fulfill>('FULFILL', function ({ name, payload: { channel, value }, meta }) {
    logger.info('fulfilling', { source: 'main', channel })
    return evHandler.fulfill(channel, value)
  })

  evHandler.onEvent<ThrowError>('THROW_ERROR', function ({ name, payload, meta }) {
    app.quit()
  })

  evHandler.onEvent<Pipe<SuperEvent<ComponentUnion, 'MAIN'>>>('PIPE', function ({ payload }) {
    return evHandler.sendEvent<SuperEventMatrix<ComponentUnion, 'MAIN'>>(payload)
  })

  evHandler.onEvent<Invoke<SuperEvent<ComponentUnion, 'MAIN'>>>('INVOKE', function ({ payload }) {
    return (
      evHandler
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
  evHandler.onEvent<SetWorkDir>('SET_WORKDIR', function ({ name, payload, meta }) {
    logger.info('setting workdir', { source: 'evHandler', workDir: payload })
    appStore.set('config.workDir', payload)
    appStore.set('gdr.WORK_DIR', [[payload]])
  })

  evHandler.onEvent<GetWorkDir>('GET_WORKDIR', function ({ name, payload, meta }) {
    return appStore.get('config.workDir')
  })

  evHandler.onEvent<SetState>('SET_STATE', function ({ name, payload, meta }) {
    payload.forEach(function ({ key, value }) {
      appStore.set(key, value)
    })
  })

  evHandler.onEvent<GetState>('GET_STATE', function ({ name, payload, meta }) {
    return Object.fromEntries(payload.map((key) => [key, appStore.get(key)]))
  })

  /**
   * those event which have something to do with app/user might need to be migrate to user-window
   */

  evHandler.onEvent<SetStore<AppStore>>('SET_STORE', function ({ name, payload, meta }) {
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

  evHandler.onEvent<GetStore>('GET_STORE', function ({ name, payload, meta }) {
    return appStore.store
  })

  evHandler.onEvent<WriteFile>('WRITE_FILE', async function ({ payload: { data, file, options } }) {
    return fs.writeFileSync(file, data, { flag: options?.flag, encoding: 'utf8' })
  })

  evHandler.onEvent<SetBook>('SET_BOOK', function ({ payload }) {
    evHandler.book = { ...evHandler.book, ...payload }
    Object.keys(evHandler.book).forEach((alias) =>
      evHandler.sendEvent<SetBook>({
        name: 'SET_BOOK',
        payload: evHandler.book,
        meta: { receiver: evHandler.book[alias as AliasUnion]! }
      })
    )
  })

  evHandler.onEvent<GetBook>('GET_BOOK', function () {
    return evHandler.book
  })

  evHandler.onEvent<Echo>('ECHO', async function ({ payload }) {
    logger.info('got a echo event', { source: 'main', payload })
    return payload
  })

  evHandler.onEvent<ConsoleLog>('CONSOLE_LOG', async function ({ payload, meta }) {
    logger.info('log', { source: 'main', sender: meta.sender, msg: payload })
  })

  evHandler.onEvent<SetVisible, 'RENDERER'>('SET_VISIBLE', async function ({ name, payload, meta }) {
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

  evHandler.onEvent<CloseWindow>('CLOSE_WINDOW', async function ({ name, meta }) {
    logger.info('close window', { source: 'main', meta })

    if (meta.sender.component !== 'RENDERER') throw new Error(`${meta.sender.component} can't resolve ${name}`)

    const wc = webContents.fromId(meta.native.ipcMainEvent.sender.id as number)
    if (!wc) throw new Error("can't find web contents")

    logger.info('close window', { source: 'main', id: meta.native.ipcMainEvent.sender.id })
    const window = BrowserWindow.fromWebContents(wc)
    if (window && window.closable) window.close()
  })

  evHandler.onEvent<FocusWindow, 'RENDERER'>('FOCUS_WINDOW', async function ({ name, meta }) {
    if (meta.sender.component !== 'RENDERER') throw new Error(`${meta.sender.component} can't resolve ${name}`)

    const wc = webContents.fromId(meta.native.ipcMainEvent.sender.id as number)
    if (!wc) throw new Error("can't find web contents")

    logger.info('focus window', { source: 'main', id: meta.native.ipcMainEvent.sender.id })
    const window = BrowserWindow.fromWebContents(wc)
    window?.focus()
  })

  evHandler.onEvent<AlwaysOnTopWindow, 'RENDERER'>('ALWAYS_ON_TOP_WINDOW', async function ({ name, meta, payload }) {
    if (meta.sender.component !== 'RENDERER') throw new Error(`${meta.sender.component} can't resolve ${name}`)

    const wc = webContents.fromId(meta.native.ipcMainEvent.sender.id as number)
    if (!wc) throw new Error("can't find web contents")

    logger.info('focus window', { source: 'main', id: meta.native.ipcMainEvent.sender.id })
    const window = BrowserWindow.fromWebContents(wc)
    window?.setAlwaysOnTop(payload)
  })

  evHandler.onEvent<OpenExternal>('OPEN_EXTERNAL', async (message) => {
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
  // evHandler.onEvent<GetConfig>('GET_CONFIG', async (message) => userConfig.store)

  // evHandler.onEvent<SetConfig>('SET_CONFIG', async ({ name, meta, payload }) => userConfig.set({ ...payload }))

  // evHandler.onEvent<GetIpcTable>('GET_IPC_TABLE', async (e) => ipcTable.store)

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

  // evHandler.onEvent<SetIpcTable>('SET_IPC_TABLE', async (_, _ipcTable) => {
  //   ipcTable.set(_ipcTable)
  // })

  // onEvent<GetUserData>('GET_USER_DATA', async (e) => userData.store)

  // onEvent<SetUserData>('SET_USER_DATA', async (_, _input) => userData.set(_input))

  evHandler.onEvent<MessageBox>('MESSAGE_BOX', async ({ name, meta, payload: { title, type, message } }) => {
    dialog.showMessageBox({ type, title, message })
  })

  evHandler.onEvent<GetWebContentsId>('GET_WEBCONTENTS_ID', async ({ meta }) => meta.native.ipcMainEvent.sender.id)

  evHandler.onEvent<OpenDialog>('OPEN_DIALOG', function ({ name, payload, meta }) {
    return dialog.showOpenDialog(payload)
  })

  // evHandler.onEvent<DialogWorkDir>('DIALOG_WORKDIR', selectWorkDir)

  evHandler.onEvent<OpenFile>('OPEN_FILE', function ({ payload }) {
    return shell.openPath(payload)
  })
}
