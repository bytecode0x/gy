import { EventEmitter } from 'events'

/**
 * might be better to change name into Lock
 */

type ResourceOptions<T extends string = string, V = undefined> = {
  id: string | number
  template: T
  value: V
  global?: boolean
  dispose?: () => Promise<void>
}

export class Resource<H, T extends string = string, V = undefined> extends EventEmitter {
  id: string | number

  template: T

  value: V

  holder: undefined | H

  usageLog: Array<H>

  dispose?: () => Promise<void>

  global?: boolean

  _queue: Array<H>

  constructor({ value, template, global, id, dispose }: ResourceOptions<T, V>) {
    super()
    this.id = id
    this._queue = []
    this.template = template
    this.value = value
    this.holder = undefined
    this.usageLog = []
    this.global = global

    this.dispose = dispose
  }

  toJSON() {
    return {
      id: this.id,
      template: this.template,
      value: this.value,
      holder: this.holder,
      usageLog: this.usageLog,
      _queue: this._queue
    }
  }

  acquire(claimer: H, urgent?: boolean) {
    return new Promise<V>(async (resolve, reject) => {
      if (this.holder === claimer) return resolve(this.value)
      if (!this._queue.includes(claimer)) this.queue(claimer, urgent)
      if (!this.holder) this.next()
      if (this.holder === claimer) return resolve(this.value)

      // if (!this.queue.includes(claimer)) this.queue.push(claimer)

      const onAcquired = () => {
        if (claimer !== this.holder) return
        this.off('acquired', onAcquired)
        this.off('abort', onAbort)

        // next should be called manually according to business logic
        // this.next()
        return resolve(this.value)
      }

      const onAbort = (c: H, reason?: string) => {
        if (claimer !== c) return
        this.off('acquired', onAcquired)
        this.off('abort', onAbort)
        if (this.holder === c) this.holder = undefined
        /**
         * this might invoke race condition
         */
        if (this._queue.includes(c)) this._queue = this._queue.filter((q) => q !== c)
        this.next()
        return reject(new Error(reason || `resource acquire on ${this.template} is rejected`))
      }

      this.on('acquired', onAcquired)
      this.on('abort', onAbort)
    })
  }

  pause() {
    const pseudoClaimer = { v: 'pause' } as H
    return this.acquire(pseudoClaimer, true)
  }

  queue(claimer: H, urgent?: boolean) {
    if (urgent) return this._queue.unshift(claimer)
    this._queue.push(claimer)
  }

  next() {
    if (this.holder) this.usageLog.push(this.holder)
    this.holder = this._queue.shift()
    if (!this.holder) return
    this.emit('acquired', this.holder)
  }

  abort(claimer: H, reason?: string) {
    this.emit('abort', claimer, reason)
  }
}
