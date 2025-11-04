import { Trigger } from './trigger'
import { TriggerInterfaceSuperset } from './trigger.interface'

export type TriggerDefiner<TTriggerInterface extends TriggerInterfaceSuperset = TriggerInterfaceSuperset> = {
  [Template in TTriggerInterface['template']]: ({
    pid,
    value,
    name
  }: {
    name: Trigger<Extract<TTriggerInterface, { template: Template }>>['name']
    value: Trigger<Extract<TTriggerInterface, { template: Template }>>['value']
    pid: string
  }) => Promise<Trigger<Extract<TTriggerInterface, { template: Template }>>>
}
