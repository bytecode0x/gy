import { PopupLaunched } from 'sementic_events'
import { initEventHandler } from './event/entity/popup-event-handler'
import { initPopupToBackgroundEventInterface } from './event/interfaces'

console.log()
;(function () {
  const evHandler = initEventHandler()

  evHandler.addInterface('BACKGROUND', initPopupToBackgroundEventInterface(evHandler))

  // evHandler.sendEvent<Echo>('ECHO', 'REPLY TEST')

  evHandler
    .sendEvent<PopupLaunched>({
      name: 'POPUP_LAUNCHED',
      meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
    })
    .catch(function (e) {
      /**
       * desktop client is not launched
       * require to launch it with deep link
       */
    })
    .finally(function () {
      window.close()
    })
})()
