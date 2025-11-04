// import { getCertificate } from 'local/desktop/main/certificate'
import { logger } from 'local/desktop/main/infra/logger'
import { notify } from 'local/desktop/main/notification'
import {
  // GetTriggers,
  AssertCertificate,
  BackgroundReady,
  // CallInternalApi,
  CancelSchedule,
  ConsoleLog,
  Consume,
  ContentScriptLoaded,
  Dialog,
  EvaluateSubstitute,
  ExtMounted,
  ExtUnMounted,
  GetGyState,
  GetMatrixFromEdr,
  GetSessions,
  Interpret,
  InterpretObj,
  Notify,
  Ping,
  RenewRequestDetail,
  Serialize,
  SetGyState
} from 'sementic_events'

import { app } from 'electron'
import { interpret, interpretObj, serialize } from 'lib/gy/core/function'
import { neo } from 'lib/gy/core/instance'
import { getCacheItem } from 'local/desktop/main/cache'
import { getCalendar } from 'local/desktop/main/scheduler'
import { appStore } from '../../app-store'
import { openDialog } from '../../dialog-window'
import { setExtensionTab } from '../../extension'
import { getGy } from '../../gy/init'
import { ActionPreset } from '../../gy/type/action.preset'
import { getEvHandler } from '../../infra/event/event-handler'

