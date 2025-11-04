import { TriggerCanceller } from 'lib/gy/core/type/trigger'
import { RemoveContextMenuItem } from 'sementic_events'
import { getEvHandler } from '../../infra/event/event-handler'
import { getCalendar } from '../../scheduler'
import { TriggerPreset } from '../type/trigger.preset'

export const canceller: TriggerCanceller<TriggerPreset> = {
  async DATE_TIME(trigger) {
    const calendar = getCalendar()
    calendar[trigger.id].job.cancel()
    delete calendar[trigger.id]
  },

  async CONTEXT_BUTTON(trigger) {
    const eh = getEvHandler()
    return eh.sendEvent<RemoveContextMenuItem>({
      name: 'REMOVE_CONTEXT_MENU_ITEM',
      payload: trigger.id,
      meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
    })
  }
}
