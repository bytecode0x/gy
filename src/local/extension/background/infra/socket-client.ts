import { LOCAL_SERVER_PORT } from 'specifications'

let socket: WebSocket

export function initSocketClient() {
  return new Promise<void>(function (resolve, reject) {
    try {
      socket = new WebSocket(`ws://localhost:${LOCAL_SERVER_PORT}`)
    } catch (e) {
      return reject(e)
    }
    // let clear: any

    socket.addEventListener('open', handleOpen)
    socket.addEventListener('close', handleClose)
    socket.addEventListener('error', handleError)

    function handleOpen() {
      // clear = setInterval(function ping() {
      //   socket.send('ping')
      // }, 5000)
      console.log('background socket connected to main')

      /**
       * It's too dependant code but considering speciality, It's find
       * you can check the connectivity and call init function on popup window
       * => users can execute a procedure without popup
       */
      // const evHandler = getEvHandler()
      // evHandler.addInterface('MAIN', initBackgroundToMainEventInterface(evHandler))

      resolve()
    }

    function handleClose() {
      // clearInterval(clear)
      console.log('background socket closed')

      // const evHandler = getEvHandler()
      // evHandler.removeInterface('MAIN')
      cleanup()
      reject()
    }

    function handleError() {
      // clearInterval(clear)
      // const evHandler = getEvHandler()
      // evHandler.removeInterface('MAIN')
      cleanup()
      reject()
    }

    function cleanup() {
      socket.removeEventListener('open', handleOpen)
      socket.removeEventListener('close', handleClose)
      socket.removeEventListener('error', handleError)
    }
  })
}

export function getSocketClient() {
  return socket
}

// const handleMessage = ({ data }: any) => {
//   const deserialized = JSON.parse(data.toString()) as SuperCoreLayerMessage

//   const event = new ExtensionEvent({
//     // id: deserialized.id,
//     name: deserialized.name,
//     payload: deserialized.payload,
//     meta: deserialized.meta,
//     err: deserialized.err,
//     reply: (msg) => this._socket?.send(JSON.stringify(msg))
//     /**
//      * this causes an error which socket is null
//      * don't know why
//      */
//     // reply: this._socketReply
//   })
//   this.dispatchEvent(event)
// }

// const handleError = (e: globalThis.Event) => {
//   console.error(`socket error : ${e}`)
// }

// // @ts-ignore
// const handleClose = (e: WebSocketCloseEvent) => {
//   console.log('socket connection closed:', e.code, e.reason)

//   clearInterval(clear)
//   this._socket?.removeEventListener('open', handleOpen)
//   this._socket?.removeEventListener('message', handleMessage)
//   this._socket?.removeEventListener('error', handleError)
//   this._socket?.removeEventListener('close', handleClose)
// }

// this._socket.addEventListener('open', handleOpen)

// this._socket.addEventListener('message', handleMessage)

// this._socket.addEventListener('error', handleError)

// this._socket.addEventListener('close', handleClose)
