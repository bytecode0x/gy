import { ActionInterfaceSuperset200 } from './action.interface'

export interface $ActionRecord200<T extends ActionInterfaceSuperset200 = ActionInterfaceSuperset200> {
  id: string
  schema: string
  name: string
  template: T['template']
  state: 'RESOLVED' | 'PENDING' | 'WATING'
  value: T['value']
}
