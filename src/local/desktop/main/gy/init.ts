import { spawn } from 'child_process'
import { app, BrowserWindow, Notification, shell } from 'electron'
import genie from 'lib/genie'
import { Gatsby } from 'lib/gy'
import { Resource } from 'lib/gy/core/class/resource'
import { ResourceProxy } from 'lib/gy/core/class/resource-proxy'
import { Action } from 'lib/gy/core/type/action'
import { DataRecord, Matrix } from 'lib/gy/core/type/primitive'
import { ConsoleLog, CreateTab, RemoveTab } from 'sementic_events'
import stream from 'stream'
import { v4 } from 'uuid'
import { appStore } from '../app-store'
import { getExtensionTab } from '../extension'
import { getEvHandler } from '../infra/event/event-handler'
import { logger } from '../infra/logger'
import { canceller } from './callback/canceller'
import { consumer } from './callback/consumer'
import { definer } from './callback/definer'
import { designer } from './callback/designer'
import { setter } from './setter'
import { ActionPreset } from './type/action.preset'
import { ResourcePreset } from './type/resource.preset'
import { TriggerPreset } from './type/trigger.preset'

let gy: Gatsby<ActionPreset, TriggerPreset, ResourcePreset>

export function initGy() {
  gy = new Gatsby<ActionPreset, TriggerPreset, ResourcePreset>({
    action: {
      consume: consumer,
      design: designer
    },
    trigger: {
      define: definer,
      set: setter,
      cancel: canceller
    },
    resource: {
      generate(preset = {}) {
        return {
          window: new ResourceProxy<any, 'window', BrowserWindow>({
            template: 'window',
            resources: [],
            async assign() {
              /** you can set options after being created */
              const bw = new BrowserWindow({
                // It's better call 'show' method manually
                show: false,
                frame: false,
                webPreferences: {
                  nodeIntegration: true,
                  contextIsolation: false,
                  webSecurity: true,
                  devTools: process.env.NODE_ENV !== 'production'
                }
              })

              bw.webContents.setWindowOpenHandler(({ url, disposition }) => {
                logger.log('info', 'window is openning', { disposition, source: 'user' })
                shell.openExternal(url)
                return { action: 'deny' }
              })

              return new Resource<any, 'window', BrowserWindow>({
                id: bw.id,
                value: bw,
                template: 'window',
                async dispose() {
                  if (bw.closable) return bw.close()

                  return bw.destroy()
                }
              })
            }
          }),
          'binding-tab': new ResourceProxy<Action<ActionPreset>, 'binding-tab', chrome.tabs.Tab>({
            resources: (preset['binding-tab'] || []).map(
              (v) =>
                new Resource<Action<ActionPreset>, 'binding-tab', chrome.tabs.Tab>({
                  id: v4(),
                  template: 'binding-tab',
                  value: v,
                  dispose() {
                    if (!v.id) return Promise.reject(new Error('failed to dispose binding tab;no tab id'))
                    return getEvHandler().sendEvent<RemoveTab>({
                      name: 'REMOVE_TAB',
                      payload: v.id,
                      meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
                    })
                  }
                })
            ),
            template: 'binding-tab',
            capacity: 3,
            assign() {
              return getEvHandler()
                .sendEvent<CreateTab>({
                  name: 'CREATE_TAB',
                  payload: {},
                  meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
                })
                .then(function (tab) {
                  return new Resource<Action<ActionPreset>, 'binding-tab', chrome.tabs.Tab>({
                    id: v4(),
                    value: tab,
                    template: 'binding-tab',
                    dispose() {
                      if (!tab.id) return Promise.reject(new Error('failed to dispose binding tab;no tab id'))
                      return getEvHandler().sendEvent<RemoveTab>({
                        name: 'REMOVE_TAB',
                        payload: tab.id,
                        meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
                      })
                    }
                  })
                })
            }
          }),
          'extension-tab': new ResourceProxy<Action<ActionPreset>, 'extension-tab', chrome.tabs.Tab>({
            capacity: 1,
            template: 'extension-tab',
            resources: (preset['extension-tab'] || [getExtensionTab()].filter((v): v is chrome.tabs.Tab => !!v)).map(
              (v) =>
                new Resource<Action<ActionPreset>, 'extension-tab', chrome.tabs.Tab>({
                  id: v4(),
                  template: 'extension-tab',
                  value: v
                })
            )
          })
        }
      }
    },
    state: {
      ...appStore.store.gy
    },
    workdir: app.getPath('userData'),

    _eff_env: {
      log: ({ msg, tabId }: { msg: any; tabId?: number | string }) =>
        getEvHandler().sendEvent<ConsoleLog>({
          name: 'CONSOLE_LOG',
          payload: msg,
          meta: tabId
            ? { receiver: { component: 'CONTENT_SCRIPT', id: tabId } }
            : { receiver: { component: 'RENDERER', alias: 'USER' } }
        }),
      fetch,
      Buffer,
      logger,
      genie,
      setTimeout,
      getGdr: ({ substitute }: { substitute: string }) => gy.state.gdr[substitute],
      setGdr: ({ substitute, value }: { substitute: string; value: Matrix }) => {
        gy.state.gdr[substitute] = value
        appStore.set(`gy.gdr.${substitute}`, value)
      },
      open: (path: string) => shell.openExternal(path, { activate: true }).catch(),
      expect: (channel: string) => getEvHandler().expect(channel),
      fulfill: (channel: string, value: any) => getEvHandler().fulfill(channel, value),
      stream,
      // util: { interpret, interpretObj, serialize }
      clipboard(text: string) {
        const { platform } = process
        let proc

        if (platform === 'darwin') {
          proc = spawn('pbcopy')
        } else if (platform === 'win32') {
          proc = spawn('clip')
        } else {
          proc = spawn('xclip', ['-selection', 'clipboard'])
        }

        proc.stdin.write(text)
        proc.stdin.end()
      }
    },

    generateDynamicIdr() {
      const dr: DataRecord = { WORK_DIR: [[this.workdir]] }

      const ext = getExtensionTab()

      if (!ext) return dr

      if (ext.id) dr.EXTENSION_TAB = [[ext.id.toString()]]
      if (ext.url) dr.EXTENSION_TAB_URL = [[ext.url]]

      return dr
    },

    async onProcedureCompleted({ $, tree }) {
      // const eh = getEvHandler()

      new Notification({ title: 'Gy', body: `Procedure ${$.name} is completed` }).show()

      // return eh.sendEvent<ConsoleLog>({
      //   name: 'CONSOLE_LOG',
      //   payload: { tree },
      //   meta: { receiver: { component: 'RENDERER', alias: 'USER' } }
      // })
    },

    async onProcedureFailed({ $, err }) {
      new Notification({ title: 'Gy', body: `Procedure ${$.name} is failed` }).show()
      logger.error(`Procedure ${$.name} is failed`, {
        source: 'gy',
        message: err.message,
        stack: err.stack,
        cause: err.cause
      })
    },

    async onEffectResolved({ $, scriptValues }) {
      new Notification({ title: 'Gy', body: `Effect on ${$.name} is resolved` }).show()
    },

    async onEffectFailed({ $, err }) {
      new Notification({ title: 'Gy', body: `Script ${$.name} is failed` }).show()

      logger.error(`script ${$.name} is failed`, {
        source: 'gy',
        script: $.name,
        message: err.message,
        stack: err.stack,
        cause: err.cause
      })
    }
  })

  gy.assignInEffEnv({ k: 'consume', v: gy.consume.bind(gy) })
  gy.assignInEffEnv({ k: 'initiateProcedure', v: gy.initiate.bind(gy) })
}

export function getGy() {
  if (!gy) throw new Error('GY_NOT_INITIALIZED')
  return gy
}

export type Gy = typeof gy
// 리소스 제네릭 타입 추가, 리소스 제너레이터
