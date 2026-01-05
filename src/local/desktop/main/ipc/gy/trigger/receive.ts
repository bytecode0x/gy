import { CancelTrigger, SetTrigger } from 'lib/event/sementic'
import { getGy } from 'local/desktop/main/gy/init'
import { getEvHandler } from 'local/desktop/main/infra/event/event-handler'

export function registerGyTriggerEventListeners() {
  const evHandler = getEvHandler()

  evHandler.onEvent<CancelTrigger>('CANCEL_TRIGGER', function ({ name, payload: { trigger }, meta }) {
    const gy = getGy()

    // @ts-ignore
    return gy.trigger.cancel[trigger.template](trigger)
  })

  evHandler.onEvent<SetTrigger>('SET_TRIGGER', function ({ name, payload: { trigger }, meta }) {
    const gy = getGy()

    // @ts-ignore
    return gy.trigger.set[trigger.template](trigger)
  })
}
