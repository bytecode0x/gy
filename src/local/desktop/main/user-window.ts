import { BrowserWindow, shell } from 'electron'
// import { Command, GetCertificate, GetUser, RendererReady, ReqCertificate } from 'lib/event'
import assert from 'assert'
import path from 'path'
import { RendererReady } from 'sementic_events'
import { APP_NAME } from 'specifications'
import { getEvHandler } from './infra/event/event-handler'
import { logger } from './infra/logger'

let userWindow: BrowserWindow

export async function initializeUserWindow(options?: Electron.BrowserWindowConstructorOptions) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<void>(async function (resolve) {
    userWindow = new BrowserWindow({
      // show: false,
      minWidth: 450,
      minHeight: 350,
      width: 800,
      height: 600,
      title: APP_NAME,
      frame: false,
      // titleBarStyle: 'hidden',
      // titleBarOverlay: {
      //   color: '#fafafa',
      //   height: 60
      // },
      icon: path.join(__dirname, 'icon.ico'),
      // backgroundColor: '#191622',
      ...options,
      webPreferences: {
        nodeIntegration: true,
        // nodeIntegration: false,
        contextIsolation: false,
        // contextIsolation: true,
        webSecurity: true,
        devTools: process.env.NODE_ENV !== 'production',
        // devTools: true,
        // webviewTag: true,
        preload: `${__dirname}/ee11cbb19052e40b07aac0ca060c23ee.js`,

        // preload: path.join(__dirname, '../preload/user.js')
        ...options?.webPreferences
      }
    })

    const evHandler = getEvHandler()

    evHandler.book.USER = { component: 'RENDERER', id: userWindow.webContents.id }

    const remove = evHandler.onEvent<RendererReady>('RENDERER_READY', function () {
      logger.info('user window is ready', { source: 'user-window' })
      remove()
      resolve()
    })

    userWindow.loadFile(`${__dirname}/user.html`)

    // userWindow.setWindowButtonVisibility

    // userWindow.webContents.on('will-redirect', function ({ url, preventDefault }) {
    //   if (url.startsWith('https://xauth.coupang.com/auth'))
    //     evHandler.sendEvent<ShowAuthenticationInterface>({
    //       name: 'SHOW_AUTH_INTERFACE',
    //       meta: { receiver: { component: 'RENDERER', id: userWindow.webContents.id } }
    //     })
    // })

    userWindow.webContents.setWindowOpenHandler(({ url, disposition }) => {
      logger.log('info', 'window is openning', { disposition, source: 'user' })
      shell.openExternal(url)
      return { action: 'deny' }
    })

    userWindow.once('close', function (e) {
      e.preventDefault()

      userWindow.hide()
    })
  })
}

export function getUserWindow() {
  assert.ok(userWindow, 'USER_WINDOW_NOT_INITIALIZED')
  return userWindow
}

export function toggleUserWindow() {
  const userWindow = getUserWindow()

  if (!userWindow || userWindow.isDestroyed() || !userWindow.closable) initializeUserWindow()

  if (userWindow.isVisible()) userWindow.hide()
  else userWindow.show()
  logger.info('toggle user-window', { source: 'main', show: userWindow.isVisible() })
}
