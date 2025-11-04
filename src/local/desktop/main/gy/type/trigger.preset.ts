import { TriggerInterface } from 'lib/gy/core/type/trigger'

export type __Trigger__DateTime = TriggerInterface<
  'DATE_TIME',
  {
    $rrule: string
  },
  { '반복 주기'?: string; '예정 시간'?: string }
>

export type __Trigger__ContextButton = TriggerInterface<
  'CONTEXT_BUTTON',
  { name: string; documentUrlPatterns: Array<string> },
  { '버튼 이름': string }
>

export type TriggerPreset = __Trigger__DateTime | __Trigger__ContextButton
