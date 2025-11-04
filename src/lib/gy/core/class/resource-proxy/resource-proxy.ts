import { Resource } from '../resource'

type ResourceProxyOptions<H, T extends string = string, V = undefined> = {
  template: T
  resources: Array<Resource<H, T, V>>
  capacity?: number
  assign?: () => Promise<Resource<H, T, V>>
}

export class ResourceProxy<H, T extends string = string, V = undefined> {
  template: T

  resources: Array<Resource<H, T, V>>

  capacity?: number

  assign?: () => Promise<Resource<H, T, V>>

  constructor({ resources, template, capacity, assign }: ResourceProxyOptions<H, T, V>) {
    this.template = template
    this.resources = resources
    this.capacity = capacity
    this.assign = assign
  }

  dispose() {
    return this.resources.map(function (r) {
      r.removeAllListeners()

      if (r.dispose && !r.global) return r.dispose()
      return Promise.resolve()
    })
  }

  async acquire(claimer: H) {
    /**
     * every method returns 'true' on empty
     */
    if (
      this.assign &&
      (this.capacity === undefined ||
        (this.capacity && this.resources.length < this.capacity && this.resources.every((r) => r.holder !== undefined)))
    ) {
      // this.capacity++
      const r = await this.assign()
      this.resources.push(r)
      return r.acquire(claimer)
    }

    const affordable =
      this.resources.find((r) => r.holder === undefined) ||
      this.resources.reduce((a, b) => (a._queue.length > b._queue.length ? b : a))

    if (!affordable) throw new Error(`RESOURCE_${this.template}_UNAVAILABLE`)

    return affordable.acquire(claimer)
  }

  queue(claimer: H) {
    // if (this.resources.some((r) => r._queue.includes(claimer))) return

    const affordable = this.resources.reduce(function (a, b) {
      return a._queue.length > b._queue.length ? b : a
    })

    affordable._queue.push(claimer)
  }

  getAffordable() {
    if (this.resources.length === 0) return null

    return (
      this.resources.find((r) => r.holder === undefined) ||
      this.resources.reduce((a, b) => (a._queue.length > b._queue.length ? b : a))
    )
  }

  isPreempted(claimer: any) {
    return this.resources.some((r) => r.holder === claimer)
  }

  isReserved(claimer: any) {
    return this.resources.some((r) => r._queue.includes(claimer))
  }

  cancel(claimer: any) {
    const resources = this.resources.filter((r) => r._queue.includes(claimer))
    return resources.forEach(function (r) {
      r._queue = r._queue.filter((h) => h !== claimer)
    })
  }

  next(holder: any) {
    const resources = this.resources.filter((r) => r.holder === holder)
    // if (!r) throw new Error(`no resource claimed by ${r}`)
    // if (!resources.length) console.error(`no resource claimed by ${holder}`)
    return resources.forEach((r) => r.next())
  }
}
