import cors from 'cors'
import 'dotenv/config'
import express, { RequestHandler } from 'express'
import http from 'http'
import { SocketServerNode } from 'lib/socket/class'
import { WebSocket } from 'ws'
import { getEvHandler } from './event/event-handler'
import { logger } from './logger'

let socketSever: SocketServerNode

let extensionSocket: WebSocket

export function initializeSocketSever() {
  const app = express()

  app.use(express.json())

  const logMiddleware: RequestHandler = (req, _res, next) => {
    if (req.method === 'GET')
      logger.info(`Got request : ${Date.now()}`, {
        source: 'express',
        params: req.params,
        url: req.url,
        body: req.body,
        query: req.query
      })
    if (req.method === 'POST') logger.info(`Got request : ${Date.now()}`, { source: 'express' })
    next() // Passing the request to the next handler in the stack.
  }

  if (process.env.NODE_ENV === 'development') {
    app.use(logMiddleware)
  }

  app.use(cors())

  app.get('/fulfill', async function (req, res) {
    const { channel } = req.query
    if (!channel || typeof channel !== 'string')
      // throw new Error('PROTOCOL_HANDLE:FULFILL:NO_CHANNEL')
      return res.status(400).send(/* HTML */ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Fullfillment Failed</title>
          </head>
          <body>
            <h1>Fullfillment Failed</h1>
          </body>
        </html>
      `)
    const serialized = JSON.stringify(req.query)

    const eh = getEvHandler()

    eh.fulfill(channel, serialized)
    // await evHandler.sendEvent<Fulfill>({
    //   name: 'FULFILL',
    //   payload: { channel, value: serialized },
    //   meta: { receiver: { component: 'RENDERER', alias: 'USER' } }
    // })

    res.status(200).send(/* HTML */ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Fulfilled</title>
        </head>
        <body>
          <h1>Fulfilled<br /></h1>
          ${Object.entries(req.query)
            .map(function ([channel, value]) {
              return `<div><h2><b>${channel}</b></h2><h3>${value}</h3></div>`
            })
            .join('<br />')}
          <script defer>
            window.setTimeout(function () {
              window.close()
            }, 3000)
          </script>
        </body>
      </html>
    `)
  })

  const port = 15171

  /**
   * loads are in body at POST
   * in query in at GET
   */

  const httpServer = http.createServer(app)

  socketSever = new SocketServerNode({
    httpServer
  })

  httpServer.listen(port, () => logger.info(`Server is running at port ${port}`, { source: 'socket-server' }))

  return socketSever.ready()
}

export function getSocketServer() {
  if (!socketSever) throw new Error('SOCKET_SERVER_NOT_INITIALIZED')
  return socketSever
}

export function setExtensionSocket(ws: WebSocket) {
  extensionSocket = ws
}

export function getExtensionSocket() {
  return extensionSocket
}
