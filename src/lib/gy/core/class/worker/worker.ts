import { EventEmitter } from 'events'
import { $Action, ActionInterfaceSuperset } from '../../type/action'
import { DataRecord } from '../../type/primitive'
import { Task } from '../../type/task'
import { Session } from '../session'
import { NoTaskLoaded } from './error'

type WorkerOptions<TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset> = {
  // config: Record<string, string>
  // infrastructures: {
  //   evHandler: EventHandlerNode<'MAIN'>
  //   logger?: Logger
  // }

  // context: {
  //   session: Session<TActionInterface>
  //   // consumer: ActionConsumer<TActionInterface>
  // }
  // process: Process
  // requestForwarding: () => Promise<() => void>
  // interpretActionValue: ({ asValue, dr }: { asValue: ActionSchema['value']; dr: DataRecord }) => Action['value']
  id: string
}

type WorkerState = 'WATING' | 'RUNNING' | 'HALTED' | 'PENDING'

// cpu-like role
export class Worker<TActionInterface extends ActionInterfaceSuperset = ActionInterfaceSuperset> extends EventEmitter {
  id: string

  dr: DataRecord

  state: WorkerState

  _queue: Array<Task<TActionInterface>>

  // lars: Set<ActionRecordSequence>

  context: {
    session: Session<TActionInterface>
    // consumer: ActionConsumer<TActionInterface>
  }

  // interpretActionValue: ({ asValue, dr }: { asValue: ActionSchema['value']; dr: DataRecord }) => Action['value']

  abort: null | ((reason?: any) => void)

  currentTarget: Task<TActionInterface> | null

  work: Promise<[Task<TActionInterface>, DataRecord]>

  // It's awkward that entity that is locked have lock property and method
  // lock: boolean

  constructor({
    id
  }: // context
  // consume,
  // session
  // infrastructures,
  // config,
  // interpretActionValue
  // requestForwarding
  WorkerOptions<TActionInterface>) {
    super()

    this.id = id
    this.state = 'WATING'
    this.dr = {}

    // this.consumer = consumer
    // this.config = config
    // this.infrastructures = infrastructures
    // It's like a stack frame pointer
    this.currentTarget = null
    this._queue = []
    // this.interpretActionValue = interpretActionValue
    this.abort = null

    // this.lars = new Set()
    // this.context = context

    // this.consume = consume

    // this.on('queue', (atr: Array<Task<TActionInterface>>, urgent?: boolean) => {
    //   if (urgent) this._queue.unshift(...atr)
    //   else this._queue.push(...atr)

    //   const load = this._queue.shift()
    //   if (load && !this.currentTarget) this.currentTarget = load

    //   this.start()
    // })

    // this.on('stop', this.stop)

    // this.on('start', this.start)

    /**
     * request manager for resources like making binding tab active or highlight
     * required for doing special actions like clicking elements or loading html
     * that is not possible to do at the same time by multiple workers for physical or external factors
     */
    // this.requestForwarding = requestForwarding
  }

  setContext(context: { session: Session<TActionInterface> }) {
    this.context = context
  }

  toJSON() {
    return {
      id: this.id,
      state: this.state,
      currentTarget: this.currentTarget,
      dr: this.dr,
      _queue: this._queue
      // lars: this.lars
    }
  }

  queue(...atr: Array<Task<TActionInterface>>) {
    this._queue.push(...atr)
  }

  load() {
    this.currentTarget = this._queue.shift() || null
    if (this.currentTarget) this.currentTarget.state = 'PENDING'
  }

  setState(state: WorkerState) {
    this.state = state
  }

  // _isHeadAction(ar: ActionRecord<Actions>) {
  //   switch (ar.template) {
  //     case 'LOAD_URL': {
  //       return true
  //     }
  //     default: {
  //       return false
  //     }
  //   }
  // }

  // _isTailAction(ar: ActionRecord<Actions>) {
  //   switch (ar.template) {
  //     case 'CLICK': {
  //       // if clicking on a html element then return true
  //       return false
  //     }
  //     case 'EVAL_BINDING_TAB': {
  //       return true
  //     }
  //     default: {
  //       return false
  //     }
  //   }
  // }

