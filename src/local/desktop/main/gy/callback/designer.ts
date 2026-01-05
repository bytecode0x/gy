import { InputActionSchema } from 'lib/event/sementic'
import { ActionDesigner, ActionSchema } from 'lib/gy/core/type/action'
import { getExtensionTab } from '../../extension'
import { getEvHandler } from '../../infra/event/event-handler'
import {
    __Action__Click,
    __Action__Define,
    __Action__EditImage,
    __Action__EvalBindingTab,
    __Action__Extract,
    __Action__InitiateProcedure,
    __Action__LoadUrl,
    __Action__OpenAIAssistant,
    __Action__Pause,
    __Action__Scrape,
    __Action__Select,
    __Action__Type,
    ActionPreset
} from '../type/action.preset'

export const SNAPSHOT_MAX_DATA_LENGTH = 100

export const SNAPSHOT_MAX_ROW_LENGTH = 3

export const SNAPSHOT_MAX_COL_LENGTH = 3

export const designer: ActionDesigner<ActionPreset> = {
  async EDIT_IMAGE(partial: Partial<ActionSchema<__Action__EditImage>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__EditImage>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },

  async CLICK(partial: Partial<ActionSchema<__Action__Click>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__Click>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async DEFINE(partial: Partial<ActionSchema<__Action__Define>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__Define>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async EVAL_BINDING_TAB(partial: Partial<ActionSchema<__Action__EvalBindingTab>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__EvalBindingTab>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async EXTRACT(partial: Partial<ActionSchema<__Action__Extract>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__Extract>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async INITIATE_PROCEDURE(partial: Partial<ActionSchema<__Action__InitiateProcedure>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__InitiateProcedure>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async LOAD_URL(partial: Partial<ActionSchema<__Action__LoadUrl>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__LoadUrl>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async OPEN_AI_ASSISTANT(partial: Partial<ActionSchema<__Action__OpenAIAssistant>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__OpenAIAssistant>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async PAUSE(partial: Partial<ActionSchema<__Action__Pause>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__Pause>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async SCRAPE(partial: Partial<ActionSchema<__Action__Scrape>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__Scrape>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async SELECT(partial: Partial<ActionSchema<__Action__Select>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__Select>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  },
  async TYPE(partial: Partial<ActionSchema<__Action__Type>>) {
    const eh = getEvHandler()

    const ext = getExtensionTab()

    if (!ext || !ext.id) throw new Error('ACTION_DESIGNER:EXTENSION_REQUIRED')

    return eh.sendEvent<InputActionSchema<__Action__Type>>({
      name: 'INPUT_ACTION_SCHEMA',
      payload: partial,
      meta: { receiver: { component: 'CONTENT_SCRIPT', id: ext.id } }
    })
  }
}
