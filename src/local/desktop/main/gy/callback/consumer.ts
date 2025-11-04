import { BrowserWindow } from 'electron'
import { keyboard, mouse } from 'lib/genie'
import { Resource } from 'lib/gy/core/class/resource'
import { interpretObj, runScript } from 'lib/gy/core/function'
import { neo } from 'lib/gy/core/instance'
import { dataRecordSchema, matrixSchema } from 'lib/gy/core/literal/zod-schema'
import { $Action, Action, ActionConsumer } from 'lib/gy/core/type/action'
import { DataRecord } from 'lib/gy/core/type/primitive'
import OpenAI from 'openai'
import { Dialog, Eval, GetTab, HideApp, Pipe, QueryTabs, ShowApp, Subcontract } from 'sementic_events'
import { v4 } from 'uuid'
import { openAssistant } from '../../assistant-window'
import { addCacheItem, removeCacheItem } from '../../cache'
import { openDialog } from '../../dialog-window'
import { getEvHandler } from '../../infra/event/event-handler'
import { logger } from '../../infra/logger'
import { getGy } from '../init'
import {
  __Action__Click,
  __Action__Define,
  __Action__LoadUrl,
  __Action__Scrape,
  __Action__Select,
  ActionPreset
} from '../type/action.preset'

export const consumer: ActionConsumer<ActionPreset> = {
  async EDIT_IMAGE({ $action: $, action: t, context: { edr } }) {
    if (!$ && !t) throw new Error(`CONSUME:EDIT_IMAGE:NO_ACTION_OR_$ACTION_GIVEN`)

    const action = t || { ...$, value: await interpretObj($.value, { edr }) }

    const { imageUrls, title, imageIds, serializeOnly } = action.value

    // const dir = savePath || neo.stringify(edr.WORK_DIR)

    // convert fetch images with http/https protocol into images with data url using sharp

    const urls = await Promise.all(
      imageUrls.flat().map((url) =>
        url.startsWith('http')
          ? fetch(url)
              .then(async (r) => [await r.arrayBuffer(), r.headers.get('content-type')])
              .then(
                ([b, contentType]) => `data:${contentType};base64,${Buffer.from(b as ArrayBuffer).toString('base64')}`
              )
          : Promise.resolve(url)
      )
    )

    // const ids = (imageIds || imageUrls.flat().map((url) => path.parse(url).name)).flat()

    const { exports, ids } = (await openDialog(
      {
        type: 'image-editor',
        header: title,
        imageUrls: urls,
        imageIds: imageIds.flat(),
        serializeOnly
      },
      { width: 800, height: 720 }
    )) as Extract<Dialog, { payload: { type: 'image-editor' } }>['returnType']

    // return { [action.name]: exports.map((v) => Object.entries(v).map(([id]) => id)) }
    return { [`${action.name}$urls`]: exports.map((url) => [url]), [`${action.name}$ids`]: ids.map((id) => [id]) }
  },

  async DEFINE({ $action, action, context: { edr, resources } }) {
    if (!$action) throw new Error(`CONSUME:DEFINE:$ACTION_REQUIRED`)

    const { confirm, title } = (await interpretObj(
      { confirm: $action.value.confirm, title: $action.value.title },
      { edr }
    )) as __Action__Define['value']

    if (!confirm) return interpretObj($action.value.record, { edr })

    // return interpretObj($action.value.record, { edr })

    const { context } = resources

    if (!context) throw new Error(`CONSUME:DEFINE:NO_CONTEXT`)

    await context.acquire($action)

    const scopeKey = v4()

    const eh = getEvHandler()

    const remove = eh.onEvent(scopeKey, function ({ payload }) {
      return interpretObj(payload, { edr })
    })

    const { record } = (await openDialog({
      type: 'form',
      // sdr: edr,
      header: `${title || $action.name} 에 대한 값을 입력하세요`,
      record: $action.value.record,
      scopeKey
    })) as Extract<Dialog, { payload: { type: 'form' } }>['returnType']

    remove()

    context.next($action)

    return interpretObj(record, { edr })
  },

  async SELECT({ $action: $, action: t, context: { sequence, edr, resources } }) {
    if (!$ && !t) throw new Error(`CONSUME:SELECT:NO_ACTION_OR_$ACTION_GIVEN`)

    const action = t || { ...$, value: await interpretObj($.value, { edr }) }

    // const interpreted = () as Select['value']

    // const holder = lars.find((ars) => resources.context.isPreempted(ars) || resources.context.isReserved(ars))
    // if (!holder) throw new Error(`resource context can't be obtained with ar ${template} : ${name} : ${id}`)

    const { context } = resources

    if (!context) throw new Error(`CONSUME:SELECT:NO_CONTEXT`)

    await context.acquire(action)

    // const done = await requestForwarding()

    // if (!ss.extension) throw new Error('NO_EXTENSION_SOCKET')

    /**
     * a substitute only is allowed as value
     */

    if (action.value.attach) {
      const tabId = action.value.attach

      logger.info('consume select', { source: 'consumer', tabId })

      const resource =
        resources['binding-tab'].resources.find((r) => r.value.id === tabId) ||
        resources['extension-tab'].resources.find((r) => r.value.id === tabId)

      if (!resource) throw new Error('CONSUMER:SELECT:NO_ATTACH_WINDOW')

      await resource.acquire(action)

      const eh = getEvHandler()

      const dr = await eh.sendEvent<Subcontract<__Action__Select>>({
        name: 'SUBCONTRACT',
        payload: { action, tabId },
        meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
      })

      resources.context.next(action)
      resource.next()

      return dr
    }

    const { chosens, indices } = (await openDialog({
      type: 'select',
      header: `${action.name} 값을 선택하세요`,
      defaultValueIndex: action.value.defaultValueIndex,
      options: action.value.options.map((r) => r.join(', ')),
      labels: action.value.labels?.map((r) => r.join(', ')),
      singular: action.value.singular
    })) as Extract<Dialog, { payload: { type: 'select' } }>['returnType']

    // console.log('chosens : ', JSON.stringify(chosens))

    // done()
    resources.context.next(action)
    if (!chosens) throw new Error('WINDOW_CLOSED_BEFORE_RESOLVED')

    const dr = {
      [action.name]: action.value.options.filter((_, i) => indices.includes(i)),
      [`${action.name}$indices`]: indices.map((i) => [i.toString()])
    }

    if (action.value.labels)
      Object.assign(dr, { [`${action.name}$labels`]: indices.map((i) => action.value.labels!.at(i)) })

    return dr
  },

  async LOAD_URL({ $action: $, action: t, context: { resources, edr } }) {
    if (!$ && !t) throw new Error(`CONSUME:LOAD_URL:NO_ACTION_OR_$ACTION_GIVEN`)

    const action = t || { ...$, value: await interpretObj($.value, { edr }) }

    /**
     * does it need context too?
     * need to test
     * no need
     */

    const { url, find, active, focused, header, rendererId, through = 'tab', show = true } = action.value

    if (!url) throw new Error('CONSUME:LOAD_URL:NO_URL')

    // generated by gpt, trim later
    function matchChromeUrlPattern({ pattern, url }: { pattern: string; url: string }) {
      let parsed
      try {
        parsed = new URL(url)
      } catch {
        return false
      }

      const match = pattern.match(/^(\*|http|https|file|ftp):\/\/([^/]+)(\/.*)$/i)
      if (!match) return false

      const [, schemePattern, hostPattern, pathPattern] = match

      // scheme 비교
      if (schemePattern !== '*' && schemePattern.toLowerCase() !== parsed.protocol.slice(0, -1)) {
        return false
      }

      // host 비교
      let hostRegexStr
      if (hostPattern === '*') {
        hostRegexStr = '^.*$'
      } else if (hostPattern.startsWith('*.')) {
        // *.example.com → 서브도메인 optional
        hostRegexStr = `^(.+\\.)?${hostPattern.slice(2).replace(/\./g, '\\.')}$`
      } else {
        hostRegexStr = `^${hostPattern.replace(/\./g, '\\.')}$`
      }
      const hostRegex = new RegExp(hostRegexStr, 'i')
      if (!hostRegex.test(parsed.host)) return false

      // path 비교
      const pathRegexStr = `^${pathPattern.replace(/\./g, '\\.').replace(/\*/g, '.*')}$`
      const pathRegex = new RegExp(pathRegexStr)
      if (!pathRegex.test(parsed.pathname)) return false

      return true
    }

    const evHandler = getEvHandler()

    switch (through) {
      case 'internal': {
        if (find) {
          const existent = BrowserWindow.getAllWindows().find((w) =>
            matchChromeUrlPattern({ pattern: find, url: w.webContents.getURL() })
          )

          if (!existent) break

          await existent.webContents.loadURL(url)

          let resource = resources.window.resources.find((r) => r.value.id === existent.id)
          if (!resource) {
            resource = new Resource<any, 'window', BrowserWindow>({
              id: v4(),
              value: existent,
              template: 'window',
              global: true
            })
            resources.window.resources.push(resource)
          }
          await resource.acquire(action)
          resource.next()

          return { [action.name]: [[url]], [`${action.name}$renderer_id`]: [[existent.id.toString()]] }
        }

        const bw = (await resources.window.acquire(action)) as BrowserWindow

        if (!bw) throw new Error('NO_BROWSERWINDOW')

        // use expect if It's not enough
        await bw.webContents.loadURL(url)

        if (show) {
          bw.setSize(800, 600)
          bw.center()
          bw.show()
        }

        return { [action.name]: [[url]], [`${action.name}$renderer_id`]: [[bw.id.toString()]] }
      }

      default: {
        break
      }
    }

    if (find) {
      logger.info('load url', { source: 'consumer', patterns: find, value: action.value })

      const existent = await evHandler
        .sendEvent<QueryTabs>({
          name: 'QUERY_TABS',
          payload: { url: find },
          meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
        })
        .then((tabs) => tabs[0])

      if (existent) {
        logger.info('load url, tab exists', { source: 'consumer', existent })

        if (existent.id && (active || focused)) {
          await evHandler.sendEvent<Subcontract<__Action__LoadUrl>>({
            name: 'SUBCONTRACT',
            payload: {
              tabId: existent.id,
              action
            },
            meta: { receiver: { alias: 'BACKGROUND', component: 'BACKGROUND' } }
          })
        }

        let resource = resources['binding-tab'].resources.find((tab) => tab.value.id === existent.id)
        if (!resource) {
          resource = new Resource<Action<ActionPreset>, 'binding-tab', chrome.tabs.Tab>({
            id: v4(),
            value: existent,
            template: 'binding-tab',
            global: true
          })
          resources['binding-tab'].resources.push(resource)
        }
        await resource.acquire(action)
        resource.next()

        return { [action.name]: [[existent.url!]], [`${action.name}$renderer_id`]: [[existent.id!.toString()]] }
      }
    }

    logger.info('load url, tab not specified', { source: 'consumer', value: action.value })

    const bindingTab = await resources['binding-tab'].acquire(action)
    if (!bindingTab || !bindingTab.id) throw new Error('NO_BINDING_TAB')

    // await resources.context.acquire(record)

    await evHandler.sendEvent<Subcontract<__Action__LoadUrl>>({
      name: 'SUBCONTRACT',
      payload: {
        tabId: bindingTab.id,
        action
      },
      meta: { receiver: { alias: 'BACKGROUND', component: 'BACKGROUND' } }
    })

    // done()

    // resources.context.next(record)
    resources['binding-tab'].next(action)
    // if (session) session.process.browsing[History.add(new URL(tab.url).origin)

    return { [action.name]: [[url]], [`${action.name}$renderer_id`]: [[bindingTab.id.toString()]] }
  },

  async PAUSE({ $action: $, action: t, context: { edr, resources } }) {
    const action = t || { ...$, value: await interpretObj($.value, { edr }) }

    /**
     * todo
     * make it able to resume with resume-key
     * and return the resume key
     */

    await resources.thread.resources[0].pause()

    return { [`${action.name}$resume_key`]: [['']] }
  },

  async INITIATE_PROCEDURE({ $action: $, action: t, context: { edr } }) {
    if (!$ && !t) throw new Error(`CONSUME:EXECUTE_PROCEDURE:NO_ACTION_OR_$ACTION_GIVEN`)

    const action = t || { ...$, value: await interpretObj($.value, { edr }) }

    const { pid, config, idr } = action.value

    const gy = getGy()

    const pd = gy.state.$procedures.find((_) => _.pid === pid)
    if (!pd) throw new Error('CONSUMER:EXECUTE_PROCEDURE:NO_PR_MATCHED')

    const { scriptValues, tidOrTree: tree } = await gy.initiate({
      pid,
      config,
      idr,
      returnType: 'tree'
    })

    return {
      [`${action.name}$pid`]: [[pid]],
      [`${action.name}$tree`]: neo.toMatrix(tree),
      [`${action.name}$script_returns`]: neo.toMatrix(scriptValues)
    }
  },

  async OPEN_AI_ASSISTANT({ $action: $, action: t, context: { edr, resources } }) {
    if (!$ && !t) throw new Error(`CONSUME:ASSISTANT:NO_ACTION_OR_$ACTION_GIVEN`)

    const action = t || { ...$, value: await interpretObj($.value, { edr }) }

    const { options, confirm } = action.value

    if (!confirm) {
      const openai = new OpenAI({ apiKey: options.apiKey })
      const thread = await openai.beta.threads.create({
        messages: options.initialMessage
          ? [{ role: 'user', content: [{ type: 'text', text: options.initialMessage }] }]
          : undefined
      })

      const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
        assistant_id: options.assistantId,
        response_format: options.responseFormat || { type: 'text' }
      })

      if (run.last_error) throw new Error(`CONSUMER:ASSISTNAT:RUN_FAILED\n${run.last_error}`)

      if (
        run.required_action &&
        run.required_action.submit_tool_outputs &&
        run.required_action.submit_tool_outputs.tool_calls
      ) {
        await Promise.all(
          run.required_action.submit_tool_outputs.tool_calls.map(function (call) {
            if (!options.toolBinding) throw new Error('NO_TOOL_BINDING')

            const { pid, sid } = options.toolBinding[call.function.name]

            if (!pid) throw new Error(`NO_PROCEDURE_MATCHED_FROM_THE_TOOL_${call.function.name}`)

            const gy = getGy()

            return gy
              .initiate({
                pid,
                idr: Object.fromEntries(
                  Object.entries(JSON.parse(call.function.arguments)).map(([key, value]) => [
                    key,
                    [[`$<json|parse|${JSON.stringify(value)}>`]]
                  ])
                ),
                returnType: 'tid'
              })
              .then(({ tidOrTree, scriptValues }) => scriptValues[tidOrTree as string][sid])
          })
        ).then(function (outputs) {
          logger.info('tool outputs: ', { source: 'consumer', outputs })
          return openai.beta.threads.runs.submitToolOutputsAndPoll(thread.id, run.id, {
            tool_outputs: outputs.map((o, i) => ({
              output: typeof o === 'string' ? o : JSON.stringify(o),
              tool_call_id: run.required_action!.submit_tool_outputs!.tool_calls[i].id
            }))
          })
        })
      }

      const messages = await openai.beta.threads.messages
        .list(thread.id, {
          run_id: run.id,
          order: 'asc'
        })
        .then((res) => res.data)

      const jsonRawString = messages[messages.length - 1].content
        .filter((c): c is Extract<OpenAI.Beta.Threads.Messages.MessageContent, { type: 'text' }> => c.type === 'text')
        .map((c) => c.text.value)
        .join('\n')

      let r: string | Object

      try {
        r = JSON.parse(jsonRawString)
      } catch (err: any) {
        r = jsonRawString
      }

      return {
        [action.name]: neo.toMatrix(r),
        [`${action.name}$thread`]: [[thread.id]],
        [`${action.name}$dataset`]: neo.toMatrix(
          messages.map((message) => ({
            role: message.role,
            content: message.content
              .filter(
                (c): c is Extract<OpenAI.Beta.Threads.Messages.MessageContent, { type: 'text' }> => c.type === 'text'
              )
              .map((c) => c.text.value)
              .join('\n')
          }))
        )
      }
    }
    await resources.context.acquire(action)

    const { response, threadId, messages } = await openAssistant({ options, confirm })

    // if (!message) throw new Error('CONSUMER:ASSISTANT:WINDOW_IS_CLOSED')

    resources.context.next(action)

    return {
      [action.name]: neo.toMatrix(response),
      [`${action.name}$thread`]: [[threadId]],
      [`${action.name}$dataset`]: neo.toMatrix(messages)
    }
  },

  async EVAL_BINDING_TAB({ $action: $, action: t, context: { sequence, edr, resources } }) {
    if (!$ && !t) throw new Error(`CONSUME:EVAL_BINDING_TAB:NO_ACTION_OR_$ACTION_GIVEN`)

    /**
     * !!!!! IMPORTANT !!!!!
     * code should be not interpreted
     * as It can use template string ${} which can be considered as substitute
     */
    const action = t || {
      ...$,
      value: {
        ...(await interpretObj({ params: $.value.params, rendererId: $.value.rendererId }, { edr })),
        code: $.value.code
      }
    }

    let resource:
      | Resource<Action<ActionPreset>, 'binding-tab', chrome.tabs.Tab>
      | Resource<Action<ActionPreset>, 'extension-tab', chrome.tabs.Tab>
      | undefined
      | null

    const edrKey = v4()

    addCacheItem({ key: edrKey, value: edr })

    const eh = getEvHandler()

    const { code, params, rendererId = 0, through = 'tab' } = action.value

    let evaluated: any

    switch (through) {
      case 'internal': {
        if (rendererId === 0) {
          evaluated = await runScript({
            code,
            params: params ? Object.fromEntries(params.map((p) => [p.id, p.value])) : {}
          })

          break
        }

        const bw = BrowserWindow.fromId(rendererId as number)

        if (!bw) throw new Error('CONSUMER:EVAL_BINDING_TAB:NO_BW_MATCHED')

        evaluated = eh.sendEvent<Eval>({
          name: 'EVAL',
          meta: { receiver: { component: 'RENDERER', id: rendererId } },
          payload: {
            code,
            params: [
              {
                id: 'prxy',
                // value: session?.process.pd.config.dynamicImportDr ? edr : {}
                value: {}
              }
            ].concat(params || []),
            meta: { edrKey }
          }
        })

        break
      }

      case 'tab': {
        if (!rendererId) {
          const head = sequence.find((ar) => ar.template === 'LOAD_URL')
          // if (!head) throw new Error('CONSUMER:EVAL_BINDING_TAB:NO_HEAD_ACTION_ASSOCIATED')

          resource = (
            head
              ? resources['binding-tab'].resources.find((r) => r.usageLog.includes(head))
              : resources['binding-tab'].getAffordable() || resources['extension-tab'].getAffordable()
          ) as
            | Resource<Action<ActionPreset>, 'binding-tab', chrome.tabs.Tab>
            | Resource<Action<ActionPreset>, 'extension-tab', chrome.tabs.Tab>
            | undefined
            | null
        }

        if (typeof rendererId !== 'number') throw new Error('CONSUMER:EVAL_BINDING_TAB:NUMERIC_ID_REQUIRED')

        if (rendererId > 0) {
          const tab = await eh.sendEvent<GetTab>({
            name: 'GET_TAB',
            /**
             * tab id must be in matrix to be substituted
             */
            payload: { tabId: rendererId as number },
            meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
          })

          if (tab) {
            resource = new Resource<Action<ActionPreset>, 'binding-tab', chrome.tabs.Tab>({
              id: v4(),
              value: tab,
              template: 'binding-tab',
              global: true
            })
          }
        } else {
          resource = resources['extension-tab'].getAffordable() as Resource<
            Action<ActionPreset>,
            'extension-tab',
            chrome.tabs.Tab
          >
        }

        if (!resource) throw new Error('CONSUMER:EVAL_BINDING_TAB:NO_USAGE_LOG_FOR_HEAD')

        const tab = await resource.acquire(action)

        if (!tab || !tab.id) throw new Error('EVAL_BINDING_TAB:NO_TAB')

        evaluated = await eh.sendEvent<Pipe<Eval>>({
          name: 'PIPE',
          payload: {
            name: 'EVAL',
            payload: {
              code,
              params: [
                {
                  id: 'prxy',
                  // value: session?.process.pd.config.dynamicImportDr ? edr : {}
                  value: {}
                }
              ].concat(params || []),
              meta: { edrKey }
            },
            meta: { receiver: { component: 'MAIN_WORLD', id: 0 } }
          },
          meta: { receiver: { component: 'CONTENT_SCRIPT', id: tab.id } }
        })
        // .finally(function () {
        //   removeCacheItem({ key: edrKey })
        // })

        break
      }

      default: {
        throw new Error('CONSUMER:EVAL_BINDING_TAB:INVALID_THROUGH_PROPERTY')
      }
    }

    removeCacheItem({ key: edrKey })

    if (resource) resource.next()

    if (matrixSchema.safeParse(evaluated).success) return { [action.name]: evaluated }

    // should I return the return value as It is?

    if (dataRecordSchema.safeParse(evaluated).success) return evaluated

    return { [action.name]: neo.toMatrix(evaluated) }
  },

  async TYPE({ $action: $, action: t, context: { edr } }) {
    if (!$ && !t) throw new Error(`CONSUME:TYPE:NO_ACTION_OR_$ACTION_GIVEN`)

    const action = t || { ...$, value: await interpretObj($.value, { edr }) }

    const { value } = action.value
    keyboard.type(value)
    return {}
  },

  async CLICK({ $action, action: t, context: { sequence, resources } }) {
    if (!$action && !t) throw new Error(`CONSUME:CLICK:NO_ACTION_GIVEN`)
    /**
     * Object.hasOwn doesn't do typeguard
     */

    const action: Action<__Action__Click> | $Action<__Action__Click> = t || $action

    const evHandler = getEvHandler()

    for (const tape of action.value.tapes) {
      const offset = { x: 0, y: 0 }

      let tab: chrome.tabs.Tab | null = null

      if (tape.context.name === 'element') {
        const head = sequence.find((ar) => ar.template === 'LOAD_URL')

        const resource = head
          ? resources['binding-tab'].resources.find((r) => r.usageLog.includes(head))
          : resources['binding-tab'].getAffordable() || resources['extension-tab'].getAffordable()
        if (!resource) throw new Error('CONSUMER:CLICK:NO_USAGE_LOG_FOR_HEAD')

        tab = await resource.acquire(action)

        if (!tab || !tab.id) {
          resource.next()
          throw new Error('CLICK:NO_BINDING_TAB')
        }

        const gy = getGy()

        const { CHROME_HEIGHT, SCREEN_X_OFFSET = [['0']], SCREEN_Y_OFFSET = [['0']] } = gy.state.gdr
        if (!CHROME_HEIGHT) throw new Error('CONSUMER:CLICK:NO_CHROME_HEIGHT_FOUND')
        const stringified = neo.stringify(CHROME_HEIGHT)
        const chromeHeight = parseInt(stringified, 10)
        const screenXOffset = parseInt(neo.stringify(SCREEN_X_OFFSET), 10)
        const screenYOffset = parseInt(neo.stringify(SCREEN_Y_OFFSET), 10)

        Object.assign(
          offset,
          await evHandler.sendEvent<Subcontract<__Action__Click>>({
            name: 'SUBCONTRACT',
            payload: {
              tabId: tab.id,
              action: { ...action, value: { ...action.value, tapes: [tape] } },
              // value: { keepRatio: record.value.keepRatio, tapes: [tape] },
              command: 'calc_offset',
              context: { chromeHeight, screenXOffset, screenYOffset }
            },
            meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
          })
        )
        logger.info('check', { source: 'manager', offset, chromeHeight })
      }

      if (tab && tab.id)
        await evHandler.sendEvent<HideApp>({
          name: 'HIDE_APP',
          meta: { receiver: { component: 'CONTENT_SCRIPT', id: tab.id } }
        })

      for (const mr of tape.value.map((partial) =>
        partial.map((record) => ({ x: record.x + offset.x, y: record.y + offset.y, duration: record.duration }))
      )) {
        /**
         * todo
         * make it asynchronous
         * take parameter in raw record
         *
         * while consuming it, it looks like making the app unavailable?
         */
        mouse.move(
          mr.map((v) => [v.x, v.y]),
          mr.reduce((a, b) => a + b.duration, 0)
        )

        mouse.click('left')
      }

      if (tab && tab.id)
        await evHandler.sendEvent<ShowApp>({
          name: 'SHOW_APP',
          meta: { receiver: { component: 'CONTENT_SCRIPT', id: tab.id } }
        })

      const DEFAULT_DELAY = 1000

      await new Promise((resolve) => setTimeout(resolve, DEFAULT_DELAY))
    }

    return {}
  },

  async SCRAPE({ $action, action: t, context: { sequence, resources } }) {
    if (!$action && !t) throw new Error(`CONSUME:SCRAPE:NO_ACTION_GIVEN`)

    const action: Action<__Action__Scrape> | $Action<__Action__Scrape> = t || $action

    const head = sequence.find((ar) => ar.template === 'LOAD_URL')
    // if (!head) throw new Error('CONSUMER:SCRAPE:NO_HEAD_ACTION_ASSOCIATED')

    const resource = head
      ? resources['binding-tab'].resources.find((r) => r.usageLog.includes(head))
      : resources['binding-tab'].getAffordable() || resources['extension-tab'].getAffordable()
    if (!resource) throw new Error('CONSUMER:SCRAPE:NO_USAGE_LOG_FOR_HEAD')

    const tab = await resource.acquire(action)

    // const holder = lars.find(
    //   (ars) => resources['binding-tab'].isPreempted(ars) || resources['binding-tab'].isReserved(ars)
    // )
    // if (!holder) throw new Error(`resource binding tab can't be obtained with ar ${template} : ${name} : ${id}`)
    // const bindingTab = (await resources['binding-tab'].acquire(holder)) as chrome.tabs.Tab

    // if (!ss.extension) throw new Error('NO_EXTENSION_SOCKET')
    if (!tab || !tab.id) {
      resource.next()
      throw new Error('SCRAPE:NO_BINDING_TAB')
    }

    const result: Array<__Action__Scrape['returnType']> = []

    const evHandler = getEvHandler()

    if ($action.value.pagination?.start) {
      const paginated = await evHandler.sendEvent<Subcontract<__Action__Scrape>>({
        name: 'SUBCONTRACT',
        payload: {
          tabId: tab.id,
          action,
          // value: record.value,
          command: 'pagination_start'
        },
        meta: { receiver: { alias: 'BACKGROUND', component: 'BACKGROUND' } }
      })
      if (!paginated) {
        resource.next()
        return {}
      }
    }

    do {
      result.push(
        await evHandler.sendEvent<Subcontract<__Action__Scrape>>({
          name: 'SUBCONTRACT',
          payload: {
            tabId: tab.id,
            action: $action,
            // value: record.value,
            command: 'scrape'
          },
          meta: { receiver: { alias: 'BACKGROUND', component: 'BACKGROUND' } }
        })
      )
      /**
       * you can't send event to get whether the page in bindingtab is loaded or not
       * because It can give you wrong infomation before loading new page
       * so you have to wait the event that content-script sends
       *
       * and pagination only deals with navigation between actual urls
       * which means, if pagination is just rendering in same url,
       * you should take it with combination of click action and
       * loop statement.
       */

      // scrape

      // merge

      // request navigating to next page (return boolean)
      // binding tab returns true/false then click next pagination button
    } while (
      await evHandler.sendEvent<Subcontract<__Action__Scrape>>({
        name: 'SUBCONTRACT',
        payload: {
          tabId: tab.id,
          action: $action,
          // value: record.value,
          command: 'pagination_next'
        },
        meta: { receiver: { alias: 'BACKGROUND', component: 'BACKGROUND' } }
      })
    )

    resource.next()

    return aggregate(result)
  },

  async EXTRACT({ $action: $, action: t, fallback, context: { edr } }) {
    if (!$ && !t) throw new Error(`CONSUME:EXTRACT:NO_ACTION_OR_$ACTION_GIVEN`)

    const action = t || { ...$, value: await interpretObj($.value, { edr }) }

    const { pattern, text } = action.value

    const result = text.match(new RegExp(pattern))

    return { [action.name]: (result && [Array.from(result)]) || fallback || [] }
  }
}

function aggregate(adr: Array<DataRecord>): DataRecord {
  return adr.reduce(function (prev, curr) {
    Object.keys(curr).forEach(function (key) {
      if (key in prev) {
        prev[key] = prev[key].concat(curr[key])
        return
      }
      prev[key] = curr[key].slice()
    })
    return prev
  }, {})
}
