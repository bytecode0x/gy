import http from 'http'
import { WebSocketServer } from 'ws'

export type SocketServerNodeOptions = {
  httpServer: http.Server
}

export class SocketServerNode extends WebSocketServer {
  _ready: Promise<void>

  constructor({ httpServer }: SocketServerNodeOptions) {
    super({ server: httpServer })

    // this.extension = null

    let _resolve: (value: void | PromiseLike<void>) => void
    this._ready = new Promise((resolve) => {
      _resolve = resolve
    })
    this.on('listening', function () {
      _resolve()
    })
  }

  ready() {
    return this._ready.then(() => this)
  }
}
