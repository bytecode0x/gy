import chalk from 'chalk'
// import cp from 'child_process'
import net from 'net'
import path from 'path'
import rimraf from 'rimraf'

function getPath() {
  if (process.platform === 'win32') {
    return path.join('\\\\.\\pipe', process.cwd(), 'pipe')
  }

  const ipcPath = path.join(process.cwd(), '.pipe')
  rimraf.sync(ipcPath)
  return ipcPath
}

const ipcPath = getPath()

let command = 'node_modules/.bin/electron'
let args = ['.', '--color']

if (process.platform === 'win32') {
  command = 'cmd'
  args = ['/s', '/c', 'node_modules\\.bin\\electron.cmd . --color']
}

// const subprocess = cp.spawn(command, args, {
//   stdio: ['ignore', process.stdout, process.stderr]
// })

// subprocess.on('exit', function () {
//   process.exit()
// })

function wait() {
  setTimeout(function () {
    const socket = net
      .connect({ port: 15158 }, function () {
        console.log(chalk.green('REPL terminal enabled, type "help" for more details'))

        const { stdin, stdout } = process
        stdin.setRawMode(true)
        stdin.setEncoding('utf8')
        stdin.resume()
        stdin.pipe(socket)

        socket.pipe(stdout)
      })
      .on('error', function () {
        console.error(chalk.yellow('Application is not started yet, retrying to connect'))
        wait()
      })
  }, 1000)
}

wait()
