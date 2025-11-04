import chalk from 'chalk'
import net from 'net'
import path from 'path'
import repl from 'repl'
import util from 'util'
import { logger } from './infra/logger'

// repl stands for 'read-eval-print loop'
export function initReplServer(onConnect: (replServer: repl.REPLServer, socket: net.Socket) => any) {
  return new Promise<repl.REPLServer>(function (resolve, reject) {
    let ipcPath = path.join(process.cwd(), '..', '.pipe')
    if (process.platform === 'win32') {
      // named pipe => replacement for unix socket file
      ipcPath = path.join('\\\\.\\pipe', process.cwd(), '..', 'pipe')
    }

    let initialSocket: net.Socket

    const netServer = net
      .createServer(function (socket) {
        initialSocket = socket
        const replServer = repl.start({
          input: socket,
          output: socket,
          useColors: true,
          terminal: true,
          prompt: chalk.magenta('[') + chalk.gray('gy') + chalk.magenta(']') + chalk.blue('>> '),
          breakEvalOnSigint: true,
          replMode: repl.REPL_MODE_STRICT,
          preview: false,
          useGlobal: false,
          ignoreUndefined: true,
          writer(output) {
            if (typeof output === 'string') {
              /**
               * if you want to return raw string just use String.raw
               */
              return output // Return the evaluated string
            }

            if (typeof output === 'object') {
              return ''
            }

            return util.inspect(output)
          }
        })

        onConnect(replServer, socket)

        /**
         * Exit when the REPL is closed
         */
      })
      .listen(15158)

    netServer.on('error', function (err) {
      logger.error('error on net server for repl', { source: 'repl', err })
      reject(err)
    })

    netServer.once('connection', resolve)
  })
}
