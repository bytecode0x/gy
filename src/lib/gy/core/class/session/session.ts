import { EventEmitter } from 'events'
import { ActionConsumer, ActionInterfaceSuperset201 } from '../../type/action'
import { Process } from '../../type/process'
import { ResourceProxy } from '../resource-proxy'
import { Worker } from '../worker'

export type SessionOptions<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> = {
  id: string
  process: Process<TActionInterface>
  // ps: LocalProcedureSchema
  // pr: ProcedureRecord
  consumer: ActionConsumer<TActionInterface>
  workers: Array<Worker<TActionInterface>>
  // lass: Array<ActionSchemaSequence>
  // lars: Array<ActionRecordSequence>
  // resources: Record<ResourceTemplate, ResourceProxy<ActionRecordSequence>>

  // resources: {
  //   thread: ResourceProxy<Session, 'thread', undefined>
  //   context: ResourceProxy<Action<ActionInterfaceSuperset>, 'context', undefined>
  // } & Record<string, ResourceProxy<any, string, any>>

  resources: Record<string, ResourceProxy<any, string, any>>
}

export class Session<
  TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201
> extends EventEmitter {
  id: string

  createdAt: string

  process: Process<TActionInterface>

  // ps: LocalProcedureSchema

  // pr: ProcedureRecord

  workers: Array<Worker<TActionInterface>>

  consumer: ActionConsumer<TActionInterface>

  date: number

  // head action id : resource id
  // usageLog: Record<string, string>

  // lass: Array<ActionSchemaSequence>

  // lars: Array<ActionRecordSequence>

  resources: SessionOptions['resources']

  // queue: Array<TaskRecord>

  constructor({ id, process, workers, consumer, resources }: SessionOptions<TActionInterface>) {
    super()
    this.date = Date.now()
    this.id = id
    this.process = process
    this.createdAt = new Date().toLocaleString()
    this.consumer = consumer
    // this.ps = ps
    // this.pr = pr
    // this.workers = Array.from(
    //   { length: workers },
    //   (_, i) => new Worker({ id: `worker${i}`, context: { session: this, consumer } })
    // )
    this.workers = workers
    // this.options = options
    // this.usageLog = {}
    // this.lass = lass
    // this.lars = lars
    this.resources = resources

    // this.resourceMap = resourceMap
    // this.queue = []
  }

  toJSON() {
    return {
      id: this.id,
      process: this.process,
      // workers: this.workers,
      // causes recursive reference
      resources: Object.fromEntries(
        Object.keys(this.resources).map((k) => [
          k,
          this.resources[k].resources.map((r) => ({
            id: r.id,
            value: r.value,
            holder: r.holder,
            log: k === 'thread' ? r.usageLog.map((s) => (s as Session).id) : r.usageLog
          }))
        ])
      )
    }
  }
}
