import { $Action201, ActionInterfaceSuperset201 } from '../action'

export type TaskRecordState = 'UNALLOCATED' | 'PENDING' | 'RESOLVED' | 'CONSUMED' | 'UNFOLDED'

export type Task<TActionInterface extends ActionInterfaceSuperset201 = ActionInterfaceSuperset201> = {
  id: string
  state: TaskRecordState
  root?: boolean
  sharing?: boolean
  leaf?: boolean
  $actions: Array<$Action201<TActionInterface>>
}
