import { TriggerSetter } from 'lib/gy/core/type/trigger'
import { RRule } from 'rrule'
import { CreateContextMenuItem } from 'sementic_events'
import { getEvHandler } from '../infra/event/event-handler'
import { logger } from '../infra/logger'
import { occurr } from '../scheduler'
import { getGy } from './init'
import { TriggerPreset } from './type/trigger.preset'

export const setter: TriggerSetter<TriggerPreset> = {
  async DATE_TIME(trigger) {
    const { $rrule } = trigger.value

    const rrule = RRule.fromString($rrule)

    const curr = new Date()

    const gy = getGy()

    const descriptor = gy.state.$procedures.find(($) => $.pid === trigger.pid)

    if (!descriptor) throw new Error('TRIGGER_SETTER:DATE_TIME:NO_PROCEDURE')

    return occurr({
      key: trigger.id,
      name: trigger.name,
      rrule,
      point: curr,
      async onTime() {
        await gy.initiate({ pid: trigger.pid })
      },
      onRun() {
        const msg = `running procedure <b>${descriptor.name}</b> scheduled by trigger <b>${trigger.name}</b>`
        // logUser(msg)
        logger.info(msg, { source: 'trigger' })
      }
    })
  },

  async CONTEXT_BUTTON(trigger) {
    const eh = getEvHandler()

    return eh
      .sendEvent<CreateContextMenuItem>({
        name: 'CREATE_CONTEXT_MENU_ITEM',
        payload: {
          options: {
            title: trigger.value.name,
            id: trigger.id,
            documentUrlPatterns: trigger.value.documentUrlPatterns,
            contexts: ['page'],
            type: 'normal'
          },
          pid: trigger.pid
        },
        meta: { receiver: { component: 'BACKGROUND', alias: 'BACKGROUND' } }
      })
      .catch(function () {
        // need to check whether It is connection problem or not

        return eh.expect('extension-connected').then(function () {
          return setter.CONTEXT_BUTTON(trigger)
        })
      })
  }
}