export function registerGyCommonEventListeners() {
  const eh = getEvHandler()

  // eh.onEvent<GetRequestDetails>('GET_REQUEST_DETAILS', function ({ name, payload, meta }) {
  //   return getRequestDetails()
  // })

  // eh.onEvent<GetRequestDetail>('GET_REQUEST_DETAIL', function ({ name, payload, meta }) {
  //   return getRequestDetail(payload)
  // })

  eh.onEvent<RenewRequestDetail>('RENEW_REQUEST_DETAIL', function ({ name, payload, meta }) {
    // return renewRequestDetail(payload)
    return eh.sendEvent<ConsoleLog>({
      name: 'CONSOLE_LOG',
      payload,
      meta: { receiver: { component: 'RENDERER', alias: 'USER' } }
    })
  })

  // eh.onEvent<GetImageFileAsDataUrl>('GET_IMAGE_FILE_AS_DATA_URL', async function ({ name, payload, meta }) {
  //   const { canceled, filePaths } = await dialog.showOpenDialog({
  //     title: '불러올 이미지를 선택하세요',
  //     properties: ['openFile', 'createDirectory']
  //   })

  //   if (canceled) throw Error('GET_IMAGE_FILE_AS_DATA_URL:CANCELED_BY_USER')

  //   return filePaths[0]
  // })

  eh.onEvent<GetGyState>('GET_GY_STATE', function ({ name, payload, meta }) {
    const gy = getGy()

    return gy.state
  })

  eh.onEvent<SetGyState>('SET_GY_STATE', function ({ name, payload, meta }) {
    const gy = getGy()

    gy.state = {
      $gdr: { ...gy.state.$gdr, ...payload.$gdr },
      // $procedures: { ...gy.state.$procedures, ...payload.$procedures },
      $procedures: payload.$procedures
        ? gy.state.$procedures
            .filter(($p) => payload.$procedures?.every((_) => _.pid !== $p.pid))
            .concat(payload.$procedures)
        : gy.state.$procedures,
      $scripts: payload.$scripts
        ? gy.state.$scripts.filter(($s) => payload.$scripts?.every((_) => _.sid !== $s.sid)).concat(payload.$scripts)
        : gy.state.$scripts,
      $trees: payload.$trees
        ? gy.state.$trees.filter(($t) => payload.$trees?.every((_) => _.tid !== $t.tid)).concat(payload.$trees)
        : gy.state.$trees,
      gdr: { ...gy.state.gdr, ...payload.gdr },
      gs: { ...gy.state.gs, ...payload.gs }
    }

    appStore.set('gy', gy.state)
  })

  eh.onEvent<GetMatrixFromEdr>('GET_MATRIX_FROM_EDR', function ({ name, payload: { edrKey, substitute }, meta }) {
    const item = getCacheItem({ key: edrKey })

    if (item) return item[substitute]
  })

  eh.onEvent<ContentScriptLoaded>('CONTENT_SCRIPT_LOADED', function ({ name, payload: { tabId, url }, meta }) {
    app.emit('webpage-loaded', url)
  })

  eh.onEvent<CancelSchedule>('CANCEL_SCHEDULE', function ({ name, payload: triggerId, meta }) {
    const calendar = getCalendar()
    if (!calendar[triggerId]) return
    calendar[triggerId].job.cancel()
    delete calendar[triggerId]
  })

  eh.onEvent<Consume<ActionPreset>>('CONSUME', function ({ name, payload: { $action, action, header }, meta }) {
    const gy = getGy()

    return gy.consume({ $action, action }, { edr: header?.edr })
  })

  eh.onEvent<ExtMounted>('EXT_MOUNTED', async function ({ payload: tab }) {
    logger.info('extension mounted', { source: 'manager', tab: { id: tab.id, title: tab.title } })
    setExtensionTab(tab)
  })

  eh.onEvent<ExtUnMounted>(
    'EXT_UNMOUNTED',
    async function ({
      payload: {
        gy: gyState,
        config: exConfig,
        cache: { procedures, scripts }
      }
    }) {
      logger.info('extension unmounted', { source: 'manager' })
      setExtensionTab(null)

      appStore.set('exConfig', exConfig)
      appStore.set('gy', gyState)

      const gy = getGy()

      /**
       * state of extension should not effect on one of gy
       * Component Main always have to be center of data flow
       * so state changes through ext should be one of two below
       * 1. ext(user) => main => ext
       * 2. main => ext
       *
       * changes on procedure and script should go through this process too
       * you need to handle side-effects like sending back to ext or server with onChange callback
       */
      // gy.state = { ...gyState }

      await Promise.all(procedures.map((p) => gy.updateProcedureSchema({ partial: p })))

      await Promise.all(scripts.map((s) => gy.updateScript({ partial: s })))
    }
  )

  eh.onEvent<GetSessions>('GET_SESSIONS', function ({ name, payload, meta }) {
    const gy = getGy()

    return JSON.parse(JSON.stringify(gy.getSessions()))
  })

  eh.onEvent<BackgroundReady>('BACKGROUND_READY', function ({ name, payload, meta }) {
    logger.info('background ready', { source: 'main' })
    eh.fulfill('extension-connected')
  })

  // eslint-disable-next-line prettier/prettier, no-empty-function
  eh.onEvent<Ping>('PING', async function () {})

  eh.onEvent<Notify>('NOTIFY', async function ({ payload: options }) {
    notify(options)
  })

  // this event will be fired after aeherting certificate
  // eh.onEvent<GetCertificate>('GET_CERTIFICATE', async function () {
  //   return getCertificate()
  // })

  eh.onEvent<AssertCertificate>('ASSERT_CERTIFICATE', function () {
    return true
    // return eh
    //   .sendEvent<GetStorageItem>({
    //     name: 'GET_STORAGE_ITEM',
    //     payload: 'cert',
    //     meta: { receiver: { component: 'RENDERER', alias: 'USER' } }
    //   })
    //   .then((value) => {
    //     logger.info(`has cert`, { source: 'eh', cert: value, boolean: !!value })
    //     return !!value
    //   })
  })

  eh.onEvent<EvaluateSubstitute>('EVALUATE_SUBSTITUTE', async function ({ payload: { expression, sdr } }) {
    /**
     * this event evaluates the substitutes without parsing into matrix
     * It gets string, returns string
     * It might need to be removed later
     */

    const evaluated = neo.substitute(expression, { edr: sdr })

    return evaluated
  })

  // eh.onEvent<Parse>('PARSE', function ({ payload: { raw, splitWithEscaped } }) {
  //   return parse(raw, splitWithEscaped)
  // })

  // eh.onEvent<Stringify>('STRINGIFY', function ({ payload: { data, joinWithEscaped } }) {
  //   return stringify(data, joinWithEscaped)
  // })

  eh.onEvent<Interpret>('INTERPRET', function ({ payload: { raw, header }, meta: { sender } }) {
    return interpret(raw, {
      /**
       * should edr from header and edr from cache be aggregated?
       */
      edr: header && 'edrKey' in header && getCacheItem({ key: header.edrKey }),
      ...header
      // this can invoke difference in the result
      // , tabId: 'id' in sender && sender.id
    })
  })

  eh.onEvent<InterpretObj>('INTERPRET_OBJ', function ({ payload: { raw, header }, meta: { sender } }) {
    return interpretObj(raw, {
      /**
       * should edr from header and edr from cache be aggregated?
       */
      edr: header && 'edrKey' in header && getCacheItem({ key: header.edrKey }),
      ...header
      // this can invoke difference in the result
      // , tabId: 'id' in sender && sender.id
    })
  })

  eh.onEvent<Serialize>('SERIALIZE', function ({ payload }) {
    return serialize(payload)
  })

  // @ts-ignore
  eh.onEvent<Dialog>('DIALOG', function ({ payload }) {
    return openDialog(payload)
  })

  // eh.onEvent<CallInternalApi<any>>('CALL_INTERNAL_API', handleInternalApiCall)

  // eh.onEvent<GetHttpStatusCode>('GET_HTTP_STATUS_CODE', function ({ payload: { url, base, dir, headers } }) {
  //   return fetch(url, { method: 'get', headers: headers ? Object.fromEntries(parse(headers)) : undefined }).then(
  //     (res) => [res.status, res.statusText]
  //   )
  // })

  // eh.onEvent<GetExtensionState>('GET_EXTENSION_STATE', async function (c) {
  //   return extensionStore.store
  // })

  // eh.onEvent<GetTriggers>('GET_TRIGGERS', async function (c) {
  //   return extensionStore.get('triggers').data
  // })

  // eh.onEvent<SetTriggers>('SET_TRIGGERS', async function (c, triggers) {
  //   const hash = getContentHash(JSON.stringify(triggers))

  //   if (extensionStore.get('triggers').hash !== hash) {
  //     extensionStore.set('triggers', { hash, data: triggers })

  //     const sc = getSocketClient()
  //     sc.sendReport<SetTriggers>('SET_TRIGGERS', triggers)
  //   }
  // })

  // eh.onEvent<ReqRegisterProcedure>('REQUEST_REGISTER_PROCEDURE', async function ({ payload }) {
  //   // const sc = getSocketClient()

  //   // this meehage box spawned behind, you should confirm in  browser
  //   // const { response } = await dialog.showMeehageBox({
  //   //   title: 'Gatsby',
  //   //   meehage: `${ps.name.slice(0, 10)} 프로시져를 실행합니까?`,
  //   //   buttons: ['확인', '취소']
  //   // })

  //   // if (response === 1) {
  //   //   logger.info('registering procedure is canceled by user', { source: 'manager' })
  //   //   return
  //   // }

  //   // logger.info('starting procedure', { source: 'manager', payload })

  //   const email = getCertificate()?.email

  //   if (!email) return dialog.showErrorBox(`Failed to lauch the procedure`, `no certificate`)

  //   const procs = extensionStore.get('procedureSchemas')

  //   const ps =
  //     'pid' in payload
  //       ? procs.find((ps) => ps.id === payload.pid)
  //       : 'tid' in payload
  //       ? procs.find((p) => !!p.triggers.flat().find((t) => t.id === payload.tid))
  //       : payload.ps

  //   if (!ps) return dialog.showErrorBox(`Failed to lauch the procedure`, `no procedure found`)

  //   const { code, verbose, ipr } = await eh.sendEvent<RegisterProcedure>({
  //     name: 'REGISTER_PROCEDURE',
  //     payload: {
  //       ps,
  //       allowed: [email]
  //     },
  //     meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  //   })

  //   logger.info('response', { source: 'manager', code, verbose, ipr })

  //   if (code !== 100 || !ipr) return dialog.showErrorBox(`Failed to lauch the procedure`, `code : ${code}\n${verbose}`)

  //   // const ps = await sc.sendReport<GetProcedureSchema>('GET_PROCEDURE_SCHEMA', { ipr })
  //   const ok = await eh.sendEvent<Participate>({
  //     name: 'PARTICIPATE',
  //     payload: { ipr },
  //     meta: { receiver: { component: 'SERVER', alias: 'SERVER' } }
  //   })
  //   if (!ok) return dialog.showErrorBox(`Failed to lauch the procedure`, `Not allowed`)

  //   initProcess({ ipr, ps, tab: payload.tab || null })
  // })

  // eh.onEvent<InvokeEffect>('INVOKE_EFFECT', async function ({ payload: { tree, test, script } }) {
  //   return sendEventTo<InvokeEffect>(getUserWindow().webContents, 'INVOKE_EFFECT', { tree, script, test })
  // })
}
