import fs from 'fs'
import { getContentHash, interpret, runScript } from 'lib/gy/core/function'
import {
  $Action,
  Action,
  ActionConsumer,
  ActionDesigner,
  ActionInterfaceSuperset,
  ActionSchema
} from 'lib/gy/core/type/action'
import { Trigger, TriggerCanceller, TriggerInterfaceSuperset, TriggerSetter } from 'lib/gy/core/type/trigger'
import path from 'path'
import { GyStore } from 'type'
import { v4 } from 'uuid'
import { DataNode, SerializedDataNode } from './core/class/data-node'
import { Resource } from './core/class/resource'
import { ResourceProxy } from './core/class/resource-proxy'
import { Session } from './core/class/session'
import { Worker } from './core/class/worker'
import { NoTaskLoaded } from './core/class/worker/error'
import { edward, neo } from './core/instance'
import { Effect } from './core/type/effect'
import { DataRecord, RawDataRecord } from './core/type/primitive'
import { ProcedureDescriptor, ProcedureSchema } from './core/type/procedure'
import { Process } from './core/type/process'
import { Script, ScriptDescriptor } from './core/type/script'
import { Task, TaskRecordState, TaskSchema } from './core/type/task'
import { DataTree, SerializedDataTree, TreeDescriptor } from './core/type/tree'
import { TriggerDefiner } from './core/type/trigger/trigger.definer'

/**
 * It's better to define getter in application layer(actual business project) to fix the type of gy
 */

declare function __non_webpack_require__(moduleName: string): any

export type GatsbyOptions<
  TActionPreset extends ActionInterfaceSuperset = ActionInterfaceSuperset,
  TTriggerPreset extends TriggerInterfaceSuperset = TriggerInterfaceSuperset,
  TResourcePreset extends Resource<Action<TActionPreset>, string, any> = Resource<Action<TActionPreset>, string, any>
  // TContext extends {} = {}
> = {
  action: Gatsby<TActionPreset, TTriggerPreset, TResourcePreset>['action']
  trigger: Gatsby<TActionPreset, TTriggerPreset, TResourcePreset>['trigger']
  resource: Gatsby<TActionPreset, TTriggerPreset, TResourcePreset>['resource']
  state: Gatsby<TActionPreset, TTriggerPreset, TResourcePreset>['state']
  dev?: boolean
  workdir: string
  _eff_env?: Record<string, any>

  generateDynamicIdr?: () => DataRecord

  onProcedureCompleted?: ({ $, tree }: { $: ProcedureDescriptor; tree: DataTree }) => Promise<any>

  onProcedureFailed?: ({ $, err }: { $: ProcedureDescriptor; err: Error }) => Promise<any>

  onEffectResolved?: ({
    $,
    scriptValues
  }: {
    $: ProcedureDescriptor
    scriptValues: Record<string, any>
  }) => Promise<any>

  onEffectFailed?: ({ $, err }: { $: ScriptDescriptor; err: Error }) => Promise<any>

  // util: { [key: string]: any }
}

export class Gatsby<
  TActionPreset extends ActionInterfaceSuperset = ActionInterfaceSuperset,
  TTriggerPreset extends TriggerInterfaceSuperset = TriggerInterfaceSuperset,
  TResourcePreset extends Resource<Action<TActionPreset>, string, any> = Resource<Action<TActionPreset>, string, any>
  // TContext extends {} = {}
