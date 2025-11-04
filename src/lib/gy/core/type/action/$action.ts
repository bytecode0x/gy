import { ActionInterfaceSuperset, ActionInterfaceSuperset201 } from './action.interface'

export interface $Action201<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> {
  id: string
  schema: string
  name: string
  template: TActionInterface['template']
  state: 'RESOLVED' | 'PENDING' | 'WATING'
  value: TActionInterface['schema']
}

export type $Action<T extends ActionInterfaceSuperset = ActionInterfaceSuperset> = $Action201<T>
