import { TriggerDefiner } from 'lib/gy/core/type/trigger/trigger.definer'
import { v4 } from 'uuid'
import { TriggerPreset } from '../type/trigger.preset'

export const definer: TriggerDefiner<TriggerPreset> = {
  async DATE_TIME({ name, pid, value }) {
    return {
      id: v4(),
      pid,
      name,
      on: true,
      template: 'DATE_TIME',
      value
    }
  },

  async CONTEXT_BUTTON({ name, pid, value }) {
    return {
      id: v4(),
      pid,
      name,
      on: true,
      template: 'CONTEXT_BUTTON',
      value
    }
  }
}
