import { BackgroundReady } from 'sementic_events'
import { getEvHandler, initEventHandler } from './event/entity/background-event-handler'
import { initBackgroundToMainEventInterface } from './event/interfaces'
import { initSocketClient } from './infra/socket-client'

initEventHandler()

initSocketClient().then(function () {
  const evHandler = getEvHandler()

  evHandler.addInterface('MAIN', initBackgroundToMainEventInterface(evHandler))

  return evHandler.sendEvent<BackgroundReady>({
    name: 'BACKGROUND_READY',
    meta: { receiver: { component: 'MAIN', alias: 'MAIN' } }
  })
})

console.log('background-script executed')
