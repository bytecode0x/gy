import { BrowserWindow } from 'electron'
import { NoReply } from 'lib/event/error'
import { Dialog, RendererReady } from 'lib/event/sementic'
import path from 'path'
import { getEvHandler } from './infra/event/event-handler'

export function openDialog(options: Dialog['payload'], windowOptions?: { width?: number; height?: number }) {
  const dialogWindow = new BrowserWindow({
    show: options.type === 'image-editor' && options.serializeOnly ? false : process.env.NODE_ENV === 'development',
    resizable: true,
    frame: false,
    title: options.header,
    minWidth: 300,
    minHeight: 300,
    width: windowOptions?.width || 600,
    height: windowOptions?.height || 400,
    icon: path.join(__dirname, 'icon.ico'),
    // alwaysOnTop: true,
    // backgroundColor: '#191622',
    webPreferences: {
      nodeIntegration: true,
      // nodeIntegration: false,
      contextIsolation: false,
      // contextIsolation: true,
      webSecurity: true,
      devTools: process.env.NODE_ENV !== 'production',
      // webviewTag: true,
      preload: `${__dirname}/4ae35dbb42614d2429b7d6d181a950bb.js`
      // preload: path.join(__dirname, '../preload/dialog.js')
    }
  })

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<Dialog['returnType'] | void>(async function (resolve, reject) {
    /**
     * what if there are multiple dialog windows at the same time?
     * ipc table shouldn't be a thing
     * you need to communicate through main
     */

    const evHandler = getEvHandler()

    evHandler.book.DIALOG = { component: 'RENDERER', id: dialogWindow.webContents.id }

    // ipcTable.set('DIALOG', dialogWindow.id)

    // dialogWindow.removeMenu()

    dialogWindow.webContents.session.enableNetworkEmulation({ offline: true })

    dialogWindow.webContents.setWindowOpenHandler(function () {
      return { action: 'deny' }
    })

    dialogWindow.once('close', function (e) {
      const err = new Error('Dialog window is closed before resolving')
      evHandler.deny(`dialog_${dialogWindow.webContents.id}`, err)
      reject(err)
    })

    /**
     * you can't sync the moment when the dynamic contents are rendered with 'ready-to-show' event
     * cause elements are gonna be rendered after that
     * instead, use the event for synchronizing the moment when the event handler is initialized
     */

    await new Promise<void>(function (resolve) {
      const remove = evHandler.onEvent<RendererReady>('RENDERER_READY', function cb({ payload: id }) {
        if (id !== dialogWindow.webContents.id) throw new NoReply()
        // logger.info('renderer ready', { source: 'dialog', id, wid: dialogWindow.webContents.id, options })
        remove()
        resolve()
        return options
      })
      dialogWindow.loadFile(`${__dirname}/dialog.html`)
    })

    dialogWindow.center()

    if (options.type !== 'image-editor' || !options.serializeOnly) dialogWindow.show()

    // return resolve(
    //   evHandler
    //     .sendEvent<DialogPooling>({
    //       name: 'DIALOG_POOLING',
    //       meta: { receiver: { component: 'RENDERER', id: dialogWindow.webContents.id } }
    //     })
    //     .catch(function (err) {
    //       logger.info('dialog canceled', { source: 'dialog', reason: err })
    //       throw err
    //     })
    //     .finally(function close() {
    //       if (dialogWindow.closable) dialogWindow.close()
    //     })
    // )

    const channel = `dialog_${dialogWindow.webContents.id}`

    return resolve(evHandler.expect<Dialog['returnType']>(channel))
  }).finally(function () {
    return dialogWindow.close()
  })
}