> {
  action: {
    // preset: Array<ActionInterfaceSuperset>
    consume: ActionConsumer<TActionPreset>
    design: ActionDesigner<TActionPreset>
  }

  trigger: {
    define: TriggerDefiner<TTriggerPreset>
    set: TriggerSetter<TTriggerPreset>
    // pull({ template, id, value }) {},
    cancel: TriggerCanceller<TTriggerPreset>
  }

  resource: {
    // preset: []
    // generate: ({ template, value }: { template: string; value: any }) => Promise<any>
    generate: (
      preset?: Partial<{
        [Template in TResourcePreset['template']]: Array<Extract<TResourcePreset, { template: Template }>['value']>
      }>
    ) => {
      [Template in TResourcePreset['template']]: ResourceProxy<
        Exclude<Extract<TResourcePreset, { template: Template }>['holder'], undefined>,
        Template,
        Extract<TResourcePreset, { template: Template }>['value']
      >
    }
    // dispose: ({ template, id }: { template: string; id: string | number }) => Promise<any>
  }

  state: {
    $procedures: Array<ProcedureDescriptor<TTriggerPreset>>
    $scripts: Array<ScriptDescriptor>
    $trees: Array<TreeDescriptor>
    $gdr: RawDataRecord
    gdr: DataRecord
    gs: Record<string, boolean>
    // version: string
  }

  workdir: string

  dev?: boolean

  // util: { [key: string]: any }

  version: string

  private _plugin_timer: Record<string, any> = {}

  private _r_context: Resource<Action<TActionPreset>, 'context', undefined>

  private _hndl_scp_tbl: Record<string, Record<string, any>>

  private _eff_env: Record<string, any>

  private sessions: Record<string, Session<TActionPreset>>

  generateDynamicIdr: () => DataRecord

  onProcedureCompleted?: ({ $, tree }: { $: ProcedureDescriptor; tree: DataTree }) => Promise<any>

  onProcedureFailed?: ({ $, err }: { $: ProcedureDescriptor; err: Error }) => Promise<any>

  onEffectResolved?: ({
    $,
    scriptValues
  }: {
    $: ProcedureDescriptor
    scriptValues: Record<string, any>
  }) => Promise<any>

  onEffectFailed?: ({ $, err }: { $: ScriptDescriptor; err: Error }) => Promise<any>

  constructor({
    action,
    resource,
    state,
    trigger,
    dev,
    workdir,
    _eff_env,
    generateDynamicIdr,
    onEffectFailed,
    onEffectResolved,
    onProcedureCompleted,
    onProcedureFailed
  }: // util
  GatsbyOptions<TActionPreset, TTriggerPreset, TResourcePreset>) {
    this.action = action
    this.resource = resource
    this.state = state
    this.trigger = trigger
    this._eff_env = {
      ..._eff_env,
      importPlugin: new Proxy(__non_webpack_require__, {
        apply: (target, thisArg, argArray) => {
          const pluginId = argArray[0]
          const f_flush = argArray[1]

          if (!pluginId || typeof pluginId !== 'string')
            throw new Error('Invalid argument\nthe plugin path is required')

          /**
           * If I re-import modules It automatically returns the modules through cache
           * so you don't need to implement your own cache
           * you just need a flag of flushing
           * you can access the cache through require.cache and you can resolve the module id through require.resolve
           */

          const pluginPath = path.join(this.getWorkdir(), 'plugins', pluginId)

          if (this.dev) console.log(`importing ${pluginPath}`)

          clearTimeout(this._plugin_timer[pluginId])

          if (f_flush) {
            if (this.dev) console.log(`importing ${pluginId} after flushing`)
            delete require.cache[pluginPath]
          }

          const plugin = target(pluginPath)

          this._plugin_timer[pluginId] = setTimeout(function () {
            delete require.cache[pluginPath]
          }, 10 * 60 * 1000)

          return plugin
        }
      }),
      neo,
      edward,
      path,
      fs
    }
    this._hndl_scp_tbl = { '0': {} }
    this.sessions = {}
    this.workdir = workdir || __dirname || process.cwd()
    this.dev = dev
    this._r_context = new Resource<Action<TActionPreset>, 'context', undefined>({
      id: v4(),
      template: 'context',
      value: undefined,
      global: true
    })
    this.version = '2.0.0'

    this.generateDynamicIdr =
      generateDynamicIdr ||
      function () {
        return {}
      }

    this.onProcedureCompleted = onProcedureCompleted

    this.onProcedureFailed = onProcedureFailed

    this.onEffectFailed = onEffectFailed

    this.onEffectResolved = onEffectResolved
    // this.util = util
  }

  public getWorkdir() {
    return this.workdir
  }

  public setWorkdir(base: string) {
    this.workdir = base
  }

  public getSessions() {
    return this.sessions
  }

  public getEffEnv() {
    return this._eff_env
  }

  public assignInEffEnv({ k, v }: { k: string; v: any }) {
    Object.assign(this._eff_env, { [k]: v, ...this._eff_env })
  }

  public setState(partial: Partial<GyStore>) {
    // change state
    // call onchange callbacks
  }

  private _createIntrinsicResourceProxies() {
    return {
      thread: new ResourceProxy<Session, 'thread'>({
        capacity: 1,
        resources: [],
        template: 'thread',
        assign() {
          return Promise.resolve(new Resource<Session, 'thread'>({ id: v4(), template: 'thread', value: undefined }))
        }
      }),
      context: new ResourceProxy<Action<ActionInterfaceSuperset>, 'context'>({
        capacity: 1,
        resources: [this._r_context],
        template: 'context'
      })
    }
  }

  public consume<TAction extends TActionPreset = TActionPreset>(
    { $action, action }: { $action?: $Action<TAction>; action?: Action<TAction> },
    header?: {
      edr?: DataRecord
      resources?: Partial<{
        [Template in TResourcePreset['template']]: Array<
          Resource<
            Exclude<Extract<TResourcePreset, { template: Template }>['holder'], undefined>,
            Template,
            Extract<TResourcePreset, { template: Template }>['value']
          >
        >
      }>
    }
  ) {
    if (!action && !$action) throw new Error('CONSUME:NO_ACTION_GIVEN')

    // const edr = { ...appStore.get('gdr'), ...header?.edr }

    /**
     * the record property which is constrainted by ar.template is an union of the all action records
     * which reduces to type never
     */

    const resources = { ...this.resource.generate(header?.resources), ...this._createIntrinsicResourceProxies() }

    return new Promise<DataRecord>((resolve, reject) => {
      resolve(
        (this.action.consume as ActionConsumer<TAction>)[(action || $action)!.template]({
          // @ts-ignore
          $action,
          // @ts-ignore
          action,

          context: { edr: header?.edr || {}, sequence: [], resources }
        })
      )
    }).finally(function cleanup() {
      Object.values(resources).forEach((r) => r.next(action || $action))
    })
  }

  public async initiate(
    // this: Gatsby,
    {
      pid,
      // procedure,
      // consumer,
      // tab,
      gdr,
      config = {},
      resources,
      idr = {},
      returnType
    }: {
      // tab?: chrome.tabs.Tab
      // consumer: ActionConsumer
      pid: string
      // procedure: { schema: ProcedureSchema; descriptor: ProcedureDescriptor<TTriggerPreset> }
      config?: Partial<ProcedureDescriptor['config']>
      gdr?: DataRecord
      idr?: DataRecord
      resources?: Partial<{
        [Template in TResourcePreset['template']]: Array<Extract<TResourcePreset, { template: Template }>['value']>
      }>
      returnType?: 'tree' | 'tid'
      // config?: Partial<ProcedureDescriptor['config']>
    }
  ): Promise<{ tidOrTree: DataTree | string; scriptValues: Record<string, Record<string, any>> }> {
    // procedure.descriptor.config = { ...procedure.descriptor.config, ...config }

    const descriptor = this.state.$procedures.find(($) => $.pid === pid)

    if (!descriptor) throw new Error('GY_INITIATE:NO_PROCEDURE_DESCRIPTOR_MATCHED')

    descriptor.config = { ...descriptor.config, ...config }

    const schema = this.readProcedureSchema({ pid })

    if (!schema) throw new Error('GY_INITIATE:NO_PROCEDURE_SCHEMA_FOUND')

    const process = new Process<TActionPreset>({
      id: v4(),
      ipr: v4(),
      ps: schema,
      pd: descriptor,
      idr: {
        ...gdr,
        ...schema.idr,
        ...idr,
        ...this.generateDynamicIdr()
        // WORK_DIR: [[this.getWorkdir()]]
      }
    })

    const workers = Array.from({ length: 3 }, (_, i) => new Worker<TActionPreset>({ id: `worker${i}` }))

    const session = new Session<TActionPreset>({
      id: v4(),
      workers,
      consumer: this.action.consume,
      // consumer: this.action.consume,
      process,
      resources: { ...this.resource.generate(resources), ...this._createIntrinsicResourceProxies() }
    })

    this.getSessions()[session.id] = session

    workers.forEach((w) => w.setContext({ session }))

    /**
     * no need to hold worker
     * It need to be garbage collected
     */
    // workers.push(worker)

    /**
     * result should be given by WAS
     * and It should be consist of data records produced by leaf nodes only
     * this is temporary for testing
     */

    const tree = await this._cycle(session, null)

    if (session.process.pd.config.preserveTree) {
      // writing tree should be done upper layer?
      const $tree = this._createTreeDescriptorOn({ tree })
      this._storeTreeDescriptor({ descriptor: $tree })

      const saveAt = neo.stringify(edward.topDownSearch({ tree, key: '__GY_TREE_DIR__' }))

      await this._writeTree({ tree, saveAt })

      // logger.info('preserved tree', { source: 'manager', pid: session.process.ps.id })
    }

    // this._createTreeDescriptorOn({ tree })

    if (this.onProcedureCompleted) await this.onProcedureCompleted({ $: descriptor, tree })

    if (!session.process.pd.config.invokeEffectImmediately)
      return { tidOrTree: returnType === 'tree' ? tree : tree.id, scriptValues: {} }

    const scriptValues = await this.invoke({
      $cdr: session.process.ps.$cdr,
      idr: session.process.ps.idr,
      trees: [session.process.tree],
      effect: session.process.pd.effect
    })

    // .catch(async (err) => {
    //   // logger.error('failed to resolve effect', { source: 'manager', err: err.message })

    //   if (this.onEffectFailed) await this.onEffectFailed({ $: session.process.pd, err })

    //   // return { [session.process.tree.id]: {} }

    //   throw err
    // })

    if (this.onEffectResolved) await this.onEffectResolved({ $: descriptor, scriptValues })

    this._cleanupSession(session)

    return { tidOrTree: returnType === 'tree' ? tree : tree.id, scriptValues }
  }

  private _cleanupSession(session: Session<TActionPreset>) {
    session.workers.forEach((w) => w.removeAllListeners())

    session.removeAllListeners()

    if (!this.dev) delete this.getSessions()[session.id]
  }

  private async _cycle(session: Session<TActionPreset>, initial: null | Task<TActionPreset>): Promise<DataTree> {
    // session might not need to have queue

    return new Promise<DataTree>(async (resolve, reject) => {
      let task: null | Task<TActionPreset> = initial
      let flag: boolean = true

      do {
        // create
        const actr = await this.__create(session, task)

        // actr.forEach(function (ctr) {
        //   _createAndExtendArsAndReserveResource(session, ctr)
        // })

        // distribute
        this.__distribute(session, actr)

        /**
         * what a fucking genius
         * this solves the condition race on resource problem
         * and makes workers work almost simultaneously
         */
        await Promise.any(this.__instruct(session))
          // eslint-disable-next-line no-loop-func
          .then(([_, dr]) => {
            const worker = session.workers.find((w) => w.currentTarget === _)!
            worker.currentTarget!.state = 'CONSUMED'
            worker.currentTarget = null
            worker.setState('WATING')

            task = _

            this.__appendDataRecord(session, task, dr)
          })
          // eslint-disable-next-line no-loop-func
          .catch(async ({ errors }: AggregateError) => {
            flag = false
            this.__cleanupResources(session)

            if (!this.__isDone(session)) {
              const error = errors.find((err) => !(err instanceof NoTaskLoaded))

              if (this.onProcedureFailed) await this.onProcedureFailed({ $: session.process.pd, err: error })

              throw error || new Error('Failed to complete procedure')
            }

            const { tree } = session.process

            this._configTreeId({ tree })

            return resolve(tree)
          })
      } while (flag)
    })
  }

  private async __create(
    session: Session<TActionPreset>,
    task: Task<TActionPreset> | null
  ): Promise<Array<Task<TActionPreset>>> {
    /**
     * if currentTarget === null,
     * It will crate initial task records
     */

    const asdr = this.___unfold(session.process, task)
    // if (currentTarget !== null && process.mts[currentTarget.id].leaf) return []

    /**
     * leaf node should genererate data nodes as many as asdr which are used as rows
     */
    if (task && task.leaf) {
      asdr.forEach(function (cidr) {
        /**
         * if data record from leaf task record is not spreading,
         * you don't need to create data node at all
         */
        if (Object.keys(cidr).length === 0) {
          session.process.mdn[task.id].leaf = true
          return
        }
        const dn = new DataNode({
          id: v4(),
          idr: cidr,
          parent: session.process.mdn[task!.id].id,
          leaf: true
        })
        session.process.tree.nodes.push(dn)
      })
      return []
    }

    const actr = await Promise.all(
      asdr.map(async (cidr) => {
        /**
         * 1 sdr leads to 1 tr
         */
        /**
         * you can't call getFdr on ctr
         * because you need fdr first for the ctr
         */

        // pdr : data record for predications; fdr + idr on child

        const pdr = Object.assign(session.process.getFdr(task), cidr)
        const cts = await this.___route(session.process, task, pdr)
        if (!cts) return

        const taskId = neo.stringify(cidr.__GY__TASK_RECORD_ID)

        const ctr = this.___stamp(cts, taskId)
        // if (ctask.leaf) process.ailtask.push(ctask.id)

        const ictr = ctr.id
        /**
         * none leaf node should generate data nodes after being routed only
         */
        const dn = new DataNode({
          id: v4(),
          idr: cidr,
          parent: session.process.mdn[task ? task.id : '0'].id,
          leaf: task ? task.leaf : undefined
        })

        session.process.mtr[ictr] = ctr
        session.process.tree.nodes.push(dn)
        session.process.mdn[ictr] = dn
        // process.midr[ictr] = cidr
        session.process.mts[ictr] = cts

        session.process.miptr[ictr] = task === null ? '0' : task.id
        // if (tr !== null) session.process.miptr[ictr] = tr.id

        return ctr
      })
    )

    // if (currentTarget !== null) delete process.masdr[currentTarget.id]

    // infrastructures.logger?.info('', { source: '_check', asdr, actr })

    return actr.filter((ctr): ctr is Task<TActionPreset> => ctr !== undefined)
  }

  private ___unfold(process: Process, task: Task | null): Array<DataRecord> {
    const dr = task === null ? process.idr : process.mrdr[task.id]

    const spread: Record<string, boolean> =
      task === null
        ? // process.gs
          {}
        : (process.mts[task.id].actions as Array<ActionSchema<ActionInterfaceSuperset>>).reduce(function (prev, curr) {
            return Object.assign(prev, curr.spread)
          }, {})

    const scope: Record<string, 'private' | 'public' | 'intermediate'> =
      task === null
        ? // process.gs
          {}
        : (process.mts[task.id].actions as Array<ActionSchema<ActionInterfaceSuperset>>).reduce(function (prev, curr) {
            return Object.assign(prev, curr.scope)
          }, {})

    // logger.info('check', { source: 'unfold', tid: tr ? task.id : '0', dr, spread })

    const cdr = dr
      ? Object.fromEntries(Object.entries(dr).filter(([key]) => !spread[key] && scope[key] !== 'intermediate'))
      : {}

    const expandings = Object.keys(spread).filter(
      (key) => spread[key] === true && key in dr && scope[key] !== 'intermediate'
    )

    /**
     * reduce with empty array will invoke an error
     */

    const longestExpandingKey =
      expandings.length > 0 ? expandings.reduce((prev, curr) => (dr[prev].length > dr[curr].length ? prev : curr)) : ''

    const asdr: Array<DataRecord> = longestExpandingKey
      ? Array.from({ length: dr[longestExpandingKey].length }, (_, index) =>
          Object.assign(
            Object.fromEntries(
              Object.entries(dr)
                .filter(([key]) => spread[key] === true && scope[key] !== 'intermediate')
                .map(([key, data]) => [key, data.length > index ? data.slice(index, index + 1) : [[]]])
            ),
            { TASK_INDEX: [[index.toString()]] }
          )
        )
      : [{}]

    // infrastructures.logger?.info('check data records', {
    //   source: 'worker',
    //   cdr,
    //   spread,
    //   dr,
    //   asdr
    // })

    const itr = task === null ? '0' : task.id

    Object.assign(process.mdn[itr].cdr, cdr)
    // process.mcdr[currentTarget.id] = cdr
    // process.masdr[currentTarget.id] = asdr

    delete process.mrdr[itr]

    if (task) task.state = 'RESOLVED'
    // this overwrites resolved state
    // if (tr !== null) task.state = 'UNFOLDED'

    return asdr
  }

  private async ___route(process: Process, task: Task | null, fdr: DataRecord): Promise<TaskSchema | void> {
    if (task === null) return process.ps.tasks?.at(0)?.at(0)
    const ts = process.mts[task.id]
    if (ts.leaf) return

    const currentLayerIndex = process.ps.tasks.findIndex((layer) => layer.includes(ts))

    const nextLayerIndex = currentLayerIndex + 1

    const nextTaskLayer = process.ps.tasks[nextLayerIndex]

    if (!nextTaskLayer || !nextTaskLayer.length) return

    const links = process.ps.links[currentLayerIndex].filter((l) => l.src === ts.id)

    if (links.length === 0) return

    for (const link of links.sort((a, b) => (b.predication ? 1 : 0) - (a.predication ? 1 : 0))) {
      if (!link.predication) {
        const nextTs = nextTaskLayer.find((taskSchema) => taskSchema.id === link.dest)
        if (!nextTs) throw new Error(`NO_NEXT_TASK_FOUND_ON_LINK:${ts.name}/${link.src}-to-${link.dest}`)
        return nextTs
      }

      const validated = await runScript({ code: link.predication, params: { dr: fdr } })

      if (typeof validated !== 'boolean') throw new Error(`TYPE_CONFLICT:PREDICATE_BOOLEAN_VALUE`)

      if (!validated) continue

      const nextTs = nextTaskLayer.find((taskSchema) => taskSchema.id === link.dest)
      if (!nextTs) throw new Error(`NO_NEXT_TASK_FOUND_ON_LINK:${ts.name}/${link.src}-to-${link.dest}`)
      return nextTs
    }
  }

  private ___stamp(ts: TaskSchema, id?: string): Task<TActionPreset> {
    if (!ts.validated) throw new Error('STAMP:TS_INVALID')

    return {
      id: id || v4(),
      $actions: ts.actions.map((as) => ({
        id: v4(),
        schema: as.id,
        template: as.template,
        name: as.name,
        // value: _substitute({ asValue: as.value, dr: fdr }),
        value: as.value,
        spread: as.spread,
        state: 'WATING'
      })),
      state: 'UNALLOCATED' as TaskRecordState,
      sharing: ts.sharing,
      root: ts.root,
      leaf: ts.leaf
    }
  }

  private __distribute(session: Session<TActionPreset>, atr: Array<Task<TActionPreset>>) {
    // compute which worker should get tr based on ars

    atr.forEach(function (task) {
      // const urgent = session.workers.find((w) =>
      //   Array.from(w.lars).some((ars) => ars.value.some((ar) => tr.actions.includes(ar)))
      // )
      // if (urgent) return urgent._queue.unshift(tr)

      const affordable = session.workers.reduce((a, b) => (a._queue.length > b._queue.length ? b : a))

      // if (!affordable) throw new Error('FAILED_TO_DISTRIBUTE')

      // const lars = _findLars(session, tr)

      // lars.forEach((ars) => affordable.lars.add(ars))

      return affordable._queue.push(task)
    })
  }

  private __instruct(session: Session<TActionPreset>) {
    return session.workers.map(function (w) {
      if (w.currentTarget === null) w.load()
      return w.start()
    })
  }

  private __appendDataRecord(session: Session<TActionPreset>, task: Task, dr: DataRecord) {
    Object.assign(session.process.mrdr, { [task.id]: dr })
  }

  private __isDone(session: Session<TActionPreset>) {
    /**
     * need to clarify about worker state
     */
    if (
      session.workers.every((w) => w.currentTarget === null || w.currentTarget.state === 'RESOLVED') &&
      session.workers.every((w) => w.state === 'WATING') &&
      session.workers.every((w) => w._queue.length === 0)
    )
      return true

    return false
  }

  private __cleanupResources(session: Session<TActionPreset>) {
    return Promise.all(
      Object.values(session.resources).map(function dispose(proxy) {
        proxy.resources.forEach(function (r) {
          session.workers
            .filter((w) => w.currentTarget)
            .flatMap((w) => w.currentTarget!.$actions)
            .forEach(function ($action) {
              if (proxy.isPreempted($action)) proxy.next($action)
              if (proxy.isReserved($action)) proxy.cancel($action)
            })
        })
        return proxy.dispose()
      })
    )
  }

  public async invoke({
    pid,
    gdr,
    idr,
    $cdr,
    // scripts,
    effect,
    trees,
    overwriteGdr
  }: {
    pid?: string
    gdr?: DataRecord
    idr?: ProcedureSchema['idr']
    $cdr?: ProcedureSchema['$cdr']
    trees: Array<DataTree>
    effect: Effect
    // scripts: Array<Script>
    overwriteGdr?: boolean
  }) {
    const scripts = await Promise.all(
      effect.__i__scripts.map((sequence) =>
        Promise.all(
          sequence
            .filter((sid) => effect.config.disabled.every((d) => d !== sid))
            .map((sid) => this.readScript({ sid }))
        )
      )
    )

    // const scripts = await Promise.all(
    //   effect.scriptIds
    //     .filter((sid) => effect.config.disabled.every((d) => d !== sid))
    //     .map((sid) => this.readScript({ sid }))
    // )

    const r: Record<string, Record<string, any>> = {}

    async function interpretContextDataRecord({ edr }: { edr?: DataRecord }) {
      return Object.fromEntries(
        await Promise.all(
          Object.entries($cdr || {}).map(async function ([substitute, raw]) {
            return [substitute, await interpret(raw, { edr })]
          })
        )
      )
    }

    for (const tree of trees.map((tree) => ({
      ...tree,
      nodes: tree.nodes.with(
        tree.nodes.findIndex((dn) => dn.id === '0'),
        new DataNode({ id: '0', cdr: overwriteGdr ? { ...gdr, ...idr } : { ...idr, ...gdr }, idr: {} })
      )
    }))) {
      r[tree.id] = {}

      const context = {}

      await Promise.all(
        scripts.map(async (sequence) => {
          let prevScriptResult

          for (const script of sequence) {
            try {
              prevScriptResult = await runScript({
                code: script.code,
                params: {
                  prevScriptResult,
                  tree,
                  pid,
                  idr,
                  $cdr,
                  context,
                  interpretContextDataRecord,
                  ...this.getEffEnv()
                }
              })
            } catch (err: any) {
              if (this.onEffectFailed)
                this.onEffectFailed({
                  $: this.state.$scripts.find(($s) => $s.sid === script.id)!,
                  err
                })

              throw err
            }
            r[tree.id][script.id] = prevScriptResult
          }
        })
      )
    }

    return r
  }

  public pause({ sessionId }: { sessionId: string }) {
    const session = this.getSessions()[sessionId]

    if (!session) return

    const thread = session.resources.thread?.resources?.at(0)

    if (!thread) return

    return thread.pause()
  }

  public resume({ sessionId }: { sessionId: string }) {
    const session = this.getSessions()[sessionId]

    if (!session) return

    const thread = session.resources.thread?.resources?.at(0)

    if (!thread || thread.value !== 'pause') return

    return thread.next()
  }

  public readScript({ sid }: { sid: string }) {
    const filePath = path.join(this.getWorkdir(), 'scripts', `${sid}.json`)

    if (!fs.existsSync(filePath)) throw new Error('GY.READ_SCRIPT:NO_SCRIPT_FOUND')

    return JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' })) as Script
  }

  private _writeScript({ script }: { script: Script }) {
    return new Promise<void>((resolve, reject) => {
      const dir = path.join(this.getWorkdir(), 'scripts')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      const filePath = path.join(dir, `${script.id}.json`)
      fs.writeFile(filePath, JSON.stringify(script, null, 2), 'utf-8', function (err) {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  private _createScriptDescriptorOn({ script }: { script: Script }) {
    const sd: ScriptDescriptor = {
      hash: getContentHash(JSON.stringify(script)),
      sid: script.id,
      name: script.name,
      // size,
      version: this.version
    }

    return sd
  }

  private _storeScriptDescriptor({ descriptor }: { descriptor: ScriptDescriptor }) {
    this.state.$scripts.push(descriptor)
  }

  public async createScript({ name, code = '' }: { name: string; code: string }) {
    const script: Script = {
      name,
      id: v4(),
      code,
      required: [],
      optional: []
    }

    const descriptor = this._createScriptDescriptorOn({ script })
    this._storeScriptDescriptor({ descriptor })
    await this._writeScript({ script })

    return { script, descriptor }
  }

  public async updateScript({ partial }: { partial: Partial<Script> }) {
    if (!partial.id) throw new Error('GY.UPDATE_SCRIPT:NO_SCRIPT_ID')

    const script = this.readScript({ sid: partial.id })

    const newScript = { ...script, ...partial }

    const desc = this.state.$scripts.find(($) => $.sid === script.id)

    if (!desc) throw new Error('GY.UPDATE_SCRIPT:NO_DESCRIPTION_MATCHED')

    const hash = getContentHash(JSON.stringify(newScript))

    if (desc.hash === hash) return

    const newDesc = this._createScriptDescriptorOn({ script: newScript })

    const index = this.state.$scripts.findIndex(($) => $.sid === script.id)

    this.state.$scripts.splice(index, 1, newDesc)

    return this._writeScript({ script: newScript })
  }

  public deleteScript({ sid }: { sid: string }) {
    const descriptor = this.state.$scripts.find(($) => $.sid === sid)

    if (!descriptor) return

    const index = this.state.$scripts.findIndex(($) => $.sid === sid)

    this.state.$scripts.splice(index, 1)

    fs.unlinkSync(path.join(this.workdir, 'scripts', `${sid}.json`))
  }

  public async updateScriptDescriptor({ partial }: { partial: Partial<ScriptDescriptor> }) {
    const { sid } = partial

    if (!sid) throw new Error('UPDATE_SCRIPT_DESC:SID_REQUIRED')

    const descriptor = this.state.$scripts.find(($) => $.sid === sid)

    if (!descriptor) throw new Error('UPDATE_SCRIPT_DESC:NO_SCRIPT_DESC_MATCHED')

    // const index = this.state.$scripts.findIndex(($) => $.sid === sid)

    if (partial.name && partial.name !== descriptor.name)
      this.updateScript({ partial: { name: partial.name, id: descriptor.sid } })

    Object.assign(descriptor, partial)

    // this.state.$scripts.splice(index, 1, descriptor)
  }

  public async copyScript({ sid }: { sid: string }) {
    const originalDescriptor = this.state.$scripts.find(($) => $.sid === sid)

    if (!originalDescriptor) throw new Error('COPY_SCRIPT:NO_ORIGINAL_FOUND')

    const sd: ScriptDescriptor = {
      ...originalDescriptor,
      sid: v4(),
      name: `복사된 ${originalDescriptor.name}`
    }

    const script = await this.readScript({ sid })
    script.id = sd.sid

    await this._writeScript({ script })

    this._storeScriptDescriptor({ descriptor: sd })

    return { descriptor: sd, script }
  }

  public readProcedureSchema({ pid }: { pid: string }): ProcedureSchema {
    const filePath = path.join(this.getWorkdir(), 'procedures', `${pid}.json`)

    if (!fs.existsSync(filePath)) throw new Error('GY.READ_PROCEDURE_SCHEMA:NO_SCHEMA_FOUND')

    const schema = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

    return schema
  }

  private _writeProcedureSchema({ schema }: { schema: ProcedureSchema }) {
    return new Promise<void>((resolve, reject) => {
      const dir = path.join(this.getWorkdir(), 'procedures')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      const stringified = JSON.stringify(schema, null, 2)

      if (!stringified) console.error('schema updated in empty')

      const filePath = path.join(dir, `${schema.id}.json`)
      fs.writeFile(filePath, stringified, 'utf-8', function (err) {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  private _createProcedureDescriptorOn({ schema }: { schema: ProcedureSchema }): ProcedureDescriptor<TTriggerPreset> {
    // const filePath = path.join(getWorkdir(), 'procedures', `${procedure.id}.json`)
    // const size = await measureUp(filePath)
    // const procedure = await readProcedureSchema(pid)

    // const $procedures = appStore.get('$procedures')

    const record: ProcedureDescriptor<TTriggerPreset> = {
      hash: getContentHash(JSON.stringify(schema)),
      pid: schema.id,
      name: schema.name,
      // size,
      version: this.version,
      descriptive: '',
      config: {
        invokeEffectImmediately: true,
        preserveTree: false,
        strict: true,
        // waitOnEffectResolved: true,
        priority: 0
      },
      effect: { __i__scripts: [], config: { disabled: [] } },
      triggers: []
    }

    // appStore.set(`$procedures.${$procedures.length}`, record)

    return record
  }

  private _storeProcedureDescriptor({ descriptor }: { descriptor: ProcedureDescriptor<TTriggerPreset> }) {
    this.state.$procedures.push(descriptor)
  }

  public async createProcedureSchema({ schema }: { schema: ProcedureSchema }) {
    const desc = this._createProcedureDescriptorOn({ schema })
    this._storeProcedureDescriptor({ descriptor: desc })
    await this._writeProcedureSchema({ schema })

    return desc
  }

  public async deleteProcedure({ pid }: { pid: string }) {
    const descriptor = this.state.$procedures.find(($) => $.pid === pid)

    if (!descriptor) return

    await Promise.all(
      descriptor.triggers
        .flat()
        .map((t) =>
          this.trigger.cancel[t.template](t as Trigger<Extract<TTriggerPreset, { template: typeof t.template }>>)
        )
    )

    const index = this.state.$procedures.findIndex(($) => $.pid === pid)

    this.state.$procedures.splice(index, 1)

    fs.unlinkSync(path.join(this.workdir, 'procedures', `${pid}.json`))
  }

  public async copyProcedureSchema({ pid }: { pid: string }) {
    const originalDescriptor = this.state.$procedures.find(($) => $.pid === pid)

    if (!originalDescriptor) throw new Error('COPY_PROCEDURE:NO_ORIGINAL_FOUND')

    const desc: ProcedureDescriptor<TTriggerPreset> = {
      ...originalDescriptor,
      pid: v4(),
      name: `복사된 ${originalDescriptor.name}`,
      triggers: []
    }

    const schema = this.readProcedureSchema({ pid })
    schema.id = desc.pid

    const links = schema.links.flat()
    const tasks = schema.tasks.flat()

    tasks.forEach(function (ts) {
      const newId = v4()

      links
        .filter((l) => l.dest === ts.id)
        .forEach(function (l) {
          l.dest = newId
        })
      links
        .filter((l) => l.src === ts.id)
        .forEach(function (l) {
          l.src = newId
        })

      ts.id = newId

      ts.actions.forEach(function (as) {
        as.id = v4()
      })
    })

    await this._writeProcedureSchema({ schema })
    this._storeProcedureDescriptor({ descriptor: desc })

    return { descriptor: desc, schema }
  }

  public async updateProcedureSchema({ partial }: { partial: Partial<ProcedureSchema> }) {
    if (!partial.id) throw new Error('GY.UPDATE_PROCEDURE_SCHEMA:NO_SCHEMA_ID')

    const schema = this.readProcedureSchema({ pid: partial.id })

    // console.log('updating')

    // console.log('original: ', schema)

    // console.log('update: ', partial)

    const newSchema = { ...schema, ...partial }

    // console.log('new schema: ', newSchema)

    const hash = getContentHash(JSON.stringify(newSchema))

    const desc = this.state.$procedures.find(($) => $.pid === schema.id)

    if (!desc) throw new Error('GY.UPDATE_PROCEDURE_SCHEMA:NO_DESCRIPTION_MATCHED')

    if (desc.hash === hash) return

    desc.hash = hash

    const index = this.state.$procedures.findIndex(($) => $.pid === schema.id)

    this.state.$procedures.splice(index, 1, desc)

    return this._writeProcedureSchema({ schema: newSchema })
  }

  public async updateProcedureDescriptor({ partial }: { partial: Partial<ProcedureDescriptor<TTriggerPreset>> }) {
    const { pid } = partial

    if (!pid) throw new Error('UPDATE_PROCEDURE_DESCRIPTOR:NO_PID')

    const descriptor = this.state.$procedures.find(($) => $.pid === pid)

    if (!descriptor) throw new Error('CHANGE_PROCEDURE_NAME:NO_PROCEDURE_MATCHED')

    if (partial.name && partial.name !== descriptor.name)
      this.updateProcedureSchema({ partial: { name: partial.name, id: descriptor.pid } })

    const index = this.state.$procedures.findIndex(($) => $.pid === pid)

    Object.assign(descriptor, partial)

    this.state.$procedures.splice(index, 1, descriptor)
  }

  private _configTreeId({ tree }: { tree: DataTree }) {
    if (tree.id) return
    tree.id = neo.stringify(edward.topDownSearch({ tree, key: 'GATSBY_TREE_ID' }) || []) || v4()
  }

  private _mergeTrees(
    trees: Array<SerializedDataTree>,
    root: SerializedDataNode = { idr: {}, id: '0', cdr: {} }
  ): SerializedDataTree {
    const merged: SerializedDataTree = {
      id: v4(),
      nodes: [root].concat(trees.flatMap((tree) => tree.nodes).filter((node) => node.id !== '0'))
    }

    return merged
  }

  private _filterTree({ session }: { session: Session }) {
    const { tree } = session.process

    const scope: ActionSchema['scope'] = session.process.ps.tasks
      .flat()
      .flatMap((ts) => ts.actions.map((as) => as.scope))
      .reduce(
        (prev, curr) => Object.assign(prev, curr),
        /**
         * better make it configurable?
         */
        Object.fromEntries(Object.keys(session.process.ps.idr).map((substitute) => [substitute, 'private']))
      )

    const scopeApplied = tree.nodes.map(function (dn) {
      const cdr = Object.fromEntries(
        Object.entries(dn.cdr).filter(([substitute, matrix]) => !scope[substitute] || scope[substitute] === 'public')
      )

      const idr = Object.fromEntries(
        Object.entries(dn.idr).filter(([substitute, matrix]) => !scope[substitute] || scope[substitute] === 'public')
      )

      return { ...dn, cdr, idr }
    }) as Array<DataNode>

    const publicGdr = edward
      .topDownSearch({ tree, key: 'GATSBY_PUBLIC_GDR', defaultValue: [['GATSBY_TREE_NAME']] })!
      .flat()
    const root = scopeApplied.find((node) => node.id === '0')
    if (!root) throw new Error('FILTER_TREE:NO_ROOT_NODE_FOUND')

    Object.keys(root.cdr)
      .filter((key) => publicGdr.every((_) => _ !== key))
      .forEach((key) => delete root.cdr[key])

    return tree
  }

  private _createTreeDescriptorOn({ tree }: { tree: DataTree }) {
    // const size = JSON.stringify(tree).length

    const record: TreeDescriptor = {
      name: neo.stringify(edward.topDownSearch({ tree, key: '__GY_TREE_NAME__' })) || 'unknown',
      alias: neo.stringify(edward.topDownSearch({ tree, key: '__GY_TREE_ALIAS__' })) || '',
      keywords: (edward.topDownSearch({ tree, key: '__GY_TREE_KEYWORDS__' }) || []).flat(),
      routes: (edward.topDownSearch({ tree, key: '__GY_NAVIGATION_HISTORY__' }) || []).flat(),
      require: (edward.topDownSearch({ tree, key: '__GY_REQUIREMENT__' }) || []).flat(),
      // tid: stringify(topDownSearch(tree, 'GATSBY_TREE_ID')),
      tid: tree.id,
      hid: neo.stringify(edward.topDownSearch({ tree, key: '__GY_HOST_ID__' })),
      cid: neo.stringify(edward.topDownSearch({ tree, key: '__GY_CONTEXT_ID__' })) || '',
      pid: neo.stringify(edward.topDownSearch({ tree, key: '__GY_PROCEDURE_ID__' })),
      version: this.version,
      context: (edward.topDownSearch({ tree, key: '__GY_CONTEXT__' }) || []).flat(),
      date: Date.now(),
      sequence: tree.nodes.filter((dn) => dn.leaf).length
      // size
    }

    return record
  }

  private _storeTreeDescriptor({ descriptor }: { descriptor: TreeDescriptor }) {
    this.state.$trees.push(descriptor)
  }

  private _writeTree({ tree, saveAt }: { tree: DataTree; saveAt?: string }) {
    return new Promise<void>((resolve, reject) => {
      const dir = saveAt || path.join(this.getWorkdir(), 'trees')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

      const id = neo.stringify(edward.topDownSearch({ tree, key: '__GY_TREE_FILE_NAME__' })) || tree.id

      const filePath = path.join(dir, `${id}.json`)

      fs.writeFile(filePath, JSON.stringify(tree, null, 2), 'utf-8', function (err) {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  public readTree({ treePath }: { treePath: string }): Promise<DataTree | void> {
    const { dir, name: tid } = path.parse(treePath)

    return new Promise<DataTree | void>((resolve, reject) => {
      const filePath = path.join(dir || path.join(this.getWorkdir(), 'trees'), `${tid}.json`)
      if (!fs.existsSync(filePath)) return resolve()
      fs.readFile(filePath, 'utf-8', function (err, data) {
        if (err) return resolve()
        resolve(JSON.parse(data))
      })
    })
  }
}
