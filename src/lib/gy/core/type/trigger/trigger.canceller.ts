import { Trigger } from './trigger'
import { TriggerInterfaceSuperset } from './trigger.interface'

export type TriggerCanceller<TTriggerInterface extends TriggerInterfaceSuperset = TriggerInterfaceSuperset> = {
  [Template in TTriggerInterface['template']]: (
    trigger: Trigger<Extract<TTriggerInterface, { template: Template }>>
  ) => Promise<any>
}
