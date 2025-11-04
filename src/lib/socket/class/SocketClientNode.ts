import { v4 } from 'uuid'
import { ClientOptions, WebSocket } from 'ws'

export type SocketClientNodeOptions = {
  url: string
  name: string
  socketClientOptions?: ClientOptions
}

export class SocketClientNode extends WebSocket {
  _ready: Promise<void>

  name: string

  connected: boolean

  readonly id: string

  constructor({ url, name, socketClientOptions }: SocketClientNodeOptions) {
    super(url, socketClientOptions)

    this.name = name
    this.id = v4()
    this.connected = false
    let _clearInterval: any

    let _resolve: (value: void | PromiseLike<void>) => void
    let _reject: (reason?: any) => void

    this._ready = new Promise(function (resolve, reject) {
      _resolve = resolve
      _reject = reject
    })

    this.on('close', (code, reason) => {
      _reject(`${code}:${reason}`)
      this.connected = false
      globalThis.clearInterval(_clearInterval)
      console.log(`closed`)
      console.log(`code : ${code}`)
      console.log(`reason : ${reason}`)
      this._ready = new Promise(function (resolve, reject) {
        _resolve = resolve
        _reject = reject
      })
    })

    this.on('open', () => {
      this.connected = true
      _resolve()
      _clearInterval = setInterval(() => {
        this.ping()
      }, 5000)
    })
  }

  ready() {
    return this._ready
  }

  cleanup() {
    this.removeAllListeners()
  }
}