  /**
   * this converts columns into rows
   * which is appropriate for appending row one by one or creating tasks
   */
  private _consume() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<DataRecord>(async (resolve, reject) => {
      await this.context.session.resources.thread.acquire(this.context.session)

      // template's type is a union of action templates which causes Intersection type as all templates out of Extract type genenric
      if (this.currentTarget === null) return reject(new Error('TR_NOT_LOADED'))

      const fdrOnParent = this.context.session.process.miptr[this.currentTarget.id]
        ? this.context.session.process.getFdr(this.context.session.process.miptr[this.currentTarget.id])
        : {}

      const idr = this.context.session.process.getIdr(this.currentTarget)

      const edr = { ...fdrOnParent, ...idr }

      this.dr = {}

      try {
        for (const [index, $action] of this.currentTarget.$actions.entries()) {
          $action.state = 'PENDING'

          // this.infrastructures.logger?.info('consuming action', { source: 'worker', ar: ar.name, template: ar.template })

          // data record for evaluation = fdr on parent + sdr for current target + accumulated data record in the same task

          // Object.fromEntries(
          //     Object.entries(this.session.process.idr).filter(([key]) => this.session.process.gs[key] === true)
          //   )

          Object.assign(edr, this.dr)

          // need to find out a way to get lars from worker
          // const lars: Array<ActionRecordSequence> = this.session.lars.filter((ars) => ars.value.includes(ar))

          // this.infrastructures.logger?.info('edr check', {
          //   source: 'worker',
          //   edr,
          //   fdrOnParent,
          //   miptr: this.process.miptr,
          //   currId: this.currentTarget.id,
          //   mdn: this.process.mdn
          // })

          // action.value = this.interpretActionValue({ asValue: action.value, dr: edr })

          const sequence = this.currentTarget.$actions
            .slice(
              0,
              this.currentTarget.$actions.findIndex((_) => _ === $action)
            )
            .reverse()
            .concat(this.context.session.process.getAscendants(this.currentTarget.id).flatMap((tr) => tr.$actions))

          const partial: DataRecord = Object.fromEntries(
            Object.entries(
              await this.context.session.consumer[$action.template as TActionInterface['template']]({
                // @ts-ignore
                action: undefined,
                $action: $action as $Action<Extract<TActionInterface, { template: typeof $action.template }>>,
                context: {
                  resources: this.context.session.resources,
                  // task: this.currentTarget,
                  edr,
                  sequence
                  // lars
                }
                // fallback
              }).catch((err) => {
                /**
                 * prevent to block other processes
                 */
                Object.values(this.context.session.resources).forEach((prxy) => prxy.next($action))
                Object.values(this.context.session.resources).forEach((prxy) => prxy.next(this.context.session))
                // Object.values(this.session.resources).forEach((proxy) => proxy.next(ar))
                throw err
              })
            )
          )

          $action.state = 'RESOLVED'

          /**
           * unhold the resources claimed by the ars including this ar on being resolved
           */
          // lars.forEach((ars) => {
          //   const ass = this.session.lass.find((ass) => ass.id === ars.schema)!
          //   if (
          //     ars.value.some((ar) => ar.state === 'PENDING') ||
          //     /**
          //      * expected to extend the ars
          //      */
          //     ass.value.some((layer) => !layer.every((as) => ars.value.some((ar) => ar.schema === as.id)))
          //   )
          //     return
          //   const resourceTemplate = this.session.resourceMap[ars.schema]
          //   this.session.resources[resourceTemplate].next(ars)
          // })

          Object.assign(this.dr, partial)
          // this.infrastructures.logger?.info('consumed action', { source: 'worker', ar: ar.name, template: ar.template })
        }
      } catch (err) {
        return reject(err)
      } finally {
        this.context.session.resources.thread.next(this.context.session)
      }

      this.currentTarget.state = 'CONSUMED'
      return resolve(this.dr)
    })
  }

  start(): Promise<[Task<TActionInterface>, DataRecord]> {
    if (!this.currentTarget) return Promise.reject(new NoTaskLoaded(`WORKER_${this.id}:NO_TR_LOADED`))

    if (this.state === 'RUNNING') return this.work

    if (this.state === 'PENDING') return this.work

    this.setState('RUNNING')
    // this.infrastructures.logger?.info('start', { source: 'worker', process: this.process.ps.name })
    // eslint-disable-next-line no-async-promise-executor
    this.work = new Promise<[Task<TActionInterface>, DataRecord]>(async (resolve, reject) => {
      if (!this.currentTarget) return reject(new NoTaskLoaded(`WORKER_${this.id}:NO_TASK_LOADED`))
      this.abort = reject

      try {
        /**
         * todo : forwarding promise should be rejected on aborting
         */
        // this.infrastructures.logger?.info('check ct', { source: 'worker', currentTarget: this.currentTarget })

        const dr = await this._consume().catch((err) => {
          console.error('consume error', err)
          if (this.context.session.process.pd.config.strict) throw err
          else return {}
        })
        // this.infrastructures.logger?.info('check dr', { source: 'worker', dr })

        // this.infrastructures.logger?.info('check children', { source: 'worker', children })

        // this.once(this.currentTarget.id, () => {
        //   if (this.currentTarget === null) return
        // })

        this.setState('PENDING')

        return resolve([this.currentTarget, dr])

        // this.report('task-resolved', this.currentTarget, dr)
      } catch (err: any) {
        // this.removeAllListeners(this.currentTarget.id)
        /**
         * emitting error prevents to handle error
         * don't know why
         */
        // this.emit('error', err)
        return reject(err)
      }
      // this.infrastructures.logger?.info('resolved', { source: 'worker', process: this.process.ps.name })
    })

    return this.work
  }

  pause() {
    if (!this.abort) return
    this.abort('PAUSED_BY_USER')
    this.state = 'HALTED'
  }

  stop() {
    // should clean worker and process from memory
    if (!this.abort) return
    this.abort('STOP_BY_USER')
  }
}
