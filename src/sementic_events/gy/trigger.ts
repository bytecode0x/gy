import { EventMatrix } from 'lib/event/type'
import { Trigger } from 'lib/gy/core/type/trigger'
import { TriggerPreset } from 'local/desktop/main/gy/type/trigger.preset'

export type SetTrigger = EventMatrix<
  'SET_TRIGGER',
  'BACKGROUND' | 'CONTENT_SCRIPT',
  'MAIN',
  { trigger: Trigger<TriggerPreset> }
>

export type CancelTrigger = EventMatrix<
  'CANCEL_TRIGGER',
  'BACKGROUND' | 'CONTENT_SCRIPT',
  'MAIN',
  { trigger: Trigger<TriggerPreset> }
>
