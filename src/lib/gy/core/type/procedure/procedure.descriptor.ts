import { Effect } from '../effect'
import { TriggerInterfaceSuperset } from '../trigger'
import { Trigger } from '../trigger/trigger'
import { ProcedureConfig } from './procedure.config'
import { Tag } from './procedure.tag'

export type ProcedureDescriptor200 = {
  name: string
  pid: string
  hash: string
  tags?: Array<Tag>
  version: string
  descriptive: string
  backgroundAvailability?: boolean
  triggers: Array<Array<Trigger<TriggerInterfaceSuperset>>>
  config: ProcedureConfig
  size: number
  effect: Effect
}

// this should be created and handled in only was
export type ProcedureDescriptor<TTriggerPreset extends TriggerInterfaceSuperset = TriggerInterfaceSuperset> =
  ProcedureDescriptor201<TTriggerPreset>

export type ProcedureDescriptor201<TTriggerPreset extends TriggerInterfaceSuperset = TriggerInterfaceSuperset> = {
  name: string
  pid: string
  hash: string
  tags?: Array<Tag>
  version: string
  descriptive: string
  backgroundAvailability?: boolean
  triggers: Array<Array<Trigger<TTriggerPreset>>>
  config: ProcedureConfig
  // size: number
  effect: Effect
}
