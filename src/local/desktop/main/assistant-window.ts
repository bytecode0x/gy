import { BrowserWindow } from 'electron'
import { NoReply } from 'lib/event/error'
import { Action } from 'lib/gy/core/type/action'
import path from 'path'
import { RendererReady } from 'sementic_events'
import { __Action__OpenAIAssistant } from './gy/type/action.preset'
import { getEvHandler } from './infra/event/event-handler'
import { logger } from './infra/logger'

export function openAssistant(options: Action<__Action__OpenAIAssistant>['value']) {
  const assistantWindow = new BrowserWindow({
    show: process.env.NODE_ENV === 'development',
    resizable: true,
    frame: false,
    title: 'Assistant',
    minWidth: 300,
    minHeight: 300,
    width: 600,
    height: 600,
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
      preload: `${__dirname}/4f642e388f5654bfaf2ea505be8320d1.js`
      // preload: path.join(__dirname, '../preload/dialog.js')
    }
  })

  // eslint-disable-next-line no-async-promise-executor
  return new Promise<{ response: any; threadId: string; messages: Array<string> }>(async function (resolve, reject) {
    /**
     * what if there are multiple dialog windows at the same time?
     * ipc table shouldn't be a thing
     * you need to communicate through main
     */

    const eh = getEvHandler()

    // eh.book.DIALOG = { component: 'RENDERER', id: assistantWindow.webContents.id }

    // ipcTable.set('DIALOG', assistantWindow.id)

    // assistantWindow.removeMenu()

    assistantWindow.webContents.setWindowOpenHandler(function () {
      return { action: 'deny' }
    })

    assistantWindow.once('close', function (e) {
      eh.deny(`assistant_${assistantWindow.webContents.id}`, new Error('Assistant window is closed before resolving'))
    })

    /**
     * you can't sync the moment when the dynamic contents are rendered with 'ready-to-show' event
     * cause elements are gonna be rendered after that
     * instead, use the event for synchronizing the moment when the event handler is initialized
     */

    /**
     * Promise represents asynchronicity
     * and It provides the interface that you can access the task and the timing
     * soon as It is resolved
     * It's like Vector. It represents value and direction
     *
     * what I do here is
     * I want to wait until the callback on the renderer ready event is finished
     * but I can't access the promise that represents the wrapper of the callback
     * so I create Promise inside the callback so that I can be able to know the timing that the callback is resolved
     * and then I resolve the Promise with finally method so that It doesn't affect the return value of the callback
     *
     * this is a great idea
     * but in this case, as It still resolves on NoReply throw
     * It might be better just resolve right before the callback is finished
     *
     * this case also  need to send pooling to synchronize the timing that renderer is ready
     * but you can't do it on this case as the evHandler on renderer won't be initialized at the time
     */

    await new Promise<void>(function (resolve) {
      const remove = eh.onEvent<RendererReady<Action<__Action__OpenAIAssistant>['value']>>(
        'RENDERER_READY',
        function cb({ payload: id }) {
          logger.info('renderer ready', { source: 'assistant', id, wid: assistantWindow.webContents.id })
          if (id !== assistantWindow.webContents.id) throw new NoReply()
          remove()

          resolve()

          return options
        }
      )
      assistantWindow.loadFile(`${__dirname}/openai-assistant.html`)
    })

    assistantWindow.center()
    assistantWindow.show()

    /**
     * so the reason It sends the another event here is
     * to synch the timing when the task on the renderer is resolved with
     * this abstracted wrapper function
     *
     */

    const channel = `assistant_${assistantWindow.webContents.id}`

    return resolve(eh.expect<{ response: any; threadId: string; messages: Array<string> }>(channel))
  }).finally(function () {
    return assistantWindow.close()
  })
}
