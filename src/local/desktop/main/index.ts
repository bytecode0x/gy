import { config as dotenv } from 'dotenv'
import { app, BrowserWindow, ipcMain, session } from 'electron'
import { Ping, SetConnectionStatus, UnmountApp } from 'lib/event/sementic'
import path from 'path'
import { APP_NAME } from 'specifications'
import { appStore } from './app-store'
import { getGy, initGy } from './gy/init'
import { getEvHandler, initEvHandler } from './infra/event/event-handler'
import { initMainToRendererEventInterface } from './infra/event/event-interface'
import { initMainToBackgroundEventInterface } from './infra/event/event-interface/main-to-background'
import { logger } from './infra/logger'
import { getExtensionSocket, getSocketServer, initializeSocketSever, setExtensionSocket } from './infra/socket-server'
import { registerCommonIpcEventListenrs } from './ipc'
import {
  registerGyCommonEventListeners,
  registerGyProcedureEventListeners,
  registerGyScriptEventListeners
} from './ipc/gy'
import { registerGyTriggerEventListeners } from './ipc/gy/trigger'
import { setMenu } from './menu'
import { initNotification } from './notification'
import { initReplServer } from './repl'
import { initTray } from './tray'
import { initializeUserWindow } from './user-window'

dotenv({
  path: path.resolve(
    __dirname,
    process.env.NODE_ENV === 'development' ? '.desktop-client.dev.env' : '.desktop-client.prod.env'
  )
})

// app.commandLine.appendSwitch('disable-http-cache')
if (!app.isDefaultProtocolClient(APP_NAME)) {
  app.setAsDefaultProtocolClient(APP_NAME)
  logger.info('set as default protocol', { source: 'main', execPath: process.execPath })
} else {
  logger.info('already set as default protocol', { source: 'main', execPath: process.execPath })
}

app.setName(APP_NAME)
app.setAppUserModelId(app.name)

// if (process.platform === 'win32') initializeRegedit()

const isFirstInstance = app.requestSingleInstanceLock()
if (!isFirstInstance) {
  app.quit()
} else {
  app.on('second-instance', (e, argv) => {
    if (isFirstInstance && process.platform === 'win32') {
      logger.info('second-instace from custom protocol', { source: 'main', argv })
      const url = argv.find((arg) => arg.startsWith(`${APP_NAME}://`))

      if (!url) return

      const eh = getEvHandler()

      Array.from(new URL(url).searchParams.entries()).forEach(([channel, value]) => eh.fulfill(channel, value))
    }
  })
}
setMenu()

app.on('ready', async function () {
  ipcMain.on('__ID__', function (e) {
    e.returnValue = e.sender.id
  })

  initEvHandler()
  const eh = getEvHandler()
  eh.addInterface('RENDERER', initMainToRendererEventInterface(eh))

  await session.defaultSession.clearStorageData()

  session.defaultSession.webRequest.onBeforeSendHeaders(function (details, cb) {
    details.requestHeaders['User-Agent'] =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'

    cb({ requestHeaders: details.requestHeaders })
  })

  initializeSocketSever().then(function () {
    const socketServer = getSocketServer()

    let interval: any

    socketServer.on('connection', async (socket, request) => {
      /**
       * message handler to solve the scope problem and to extend and classify the messages
       */

      // const clientName = request.headers['x-client-name'] as string | undefined
      // const clientId = request.headers['x-client-id'] as string | undefined

      // close call seems like asynchronous, which invokes close event callback after re-assign extension

      logger.info('new socket connection', { source: 'wss' })

      clearInterval(interval)

      const extension = getExtensionSocket()

      if (extension) {
        /**
         * prevent to remove event interface
         */
        extension.removeAllListeners()
        logger.info('closing previous socket', { source: 'wss' })
        /**
         * have to wait for previous connection to close
         */
        extension.close(1000, 'MULTIPLE_CONNECTION_NOT_ALLOWED')
      }

      interval = setInterval(function ping() {
        /**
         * this causes intermittent disconnection and reconnection
         * which causes abnormal behaviour on extension like not unmounting
         */
        // socket.ping()
        eh.sendEvent<Ping>({
          name: 'PING',
          meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
        })
      }, 5000)

      socket.on('message', function handleMessage(data) {
        try {
          const message = JSON.parse(data.toString())

          /**
           * Ping is implemented in application layer
           */

          /**
           * validate JSON structure maybe
           */

          eh.signal(message)
        } catch (e: any) {
          logger.error(e, { source: 'main-to-background' })
        }
      })

      socket.on('close', function (code, reason) {
        /**
         * it might clear the pinging on new connection
         */
        // clearInterval(interval)
        logger.info('socket closed', { source: 'main-to-background', code, reason })
        eh.removeInterface('BACKGROUND')
        eh.sendEvent<SetConnectionStatus>({
          name: 'SET_CONNECTION_STATUS',
          payload: { component: '브라우저', connectivity: false },
          meta: { receiver: { alias: 'USER', component: 'RENDERER' } }
        })
      })

      setExtensionSocket(socket)

      eh.addInterface('BACKGROUND', initMainToBackgroundEventInterface(eh))

      eh.sendEvent<SetConnectionStatus>({
        name: 'SET_CONNECTION_STATUS',
        payload: { component: '브라우저', connectivity: true },
        meta: { receiver: { alias: 'USER', component: 'RENDERER' } }
      })

      logger.info('socket connected', { source: 'wss', length: socketServer.clients.size })

      /**
       * send message to register triggers which are dependant on background like registering context menu here
       */
    })
  })

  initGy()

  registerCommonIpcEventListenrs()

  registerGyProcedureEventListeners()

  registerGyScriptEventListeners()

  registerGyTriggerEventListeners()

  registerGyCommonEventListeners()

  initNotification()

  initTray()

  await initializeUserWindow()

  initReplServer(function assignContext(repl, socket) {
    Object.assign(repl.context, {
      quit: repl.close,
      hi() {
        return 'hi there'
      },
      lps() {
        return getGy()
          .state.$procedures.map(($p) => [$p.name.padEnd(25, ' '), $p.pid].join('\\'))
          .join('\n')
      },
      lsc() {
        return getGy()
          .state.$scripts.map(($s) => [$s.name.padEnd(25, ' '), $s.sid].join('\\'))
          .join('\n')
      }

      // effect(tids: Array<string>, sids: Array<string>) {
      //   invokeEffect({ treeOrTids: tids, effect: { config: { disabled: [] }, scriptIds: sids } })
      // },
      // execute(pid: string) {
      //   initProcess({ pidOrPs: pid })

      //   return `procedure with id ${pid} is being launched`
      // },
      // consume
    })

    repl.once('close', function () {
      repl.write('session closed')
      socket.end()
    })

    logger.info('repl session created', { source: 'repl' })
  })
})

app.on('before-quit', async function (e) {
  logger.info('cleaning up before quitting', { source: 'main' })
  // e.preventDefault()

  const gy = getGy()

  if (gy) appStore.set('gy', gy.state)

  const eh = getEvHandler()

  await eh
    .sendEvent<UnmountApp>({
      name: 'UNMOUNT_APP',
      meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
    })
    .then(function cleanupResourcesHere() {})
    .catch(function () {})

  BrowserWindow.getAllWindows().forEach((window) => {
    if (window.closable && !window.isDestroyed()) window.close()
  })
})

app.on('render-process-gone', async (e, webContents, details) => {
  logger.info('renderer-process-gone', {
    source: `window-${BrowserWindow.fromWebContents(webContents)!.id}`,
    reason: details.reason
  })
})

app.on('window-all-closed', function () {
  app.quit()
})
