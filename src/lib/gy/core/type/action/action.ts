import { ActionInterfaceSuperset, ActionInterfaceSuperset201 } from './action.interface'

export interface Action201<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> {
  id: string
  // should I put this here?
  schema: string
  // used as data record key
  name: string
  template: TActionInterface['template']
  state: 'RESOLVED' | 'PENDING' | 'WATING'
  /**
   * you can access spread through the action schema matched
   */
  // spread: Record<string, boolean>
  /**
   * this value should include actual values not substitutes
   * and consumed by worker and resolved into data record value
   */
  value: TActionInterface['value']
}

export type Action<T extends ActionInterfaceSuperset = ActionInterfaceSuperset> = Action201<T>
