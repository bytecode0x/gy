import { TriggerInterfaceSuperset } from './trigger.interface'

export type Trigger<T extends TriggerInterfaceSuperset = TriggerInterfaceSuperset> = {
  id: string
  name: string
  template: T['template']
  value: T['value']
  pid: string
  on: boolean
}
